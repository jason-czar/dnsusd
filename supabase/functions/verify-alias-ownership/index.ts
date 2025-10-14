import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  aliasId: string;
  domain: string;
  verificationMethod: 'dns' | 'https' | 'both';
  expectedAddresses: { [chain: string]: string };
}

interface VerificationResult {
  success: boolean;
  dnsVerified: boolean;
  httpsVerified: boolean;
  dnssecEnabled: boolean;
  trustScore: number;
  errors: string[];
  warnings: string[];
}

async function verifyDNS(domain: string, expectedAddresses: { [chain: string]: string }): Promise<{
  verified: boolean;
  dnssecEnabled: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Use Google DNS-over-HTTPS API
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`
    );
    
    if (!response.ok) {
      errors.push(`DNS lookup failed: ${response.statusText}`);
      return { verified: false, dnssecEnabled: false, errors, warnings };
    }
    
    const data = await response.json();
    
    // Check DNSSEC
    const dnssecEnabled = data.AD === true; // Authenticated Data flag
    
    if (!data.Answer || data.Answer.length === 0) {
      errors.push('No TXT records found for domain');
      return { verified: false, dnssecEnabled, errors, warnings };
    }
    
    // Parse TXT records for OpenAlias format: oa1:btc recipient_address=<ADDRESS>;
    const txtRecords = data.Answer
      .filter((record: any) => record.type === 16) // TXT records
      .map((record: any) => record.data.replace(/"/g, ''));
    
    let foundValidRecord = false;
    
    for (const [chain, expectedAddress] of Object.entries(expectedAddresses)) {
      const openAliasPattern = new RegExp(`oa1:${chain}\\s+recipient_address=([^;\\s]+)`);
      
      let chainFound = false;
      for (const record of txtRecords) {
        const match = record.match(openAliasPattern);
        if (match) {
          chainFound = true;
          const recordAddress = match[1];
          
          if (recordAddress === expectedAddress) {
            foundValidRecord = true;
          } else {
            errors.push(`Address mismatch for ${chain}: expected ${expectedAddress}, found ${recordAddress}`);
          }
        }
      }
      
      if (!chainFound) {
        warnings.push(`No OpenAlias TXT record found for ${chain}`);
      }
    }
    
    return {
      verified: foundValidRecord && errors.length === 0,
      dnssecEnabled,
      errors,
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`DNS verification error: ${message}`);
    return { verified: false, dnssecEnabled: false, errors, warnings };
  }
}

async function verifyHTTPS(domain: string, expectedAddresses: { [chain: string]: string }): Promise<{
  verified: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const url = `https://${domain}/.well-known/alias.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AliasResolve-Verifier/1.0',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        errors.push('alias.json not found at .well-known/alias.json');
      } else {
        errors.push(`HTTPS verification failed: ${response.statusText}`);
      }
      return { verified: false, errors, warnings };
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      warnings.push('alias.json should be served with Content-Type: application/json');
    }
    
    const data = await response.json();
    
    if (!data.addresses || typeof data.addresses !== 'object') {
      errors.push('Invalid alias.json format: missing or invalid "addresses" field');
      return { verified: false, errors, warnings };
    }
    
    let foundValidAddress = false;
    
    for (const [chain, expectedAddress] of Object.entries(expectedAddresses)) {
      const jsonAddress = data.addresses[chain];
      
      if (!jsonAddress) {
        warnings.push(`No address found for ${chain} in alias.json`);
      } else if (jsonAddress !== expectedAddress) {
        errors.push(`Address mismatch for ${chain}: expected ${expectedAddress}, found ${jsonAddress}`);
      } else {
        foundValidAddress = true;
      }
    }
    
    return {
      verified: foundValidAddress && errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`HTTPS verification error: ${message}`);
    return { verified: false, errors, warnings };
  }
}

function calculateTrustScore(
  dnsVerified: boolean,
  httpsVerified: boolean,
  dnssecEnabled: boolean
): number {
  let score = 50; // Base score
  
  if (dnsVerified) score += 20;
  if (dnssecEnabled) score += 10;
  if (httpsVerified) score += 15;
  if (dnsVerified && httpsVerified) score += 5; // Bonus for both
  
  return Math.min(100, Math.max(0, score));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { aliasId, domain, verificationMethod, expectedAddresses } =
      await req.json() as VerificationRequest;

    console.log('Verifying alias:', { aliasId, domain, verificationMethod });

    const result: VerificationResult = {
      success: false,
      dnsVerified: false,
      httpsVerified: false,
      dnssecEnabled: false,
      trustScore: 0,
      errors: [],
      warnings: [],
    };

    // Verify DNS if required
    if (verificationMethod === 'dns' || verificationMethod === 'both') {
      const dnsResult = await verifyDNS(domain, expectedAddresses);
      result.dnsVerified = dnsResult.verified;
      result.dnssecEnabled = dnsResult.dnssecEnabled;
      result.errors.push(...dnsResult.errors);
      result.warnings.push(...dnsResult.warnings);
    }

    // Verify HTTPS if required
    if (verificationMethod === 'https' || verificationMethod === 'both') {
      const httpsResult = await verifyHTTPS(domain, expectedAddresses);
      result.httpsVerified = httpsResult.verified;
      result.errors.push(...httpsResult.errors);
      result.warnings.push(...httpsResult.warnings);
    }

    // Calculate trust score
    result.trustScore = calculateTrustScore(
      result.dnsVerified,
      result.httpsVerified,
      result.dnssecEnabled
    );

    // Determine overall success
    if (verificationMethod === 'dns') {
      result.success = result.dnsVerified;
    } else if (verificationMethod === 'https') {
      result.success = result.httpsVerified;
    } else {
      result.success = result.dnsVerified || result.httpsVerified;
    }

    // Update the alias record
    const { error: updateError } = await supabase
      .from('aliases')
      .update({
        dns_verified: result.dnsVerified,
        https_verified: result.httpsVerified,
        dnssec_enabled: result.dnssecEnabled,
        trust_score: result.trustScore,
        last_verification_at: new Date().toISOString(),
      })
      .eq('id', aliasId);

    if (updateError) {
      console.error('Error updating alias:', updateError);
      result.errors.push(`Database update failed: ${updateError.message}`);
    }

    console.log('Verification result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Verification error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

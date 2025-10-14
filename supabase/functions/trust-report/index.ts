import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrustReportRequest {
  aliasId?: string;
  domain?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { aliasId, domain } = await req.json() as TrustReportRequest;

    if (!aliasId && !domain) {
      return new Response(
        JSON.stringify({ error: 'Either aliasId or domain is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    let query = supabase.from('aliases').select('*');
    
    if (aliasId) {
      query = query.eq('id', aliasId);
    } else {
      query = query.eq('alias_string', domain);
    }

    const { data: alias, error: aliasError } = await query.single();

    if (aliasError || !alias) {
      return new Response(
        JSON.stringify({ error: 'Alias not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // Build trust report
    const report = {
      alias: alias.alias_string,
      trustScore: alias.trust_score || 0,
      verificationMethod: alias.verification_method,
      lastVerified: alias.last_verification_at,
      proofs: {
        dnsVerified: alias.dns_verified || false,
        httpsVerified: alias.https_verified || false,
        dnssecEnabled: alias.dnssec_enabled || false,
      },
      breakdown: {
        baseScore: 50,
        dnsBonus: alias.dns_verified ? 20 : 0,
        dnssecBonus: alias.dnssec_enabled ? 10 : 0,
        httpsBonus: alias.https_verified ? 15 : 0,
        multiLayerBonus: alias.dns_verified && alias.https_verified ? 5 : 0,
      },
      status: alias.trust_score >= 80 ? 'excellent' : 
              alias.trust_score >= 60 ? 'good' : 
              alias.trust_score >= 40 ? 'fair' : 'poor',
      recommendations: [] as string[],
    };

    // Generate recommendations
    if (!alias.dns_verified) {
      report.recommendations.push('Add OpenAlias TXT records to DNS');
    }
    if (!alias.dnssec_enabled && alias.dns_verified) {
      report.recommendations.push('Enable DNSSEC for enhanced security');
    }
    if (!alias.https_verified) {
      report.recommendations.push('Host alias.json at .well-known/alias.json');
    }
    if (!(alias.dns_verified && alias.https_verified)) {
      report.recommendations.push('Implement both DNS and HTTPS verification for maximum trust');
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Trust report error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

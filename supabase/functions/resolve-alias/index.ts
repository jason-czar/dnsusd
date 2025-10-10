import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * DNS TXT Resolver Module
 * Queries DNS TXT records using DNS-over-HTTPS (Cloudflare)
 * Looks for patterns like: bitcoin=<address>, ethereum=<address>
 */
async function resolveDNS(domain: string, chain: string) {
  console.log(`[DNS] Resolving TXT records for domain: ${domain}, chain: ${chain}`);
  
  try {
    // Use Cloudflare DNS-over-HTTPS API
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`;
    const response = await fetch(dohUrl, {
      headers: { 'accept': 'application/dns-json' }
    });

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[DNS] Raw response:', JSON.stringify(data));

    if (!data.Answer || data.Answer.length === 0) {
      return null;
    }

    // Parse TXT records for crypto aliases
    const txtRecords: string[] = [];
    for (const answer of data.Answer) {
      if (answer.type === 16) { // TXT record
        // Remove quotes from TXT record data
        const recordData = answer.data.replace(/^"|"$/g, '').replace(/\\"/g, '"');
        txtRecords.push(recordData);
        
        // Check for bitcoin= or ethereum= patterns
        const bitcoinMatch = recordData.match(/bitcoin=([a-zA-Z0-9]+)/);
        const ethereumMatch = recordData.match(/ethereum=(0x[a-fA-F0-9]{40})/);

        if (chain === 'bitcoin' || chain === 'all') {
          if (bitcoinMatch) {
            const address = bitcoinMatch[1];
            if (validateBitcoinAddress(address)) {
              console.log('[DNS] Found valid Bitcoin address:', address);
              return {
                address,
                chain: 'bitcoin',
                confidence: 'high',
                proofMetadata: {
                  dnsRecords: txtRecords,
                  source: 'DNS TXT',
                  recordType: 'bitcoin='
                }
              };
            }
          }
        }

        if (chain === 'ethereum' || chain === 'all') {
          if (ethereumMatch) {
            const address = ethereumMatch[1];
            if (validateEthereumAddress(address)) {
              console.log('[DNS] Found valid Ethereum address:', address);
              return {
                address,
                chain: 'ethereum',
                confidence: 'high',
                proofMetadata: {
                  dnsRecords: txtRecords,
                  source: 'DNS TXT',
                  recordType: 'ethereum='
                }
              };
            }
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[DNS] Resolution error:', error);
    throw error;
  }
}

/**
 * ENS Resolver Module
 * Resolves .eth names using Ethereum public RPC
 * Note: This is a simplified implementation. Production would use ethers.js
 */
async function resolveENS(ensName: string) {
  console.log(`[ENS] Resolving ENS name: ${ensName}`);
  
  if (!ensName.endsWith('.eth')) {
    return null;
  }

  try {
    // Use a public Ethereum RPC endpoint
    // In production, you'd want to use ethers.js or viem for proper ENS resolution
    // For now, we'll use Cloudflare's ethereum gateway as a simple example
    
    // This is a placeholder - actual ENS resolution requires proper ENS contract interaction
    // You would typically use ethers.js namehash and resolver contracts
    console.log('[ENS] ENS resolution requires ethers.js library - placeholder implementation');
    
    // For demo purposes, we'll return null and suggest using a library
    // Real implementation would:
    // 1. Namehash the ENS name
    // 2. Query ENS registry for resolver
    // 3. Query resolver for ETH address
    
    return {
      address: null,
      chain: 'ethereum',
      confidence: null,
      proofMetadata: {
        ensResolver: 'ENS resolution requires ethers.js integration',
        source: 'ENS'
      },
      error: 'ENS resolution not yet implemented - requires ethers.js library'
    };
  } catch (error) {
    console.error('[ENS] Resolution error:', error);
    throw error;
  }
}

/**
 * Bitcoin Address Validator
 * Validates Bitcoin addresses (basic validation)
 */
function validateBitcoinAddress(address: string): boolean {
  // Basic validation for Bitcoin addresses
  // P2PKH (starts with 1), P2SH (starts with 3), Bech32 (starts with bc1)
  const bitcoinRegex = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/;
  return bitcoinRegex.test(address);
}

/**
 * Ethereum Address Validator
 * Validates Ethereum addresses (checksum validation omitted for simplicity)
 */
function validateEthereumAddress(address: string): boolean {
  // Basic validation for Ethereum addresses (0x followed by 40 hex chars)
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethereumRegex.test(address);
}

/**
 * Main Resolver Function
 * Orchestrates DNS and ENS resolution based on input
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alias, chain } = await req.json();

    console.log(`[Resolver] Request received - alias: ${alias}, chain: ${chain}`);

    if (!alias || !chain) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: alias and chain',
          alias,
          chain,
          resolvedAddress: null,
          aliasType: null,
          confidence: null,
          proofMetadata: null,
          errorMessage: 'Missing required fields'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    let result = null;
    let aliasType = null;

    // Try ENS resolution first if it looks like an ENS name
    if (alias.endsWith('.eth')) {
      console.log('[Resolver] Detected ENS name, attempting ENS resolution');
      aliasType = 'ens';
      result = await resolveENS(alias);
      
      if (result?.error) {
        // ENS not yet fully implemented
        return new Response(
          JSON.stringify({
            alias,
            chain,
            resolvedAddress: null,
            aliasType,
            confidence: null,
            proofMetadata: result.proofMetadata,
            errorMessage: result.error
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      // Try DNS TXT resolution
      console.log('[Resolver] Attempting DNS TXT resolution');
      aliasType = 'dns';
      result = await resolveDNS(alias, chain);
    }

    // Prepare response
    const responseData = {
      alias,
      chain: result?.chain || chain,
      resolvedAddress: result?.address || null,
      aliasType,
      confidence: result?.confidence || null,
      proofMetadata: result?.proofMetadata || null,
      errorMessage: result ? null : 'No matching alias found for the specified chain'
    };

    // Store lookup in database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('lookups').insert({
        alias,
        chain: responseData.chain,
        resolved_address: responseData.resolvedAddress,
        alias_type: responseData.aliasType,
        confidence: responseData.confidence,
        proof_metadata: responseData.proofMetadata,
        error_message: responseData.errorMessage
      });

      console.log('[Resolver] Lookup stored in database');
    } catch (dbError) {
      console.error('[Resolver] Failed to store lookup:', dbError);
      // Don't fail the request if DB insert fails
    }

    console.log('[Resolver] Response:', JSON.stringify(responseData));

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Resolver] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        alias: null,
        chain: null,
        resolvedAddress: null,
        aliasType: null,
        confidence: null,
        proofMetadata: null,
        errorMessage: `Resolver error: ${errorMessage}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

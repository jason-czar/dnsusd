/**
 * DNS + HTTPS/.well-known Resolver
 * Generic resolver for custom .well-known endpoints beyond LNURLP
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';

export class WellKnownResolver implements IAliasResolver {
  getName(): string {
    return 'DNS + .well-known';
  }

  canResolve(alias: string): boolean {
    // Match domain-like strings but with lower priority
    // Only match domains with common TLDs that aren't handled by other resolvers
    const commonTLDs = ['.com', '.org', '.net', '.io', '.dev', '.app', '.xyz'];
    return commonTLDs.some(tld => alias.toLowerCase().endsWith(tld));
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[WellKnownResolver] Resolving ${alias}`);
    
    const results: ResolvedResult[] = [];
    const domain = alias.toLowerCase();
    
    // Try various .well-known endpoints
    const endpoints = [
      '/.well-known/crypto.json',
      '/.well-known/payment.json',
      '/.well-known/wallet.json',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`https://${domain}${endpoint}`);

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        
        // Look for crypto addresses in various formats
        if (data.addresses && typeof data.addresses === 'object') {
          for (const [currency, address] of Object.entries(data.addresses)) {
            if (typeof address === 'string' && 
                (!chain || chain === 'all' || currency.toLowerCase() === chain.toLowerCase())) {
              results.push({
                source_type: 'well_known',
                currency: currency.toLowerCase(),
                address,
                raw_data: {
                  domain,
                  endpoint,
                  data,
                },
                confidence: 0.82,
              });
            }
          }
        }

        // Look for direct address fields
        if (data.bitcoin && (!chain || chain === 'all' || chain === 'bitcoin')) {
          results.push({
            source_type: 'well_known',
            currency: 'bitcoin',
            address: data.bitcoin,
            raw_data: { domain, endpoint, data },
            confidence: 0.82,
          });
        }

        if (data.ethereum && (!chain || chain === 'all' || chain === 'ethereum')) {
          results.push({
            source_type: 'well_known',
            currency: 'ethereum',
            address: data.ethereum,
            raw_data: { domain, endpoint, data },
            confidence: 0.82,
          });
        }

        // If we found results, no need to try other endpoints
        if (results.length > 0) break;
        
      } catch (error) {
        console.log(`[WellKnownResolver] Error with ${endpoint}:`, error);
        continue;
      }
    }

    console.log(`[WellKnownResolver] Found ${results.length} addresses`);
    return results;
  }
}

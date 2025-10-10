/**
 * DNS TXT Resolver Module
 * Resolves cryptocurrency addresses from DNS TXT records
 * Supports patterns like: bitcoin=<address>, ethereum=<address>, crypto:btc=<address>
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';
import { validateAddress } from '../validators/addressValidator.ts';

export class DNSResolver implements IAliasResolver {
  getName(): string {
    return 'DNS TXT';
  }

  canResolve(alias: string): boolean {
    // Can resolve any domain-like string (not .eth)
    return alias.includes('.') && !alias.endsWith('.eth');
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[DNSResolver] Resolving ${alias} for chain: ${chain || 'all'}`);
    
    try {
      // Use Cloudflare DNS-over-HTTPS
      const dohUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(alias)}&type=TXT`;
      const response = await fetch(dohUrl, {
        headers: { 'accept': 'application/dns-json' }
      });

      if (!response.ok) {
        console.error(`[DNSResolver] DNS query failed: ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      
      if (!data.Answer || data.Answer.length === 0) {
        console.log('[DNSResolver] No TXT records found');
        return [];
      }

      const results: ResolvedResult[] = [];
      const txtRecords: string[] = [];

      // Parse all TXT records
      for (const answer of data.Answer) {
        if (answer.type === 16) { // TXT record
          // Remove quotes and join multiple strings
          const recordData = answer.data.replace(/^"|"$/g, '').replace(/\\"/g, '"');
          txtRecords.push(recordData);
          
          // Parse various patterns
          const patterns = [
            // Standard patterns: bitcoin=, ethereum=
            { regex: /bitcoin=([a-zA-Z0-9]+)/i, currency: 'bitcoin' },
            { regex: /btc=([a-zA-Z0-9]+)/i, currency: 'bitcoin' },
            { regex: /ethereum=(0x[a-fA-F0-9]{40})/i, currency: 'ethereum' },
            { regex: /eth=(0x[a-fA-F0-9]{40})/i, currency: 'ethereum' },
            
            // Crypto URI patterns: crypto:btc=, crypto:eth=
            { regex: /crypto:btc=([a-zA-Z0-9]+)/i, currency: 'bitcoin' },
            { regex: /crypto:eth=(0x[a-fA-F0-9]{40})/i, currency: 'ethereum' },
            
            // PayString-like patterns
            { regex: /\$([a-z]+)\/([a-zA-Z0-9.]+)/i, currency: 'various' },
          ];

          for (const pattern of patterns) {
            // Skip if chain filter doesn't match
            if (chain && chain !== 'all' && pattern.currency !== chain.toLowerCase()) {
              continue;
            }

            const match = recordData.match(pattern.regex);
            if (match) {
              const address = match[1];
              
              // Validate address format
              if (validateAddress(address, pattern.currency)) {
                console.log(`[DNSResolver] Found valid ${pattern.currency} address: ${address}`);
                
                results.push({
                  source_type: 'dns_txt',
                  currency: pattern.currency,
                  address: address,
                  raw_data: {
                    dns_records: txtRecords,
                    matched_pattern: pattern.regex.source,
                    full_record: recordData
                  },
                  confidence: 0.75 // DNS has medium-high confidence
                });
              } else {
                console.log(`[DNSResolver] Found ${pattern.currency} pattern but invalid address: ${address}`);
              }
            }
          }
        }
      }

      console.log(`[DNSResolver] Found ${results.length} valid results`);
      return results;

    } catch (error) {
      console.error('[DNSResolver] Error:', error);
      return [];
    }
  }
}

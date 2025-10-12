/**
 * Handshake (HNS) Resolver
 * Resolves Handshake domains via HNS gateway
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';

export class HandshakeResolver implements IAliasResolver {
  private readonly HNS_GATEWAY = 'https://query.htools.work';

  getName(): string {
    return 'Handshake (HNS)';
  }

  canResolve(alias: string): boolean {
    // Handshake domains are single-word TLDs without dots (unless explicitly marked with /)
    // Avoid conflicting with other resolvers by checking for HNS-specific patterns
    // Only resolve if explicitly marked with / or if it's a single word without common TLDs
    if (alias.endsWith('/')) return true;
    if (alias.includes('.')) return false;
    // Single word domains could be HNS
    return alias.length > 0 && /^[a-z0-9-]+$/.test(alias);
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[HandshakeResolver] Resolving ${alias}`);
    
    const results: ResolvedResult[] = [];
    const domain = alias.replace(/\/$/, ''); // Remove trailing slash
    
    try {
      // Query HNS gateway for TXT records
      const response = await fetch(
        `${this.HNS_GATEWAY}/dns/query?name=${encodeURIComponent(domain)}&type=TXT`
      );

      if (!response.ok) {
        console.log(`[HandshakeResolver] Gateway returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.Answer && Array.isArray(data.Answer)) {
        for (const record of data.Answer) {
          if (record.type === 16 && record.data) { // TXT record
            const txtData = record.data;
            
            // Parse Bitcoin addresses
            const btcMatch = txtData.match(/bitcoin[=:]([a-zA-Z0-9]+)/i);
            if (btcMatch && (!chain || chain === 'all' || chain === 'bitcoin')) {
              results.push({
                source_type: 'handshake',
                currency: 'bitcoin',
                address: btcMatch[1],
                raw_data: {
                  domain,
                  txt_record: txtData,
                  hns_gateway: this.HNS_GATEWAY,
                },
                confidence: 0.85,
              });
            }

            // Parse Ethereum addresses
            const ethMatch = txtData.match(/ethereum[=:](0x[a-fA-F0-9]{40})/i);
            if (ethMatch && (!chain || chain === 'all' || chain === 'ethereum')) {
              results.push({
                source_type: 'handshake',
                currency: 'ethereum',
                address: ethMatch[1],
                raw_data: {
                  domain,
                  txt_record: txtData,
                  hns_gateway: this.HNS_GATEWAY,
                },
                confidence: 0.85,
              });
            }
          }
        }
      }

      console.log(`[HandshakeResolver] Found ${results.length} addresses`);
      
    } catch (error) {
      console.error(`[HandshakeResolver] Error:`, error);
    }

    return results;
  }
}

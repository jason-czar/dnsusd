/**
 * Bitcoin Name System (BNS) Resolver
 * Stacks-based naming system
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';

export class BNSResolver implements IAliasResolver {
  private readonly STACKS_API = 'https://api.hiro.so';

  getName(): string {
    return 'Bitcoin Name System (BNS)';
  }

  canResolve(alias: string): boolean {
    // BNS names are in format: name.namespace (e.g., muneeb.id, alice.btc)
    return alias.includes('.') && !alias.endsWith('.eth') && !alias.endsWith('.crypto');
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[BNSResolver] Resolving ${alias}`);
    
    const results: ResolvedResult[] = [];
    
    try {
      // Query Stacks BNS API
      const response = await fetch(
        `${this.STACKS_API}/v1/names/${encodeURIComponent(alias)}`
      );

      if (!response.ok) {
        console.log(`[BNSResolver] API returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      // Get the owner's STX address
      if (data.address) {
        if (!chain || chain === 'all' || chain === 'stacks' || chain === 'bitcoin') {
          results.push({
            source_type: 'bns',
            currency: 'stacks',
            address: data.address,
            raw_data: {
              name: alias,
              namespace: data.namespace,
              zonefile: data.zonefile,
              status: data.status,
            },
            confidence: 0.88,
          });
        }
      }

      // Parse zonefile for additional addresses
      if (data.zonefile) {
        // Look for Bitcoin addresses in zonefile
        const btcMatch = data.zonefile.match(/bitcoin[=:]([a-zA-Z0-9]+)/i);
        if (btcMatch && (!chain || chain === 'all' || chain === 'bitcoin')) {
          results.push({
            source_type: 'bns',
            currency: 'bitcoin',
            address: btcMatch[1],
            raw_data: {
              name: alias,
              zonefile: data.zonefile,
            },
            confidence: 0.85,
          });
        }

        // Look for Ethereum addresses in zonefile
        const ethMatch = data.zonefile.match(/ethereum[=:](0x[a-fA-F0-9]{40})/i);
        if (ethMatch && (!chain || chain === 'all' || chain === 'ethereum')) {
          results.push({
            source_type: 'bns',
            currency: 'ethereum',
            address: ethMatch[1],
            raw_data: {
              name: alias,
              zonefile: data.zonefile,
            },
            confidence: 0.85,
          });
        }
      }

      console.log(`[BNSResolver] Found ${results.length} addresses`);
      
    } catch (error) {
      console.error(`[BNSResolver] Error:`, error);
    }

    return results;
  }
}

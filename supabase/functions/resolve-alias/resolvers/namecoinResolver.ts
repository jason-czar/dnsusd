/**
 * Namecoin (.bit) Resolver
 * Resolves .bit domains via Namecoin blockchain
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';

export class NamecoinResolver implements IAliasResolver {
  getName(): string {
    return 'Namecoin (.bit)';
  }

  canResolve(alias: string): boolean {
    return alias.toLowerCase().endsWith('.bit');
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[NamecoinResolver] Resolving ${alias}`);
    
    const results: ResolvedResult[] = [];
    const domain = alias.toLowerCase().replace(/\.bit$/, '');
    
    try {
      // Use public Namecoin explorer API
      const response = await fetch(
        `https://namecoin.webbtc.com/name/${encodeURIComponent(`d/${domain}`)}.json`
      );

      if (!response.ok) {
        console.log(`[NamecoinResolver] API returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.value) {
        let value = data.value;
        
        // Try to parse as JSON
        try {
          value = JSON.parse(value);
        } catch {
          // Not JSON, treat as string
        }

        // Extract Bitcoin address
        const btcAddress = value?.bitcoin || value?.btc;
        if (btcAddress && (!chain || chain === 'all' || chain === 'bitcoin')) {
          results.push({
            source_type: 'namecoin',
            currency: 'bitcoin',
            address: btcAddress,
            raw_data: {
              domain: alias,
              name_data: value,
            },
            confidence: 0.85,
          });
        }

        // Extract Ethereum address
        const ethAddress = value?.ethereum || value?.eth;
        if (ethAddress && (!chain || chain === 'all' || chain === 'ethereum')) {
          results.push({
            source_type: 'namecoin',
            currency: 'ethereum',
            address: ethAddress,
            raw_data: {
              domain: alias,
              name_data: value,
            },
            confidence: 0.85,
          });
        }
      }

      console.log(`[NamecoinResolver] Found ${results.length} addresses`);
      
    } catch (error) {
      console.error(`[NamecoinResolver] Error:`, error);
    }

    return results;
  }
}

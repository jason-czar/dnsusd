/**
 * Zilliqa Name Service (ZNS) Resolver
 * Supports .zil domains
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';

export class ZNSResolver implements IAliasResolver {
  private readonly ZILLIQA_API = 'https://api.zilliqa.com';

  getName(): string {
    return 'Zilliqa Name Service (ZNS)';
  }

  canResolve(alias: string): boolean {
    return alias.toLowerCase().endsWith('.zil');
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[ZNSResolver] Resolving ${alias}`);
    
    const results: ResolvedResult[] = [];
    const domain = alias.toLowerCase();
    
    try {
      // Query ZNS registry via Zilliqa JSON-RPC
      const response = await fetch(this.ZILLIQA_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: '1',
          jsonrpc: '2.0',
          method: 'GetSmartContractSubState',
          params: [
            '0x9611c53BE6d1b32058b2747bdeCECed7e1216793', // ZNS Registry contract
            'records',
            [domain.replace('.zil', '')]
          ]
        })
      });

      if (!response.ok) {
        console.log(`[ZNSResolver] API returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.result?.records) {
        const records = data.result.records;
        
        // Get resolver address
        const resolverAddr = records[domain.replace('.zil', '')]?.arguments?.[1];
        
        if (resolverAddr) {
          // Query resolver for addresses
          const resolverResponse = await fetch(this.ZILLIQA_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: '1',
              jsonrpc: '2.0',
              method: 'GetSmartContractState',
              params: [resolverAddr]
            })
          });

          if (resolverResponse.ok) {
            const resolverData = await resolverResponse.json();
            const state = resolverData.result || {};

            // Extract Zilliqa address
            if (state.address && (!chain || chain === 'all' || chain === 'zilliqa')) {
              results.push({
                source_type: 'zns',
                currency: 'zilliqa',
                address: state.address,
                raw_data: {
                  domain,
                  resolver: resolverAddr,
                  state,
                },
                confidence: 0.9,
              });
            }

            // Extract other crypto addresses from records
            if (state.crypto) {
              for (const [currency, address] of Object.entries(state.crypto)) {
                if (!chain || chain === 'all' || currency.toLowerCase() === chain.toLowerCase()) {
                  results.push({
                    source_type: 'zns',
                    currency: currency.toLowerCase(),
                    address: address as string,
                    raw_data: {
                      domain,
                      resolver: resolverAddr,
                    },
                    confidence: 0.9,
                  });
                }
              }
            }
          }
        }
      }

      console.log(`[ZNSResolver] Found ${results.length} addresses`);
      
    } catch (error) {
      console.error(`[ZNSResolver] Error:`, error);
    }

    return results;
  }
}

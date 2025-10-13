/**
 * Unstoppable Domains Resolver
 * Supports .crypto, .nft, .blockchain, .dao, .wallet, .x, .888, .zil, etc.
 * Uses Unstoppable Domains Resolution API
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';

export class UnstoppableDomainsResolver implements IAliasResolver {
  private readonly UD_SUFFIXES = [
    '.crypto', '.nft', '.blockchain', '.dao', '.wallet', 
    '.x', '.888', '.zil', '.bitcoin', '.coin', '.binanceus'
  ];

  getName(): string {
    return 'Unstoppable Domains';
  }

  canResolve(alias: string): boolean {
    return this.UD_SUFFIXES.some(suffix => alias.toLowerCase().endsWith(suffix));
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[UnstoppableDomainsResolver] Resolving ${alias} for chain: ${chain || 'all'}`);
    
    const results: ResolvedResult[] = [];
    
    try {
      // Call Unstoppable Domains resolution API
      const response = await fetch(
        `https://api.unstoppabledomains.com/resolve/domains/${encodeURIComponent(alias)}`,
        {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('UNSTOPPABLE_API_KEY') || ''}`,
          }
        }
      );

      if (!response.ok) {
        console.log(`[UnstoppableDomainsResolver] API returned ${response.status}: ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log(`[UnstoppableDomainsResolver] API Response:`, JSON.stringify(data, null, 2));
      
      const records = data.records || {};
      const recordKeys = Object.keys(records);
      console.log(`[UnstoppableDomainsResolver] Found ${recordKeys.length} records:`, recordKeys);

      // Map of record keys to currencies - based on UD documentation
      const currencyMap: Record<string, string> = {
        'crypto.BTC.address': 'bitcoin',
        'crypto.ETH.address': 'ethereum',
        'crypto.USDT.version.ERC20.address': 'ethereum',
        'crypto.USDC.version.ERC20.address': 'ethereum',
        'crypto.ADA.address': 'cardano',
        'crypto.SOL.address': 'solana',
        'crypto.MATIC.address': 'polygon',
        'crypto.MATIC.version.MATIC.address': 'polygon',
        'crypto.AVAX.version.C.address': 'avalanche',
        'crypto.DOT.address': 'polkadot',
        'crypto.LTC.address': 'litecoin',
        'crypto.DOGE.address': 'dogecoin',
        'crypto.XRP.address': 'ripple',
      };

      // Process each currency mapping
      for (const [recordKey, currency] of Object.entries(currencyMap)) {
        const address = records[recordKey];
        
        if (address && typeof address === 'string' && address.trim() !== '') {
          // Filter by chain if specified
          if (chain && chain !== 'all' && currency !== chain.toLowerCase()) {
            console.log(`[UnstoppableDomainsResolver] Skipping ${currency} (filtering for ${chain})`);
            continue;
          }

          console.log(`[UnstoppableDomainsResolver] Found ${currency} address: ${address}`);
          
          results.push({
            source_type: 'unstoppable_domains',
            currency,
            address: address.trim(),
            raw_data: {
              domain: alias,
              record_key: recordKey,
              blockchain: data.meta?.blockchain,
              owner: data.meta?.owner,
              all_records: records,
            },
            confidence: 0.95, // High confidence for UD
          });
        }
      }

      if (results.length === 0 && recordKeys.length > 0) {
        console.log(`[UnstoppableDomainsResolver] Domain exists but no crypto addresses found. Available records:`, recordKeys);
      }

      console.log(`[UnstoppableDomainsResolver] Returning ${results.length} crypto address(es)`);
      
    } catch (error) {
      console.error(`[UnstoppableDomainsResolver] Error:`, error);
    }

    return results;
  }
}

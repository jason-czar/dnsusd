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
    console.log(`[UnstoppableDomainsResolver] Resolving ${alias}`);
    
    const results: ResolvedResult[] = [];
    
    try {
      // First try resolution endpoint for crypto records
      const resolutionResponse = await fetch(
        `https://api.unstoppabledomains.com/resolve/domains/${encodeURIComponent(alias)}`,
        {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('UNSTOPPABLE_API_KEY') || ''}`,
          }
        }
      );

      let records: any = {};
      
      if (resolutionResponse.ok) {
        const resolutionData = await resolutionResponse.json();
        console.log(`[UnstoppableDomainsResolver] Resolution data:`, JSON.stringify(resolutionData));
        records = resolutionData.records || {};
      } else {
        console.log(`[UnstoppableDomainsResolver] Resolution API returned ${resolutionResponse.status}, trying metadata`);
        
        // Fallback to metadata endpoint (works without auth)
        const metadataResponse = await fetch(
          `https://api.unstoppabledomains.com/metadata/${encodeURIComponent(alias)}`
        );
        
        if (metadataResponse.ok) {
          const metadataData = await metadataResponse.json();
          console.log(`[UnstoppableDomainsResolver] Metadata data:`, JSON.stringify(metadataData));
          records = metadataData.records || {};
        }
      }

      // Map of record keys to currencies
      const currencyMap: Record<string, string> = {
        'crypto.BTC.address': 'bitcoin',
        'crypto.ETH.address': 'ethereum',
        'crypto.USDT.version.ERC20.address': 'ethereum',
        'crypto.ADA.address': 'cardano',
        'crypto.SOL.address': 'solana',
        'crypto.MATIC.address': 'polygon',
        'wallet.address': 'ethereum', // Generic wallet address
      };

      // Check if domain exists but has no crypto records
      if (Object.keys(records).length > 0) {
        console.log(`[UnstoppableDomainsResolver] Found ${Object.keys(records).length} total records`);
      }

      for (const [key, currency] of Object.entries(currencyMap)) {
        if (records[key]) {
          // Filter by chain if specified
          if (chain && chain !== 'all' && currency !== chain.toLowerCase()) {
            continue;
          }

          results.push({
            source_type: 'unstoppable_domains',
            currency,
            address: records[key],
            raw_data: {
              domain: alias,
              record_key: key,
              all_records: records,
            },
            confidence: 0.9, // High confidence for UD
          });
        }
      }

      console.log(`[UnstoppableDomainsResolver] Found ${results.length} addresses`);
      
    } catch (error) {
      console.error(`[UnstoppableDomainsResolver] Error:`, error);
    }

    return results;
  }
}

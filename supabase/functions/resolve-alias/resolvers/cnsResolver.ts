/**
 * Cardano Name Service (CNS) Resolver
 * Supports $adahandles and .ada domains
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';

export class CNSResolver implements IAliasResolver {
  private readonly ADA_HANDLE_POLICY = 'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a';

  getName(): string {
    return 'Cardano Name Service (CNS)';
  }

  canResolve(alias: string): boolean {
    return alias.startsWith('$') || alias.toLowerCase().endsWith('.ada');
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[CNSResolver] Resolving ${alias}`);
    
    // Only resolve for Cardano chain
    if (chain && chain !== 'all' && chain !== 'cardano' && chain !== 'ada') {
      return [];
    }

    const results: ResolvedResult[] = [];
    const handle = alias.startsWith('$') ? alias.substring(1) : alias.replace('.ada', '');
    
    try {
      // Convert handle to hex using TextEncoder (Deno compatible)
      const encoder = new TextEncoder();
      const assetNameBytes = encoder.encode(handle);
      const assetName = Array.from(assetNameBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Query Cardano blockchain via Koios API
      const response = await fetch(
        `https://api.koios.rest/api/v1/asset_address_list?_asset_policy=${this.ADA_HANDLE_POLICY}&_asset_name=${assetName}`
      );

      if (!response.ok) {
        console.log(`[CNSResolver] API returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const address = data[0].payment_address;
        
        results.push({
          source_type: 'cardano_name_service',
          currency: 'cardano',
          address,
          raw_data: {
            handle: alias,
            policy_id: this.ADA_HANDLE_POLICY,
            asset_name: assetName,
          },
          confidence: 0.92,
        });
      }

      console.log(`[CNSResolver] Found ${results.length} addresses`);
      
    } catch (error) {
      console.error(`[CNSResolver] Error:`, error);
    }

    return results;
  }
}

/**
 * ENS (Ethereum Name Service) Resolver Module
 * Resolves .eth names to Ethereum addresses using ethers.js
 * Requires ETHEREUM_RPC_URL environment variable (Infura, Alchemy, etc.)
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';
import { validateEthereumAddress } from '../validators/addressValidator.ts';

export class ENSResolver implements IAliasResolver {
  getName(): string {
    return 'ENS';
  }

  canResolve(alias: string): boolean {
    // Only resolve .eth domains
    return alias.toLowerCase().endsWith('.eth');
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[ENSResolver] Resolving ${alias}`);
    
    // If chain filter is specified and not ethereum, skip
    if (chain && chain !== 'all' && chain !== 'ethereum') {
      console.log('[ENSResolver] Chain filter does not match ethereum, skipping');
      return [];
    }

    try {
      // Dynamic import of ethers (NPM package available in Deno via esm.sh)
      const { ethers } = await import('https://esm.sh/ethers@6');
      
      // Get Ethereum RPC URL from environment
      const rpcUrl = Deno.env.get('ETHEREUM_RPC_URL') || 'https://eth.llamarpc.com';
      console.log(`[ENSResolver] Using RPC: ${rpcUrl}`);
      
      // Create provider
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Resolve ENS name to address
      const address = await provider.resolveName(alias);
      
      if (!address) {
        console.log('[ENSResolver] No address found for ENS name');
        return [];
      }

      // Validate the resolved address
      if (!validateEthereumAddress(address)) {
        console.error('[ENSResolver] Invalid Ethereum address returned:', address);
        return [];
      }

      console.log(`[ENSResolver] Resolved ${alias} to ${address}`);

      // Try to get resolver and text records for additional proof
      let resolverAddress = null;
      let textRecords: Record<string, string> = {};
      
      try {
        const resolver = await provider.getResolver(alias);
        if (resolver) {
          resolverAddress = resolver.address;
          
          // Try to fetch common text records
          const commonKeys = ['email', 'url', 'avatar', 'description', 'notice'];
          for (const key of commonKeys) {
            try {
              const value = await resolver.getText(key);
              if (value) textRecords[key] = value;
            } catch (e) {
              // Text record doesn't exist, skip
            }
          }
        }
      } catch (e) {
        console.log('[ENSResolver] Could not fetch resolver details:', e);
      }

      return [{
        source_type: 'ens',
        currency: 'ethereum',
        address: address,
        raw_data: {
          ens_name: alias,
          resolver_address: resolverAddress,
          text_records: textRecords,
          rpc_url: rpcUrl
        },
        confidence: 0.95 // ENS has very high confidence
      }];

    } catch (error) {
      console.error('[ENSResolver] Error resolving ENS:', error);
      
      // Check if it's an environment issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('RPC')) {
        console.error('[ENSResolver] RPC connection issue - check ETHEREUM_RPC_URL');
      }
      
      return [];
    }
  }
}

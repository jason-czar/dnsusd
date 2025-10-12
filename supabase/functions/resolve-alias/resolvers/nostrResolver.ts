/**
 * Nostr NIP-05 Resolver
 * Resolves user@domain Nostr identifiers
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';

export class NostrResolver implements IAliasResolver {
  getName(): string {
    return 'Nostr NIP-05';
  }

  canResolve(alias: string): boolean {
    // NIP-05 format: user@domain
    return /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(alias);
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[NostrResolver] Resolving ${alias}`);
    
    const results: ResolvedResult[] = [];
    const [username, domain] = alias.split('@');
    
    try {
      // Query .well-known/nostr.json endpoint
      const response = await fetch(
        `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        console.log(`[NostrResolver] Endpoint returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.names && data.names[username]) {
        const pubkey = data.names[username];
        
        results.push({
          source_type: 'nostr_nip05',
          currency: 'nostr',
          address: pubkey,
          raw_data: {
            identifier: alias,
            domain,
            username,
            relays: data.relays?.[pubkey] || [],
          },
          confidence: 0.92,
        });

        // Check for Lightning address in metadata
        if (data.lud16 || data.lud06) {
          const lnAddress = data.lud16 || data.lud06;
          if (!chain || chain === 'all' || chain === 'lightning' || chain === 'bitcoin') {
            results.push({
              source_type: 'nostr_nip05',
              currency: 'lightning',
              address: lnAddress,
              raw_data: {
                identifier: alias,
                nostr_pubkey: pubkey,
              },
              confidence: 0.88,
            });
          }
        }
      }

      console.log(`[NostrResolver] Found ${results.length} addresses`);
      
    } catch (error) {
      console.error(`[NostrResolver] Error:`, error);
    }

    return results;
  }
}

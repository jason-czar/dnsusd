/**
 * WebFinger/OpenID Resolver
 * Resolves identity aliases via WebFinger protocol
 */

import { IAliasResolver, ResolvedResult } from '../types.ts';

export class WebFingerResolver implements IAliasResolver {
  getName(): string {
    return 'WebFinger/OpenID';
  }

  canResolve(alias: string): boolean {
    // WebFinger uses acct: scheme or email-like identifiers
    return alias.startsWith('acct:') || /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(alias);
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    console.log(`[WebFingerResolver] Resolving ${alias}`);
    
    const results: ResolvedResult[] = [];
    
    // Parse the identifier
    let resource = alias;
    let domain = '';
    
    if (alias.startsWith('acct:')) {
      resource = alias;
      const match = alias.match(/acct:([^@]+)@(.+)/);
      if (match) domain = match[2];
    } else {
      resource = `acct:${alias}`;
      domain = alias.split('@')[1];
    }
    
    if (!domain) return [];
    
    try {
      // Query WebFinger endpoint
      const response = await fetch(
        `https://${domain}/.well-known/webfinger?resource=${encodeURIComponent(resource)}`
      );

      if (!response.ok) {
        console.log(`[WebFingerResolver] Endpoint returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.links && Array.isArray(data.links)) {
        for (const link of data.links) {
          // Look for crypto payment links
          if (link.rel === 'payment' && link.href) {
            // Try to extract currency and address from href
            const btcMatch = link.href.match(/bitcoin:([a-zA-Z0-9]+)/i);
            if (btcMatch && (!chain || chain === 'all' || chain === 'bitcoin')) {
              results.push({
                source_type: 'webfinger',
                currency: 'bitcoin',
                address: btcMatch[1],
                raw_data: {
                  subject: data.subject,
                  link,
                },
                confidence: 0.8,
              });
            }

            const ethMatch = link.href.match(/ethereum:(0x[a-fA-F0-9]{40})/i);
            if (ethMatch && (!chain || chain === 'all' || chain === 'ethereum')) {
              results.push({
                source_type: 'webfinger',
                currency: 'ethereum',
                address: ethMatch[1],
                raw_data: {
                  subject: data.subject,
                  link,
                },
                confidence: 0.8,
              });
            }
          }

          // Look for custom crypto properties
          if (link.properties) {
            for (const [key, value] of Object.entries(link.properties)) {
              if (key.includes('bitcoin') && typeof value === 'string') {
                if (!chain || chain === 'all' || chain === 'bitcoin') {
                  results.push({
                    source_type: 'webfinger',
                    currency: 'bitcoin',
                    address: value,
                    raw_data: {
                      subject: data.subject,
                      property: key,
                    },
                    confidence: 0.78,
                  });
                }
              }
              if (key.includes('ethereum') && typeof value === 'string') {
                if (!chain || chain === 'all' || chain === 'ethereum') {
                  results.push({
                    source_type: 'webfinger',
                    currency: 'ethereum',
                    address: value,
                    raw_data: {
                      subject: data.subject,
                      property: key,
                    },
                    confidence: 0.78,
                  });
                }
              }
            }
          }
        }
      }

      console.log(`[WebFingerResolver] Found ${results.length} addresses`);
      
    } catch (error) {
      console.error(`[WebFingerResolver] Error:`, error);
    }

    return results;
  }
}

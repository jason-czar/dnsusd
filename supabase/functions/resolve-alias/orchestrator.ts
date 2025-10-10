/**
 * Resolution Orchestrator
 * Coordinates multiple resolvers, handles conflicts, assigns confidence scores
 */

import { IAliasResolver, ResolvedResult, ResolutionResponse } from './types.ts';
import { DNSResolver } from './resolvers/dnsResolver.ts';
import { ENSResolver } from './resolvers/ensResolver.ts';
import { LightningResolver } from './resolvers/lightningResolver.ts';
import { PayStringResolver } from './resolvers/payStringResolver.ts';
import { FIOResolver } from './resolvers/fioResolver.ts';
import { resolverCache } from './cache.ts';

export class ResolutionOrchestrator {
  private resolvers: IAliasResolver[];

  constructor() {
    // Initialize all resolver modules
    this.resolvers = [
      new ENSResolver(),        // Highest priority
      new DNSResolver(),        // Medium priority
      new LightningResolver(),  // Lower priority (stub)
      new PayStringResolver(),  // Lower priority (stub)
      new FIOResolver()         // Lower priority (stub)
    ];
  }

  /**
   * Main resolution method
   * Orchestrates resolver calls, conflict detection, and result selection
   */
  async resolve(alias: string, chain: string = 'all'): Promise<ResolutionResponse> {
    console.log(`[Orchestrator] Resolving alias: ${alias}, chain: ${chain}`);

    // Check cache first
    const cached = resolverCache.get(alias, chain);
    if (cached) {
      console.log('[Orchestrator] Returning cached result');
      return { ...cached, cached: true };
    }

    // Find applicable resolvers
    const applicableResolvers = this.resolvers.filter(r => r.canResolve(alias));
    console.log(`[Orchestrator] ${applicableResolvers.length} applicable resolvers:`, 
                applicableResolvers.map(r => r.getName()));

    if (applicableResolvers.length === 0) {
      const response: ResolutionResponse = {
        alias,
        resolved: [],
        chosen: null,
        sources_conflict: false,
        cached: false,
        error: 'No resolver can handle this alias format'
      };
      return response;
    }

    // Resolve with all applicable resolvers in parallel
    const resultsArrays = await Promise.all(
      applicableResolvers.map(async (resolver) => {
        try {
          const results = await resolver.resolve(alias, chain);
          return results;
        } catch (error) {
          console.error(`[Orchestrator] Error in ${resolver.getName()}:`, error);
          return [];
        }
      })
    );

    // Flatten results
    const allResults: ResolvedResult[] = resultsArrays.flat();
    console.log(`[Orchestrator] Got ${allResults.length} total results`);

    if (allResults.length === 0) {
      const response: ResolutionResponse = {
        alias,
        resolved: [],
        chosen: null,
        sources_conflict: false,
        cached: false,
        error: 'No addresses found for this alias'
      };
      
      // Cache negative result for shorter time (60s)
      resolverCache.set(alias, response, chain, 60000);
      return response;
    }

    // Detect conflicts and choose best result
    const { chosen, conflict } = this.resolveConflicts(allResults, chain);

    const response: ResolutionResponse = {
      alias,
      resolved: allResults,
      chosen,
      sources_conflict: conflict,
      cached: false
    };

    // Cache successful result
    resolverCache.set(alias, response, chain);

    return response;
  }

  /**
   * Conflict resolution logic
   * Determines if multiple sources conflict and picks the best result
   */
  private resolveConflicts(
    results: ResolvedResult[], 
    chain: string
  ): { chosen: ResolvedResult | null; conflict: boolean } {
    
    if (results.length === 0) {
      return { chosen: null, conflict: false };
    }

    if (results.length === 1) {
      return { chosen: results[0], conflict: false };
    }

    // Group results by currency
    const byCurrency: Record<string, ResolvedResult[]> = {};
    for (const result of results) {
      const currency = result.currency;
      if (!byCurrency[currency]) {
        byCurrency[currency] = [];
      }
      byCurrency[currency].push(result);
    }

    // Check for conflicts within same currency
    let hasConflict = false;
    for (const currency in byCurrency) {
      const currencyResults = byCurrency[currency];
      
      // If multiple results for same currency with different addresses
      if (currencyResults.length > 1) {
        const uniqueAddresses = new Set(currencyResults.map(r => r.address.toLowerCase()));
        if (uniqueAddresses.size > 1) {
          console.log(`[Orchestrator] CONFLICT detected for ${currency}: multiple different addresses`);
          hasConflict = true;
        }
      }
    }

    // Choose best result based on confidence score
    // If specific chain requested, prioritize that chain
    let bestResult = results[0];
    
    if (chain !== 'all') {
      // Filter to requested chain
      const chainResults = results.filter(r => r.currency.toLowerCase() === chain.toLowerCase());
      if (chainResults.length > 0) {
        // Pick highest confidence from requested chain
        bestResult = chainResults.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
      }
    } else {
      // Pick overall highest confidence
      bestResult = results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
    }

    console.log(`[Orchestrator] Chosen result: ${bestResult.currency} - ${bestResult.address} (confidence: ${bestResult.confidence})`);

    return { chosen: bestResult, conflict: hasConflict };
  }

  /**
   * Get list of available resolvers and their capabilities
   */
  getResolvers(): { name: string; canHandle: string[] }[] {
    return this.resolvers.map(resolver => ({
      name: resolver.getName(),
      canHandle: this.getResolverCapabilities(resolver)
    }));
  }

  private getResolverCapabilities(resolver: IAliasResolver): string[] {
    const testCases = [
      'example.com',
      'vitalik.eth',
      'user@domain.com',
      '$domain/user',
      'user@fio'
    ];

    return testCases.filter(test => resolver.canResolve(test));
  }
}

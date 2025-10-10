/**
 * Core types for the alias resolution system
 */

export interface ResolvedResult {
  source_type: string;
  currency: string;
  address: string;
  raw_data: any;
  confidence: number;
}

export interface ResolutionResponse {
  alias: string;
  resolved: ResolvedResult[];
  chosen: ResolvedResult | null;
  sources_conflict: boolean;
  cached: boolean;
  error?: string;
}

export interface IAliasResolver {
  /**
   * Check if this resolver can handle the given alias
   */
  canResolve(alias: string): boolean;

  /**
   * Resolve the alias to one or more addresses
   * Returns array of results (can be empty if no match)
   */
  resolve(alias: string, chain?: string): Promise<ResolvedResult[]>;

  /**
   * Get resolver name for logging/debugging
   */
  getName(): string;
}

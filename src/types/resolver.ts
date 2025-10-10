export type Chain = 'bitcoin' | 'ethereum' | 'all';
export type AliasType = 'dns' | 'ens';
export type Confidence = 'high' | 'medium' | 'low';

export interface ProofMetadata {
  dnsRecords?: string[];
  ensResolver?: string;
  ensOwner?: string;
  source?: string;
  recordType?: string;
}

export interface ResolverResult {
  alias: string;
  chain: string;
  resolvedAddress: string | null;
  aliasType: AliasType | null;
  confidence: Confidence | null;
  proofMetadata: ProofMetadata | null;
  errorMessage: string | null;
}

export interface ResolverRequest {
  alias: string;
  chain: Chain;
}

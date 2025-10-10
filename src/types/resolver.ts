export type Chain = 'bitcoin' | 'ethereum' | 'all';
export type AliasType = 'dns_txt' | 'ens' | 'lightning' | 'paystring' | 'fio';
export type Confidence = 'high' | 'medium' | 'low';

export interface ProofMetadata {
  dnsRecords?: string[];
  ensResolver?: string;
  ensOwner?: string;
  source?: string;
  recordType?: string;
  dns_records?: string[];
  matched_pattern?: string;
  full_record?: string;
  ens_name?: string;
  resolver_address?: string;
  text_records?: Record<string, string>;
  rpc_url?: string;
}

export interface ResolvedResult {
  source_type: string;
  currency: string;
  address: string;
  raw_data: ProofMetadata;
  confidence: number;
}

export interface ResolverResult {
  alias: string;
  resolved: ResolvedResult[];
  chosen: ResolvedResult | null;
  sources_conflict: boolean;
  cached: boolean;
  error?: string;
}

export interface ResolverRequest {
  alias: string;
  chain: Chain;
}

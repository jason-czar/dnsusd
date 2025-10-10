# AliasResolve v0

A full-stack crypto alias resolver that translates human-readable names into blockchain wallet addresses. Currently supports DNS TXT record resolution and ENS name lookups.

## 🚀 Features

- **DNS TXT Record Resolution**: Resolve `bitcoin=` and `ethereum=` patterns from domain TXT records
- **ENS Name Support**: Lookup Ethereum addresses from .eth names (implementation in progress)
- **Multi-Chain**: Support for Bitcoin, Ethereum, with extensible architecture for more chains
- **Proof Metadata**: Returns detailed proof information including DNS records and confidence scores
- **Lookup History**: Stores all resolution attempts in database for debugging
- **Modern UI**: Clean, responsive interface with real-time results and copy-to-clipboard

## 🏗️ Architecture

### Frontend (`src/`)

**Main Page** (`pages/Index.tsx`)
- Landing page with hero section and resolver form
- Features grid showcasing capabilities
- Responsive layout with crypto/tech aesthetic

**Components**
- `ResolverForm.tsx`: Input form for alias and chain selection
- `ResolutionResult.tsx`: Displays resolved address with proof metadata
- Both use shadcn/ui components with custom theming

**Type Definitions** (`types/resolver.ts`)
- TypeScript interfaces for resolver requests/responses
- Type safety across frontend and backend communication

### Backend (`supabase/functions/resolve-alias/`)

**Main Resolver** (`index.ts`)
The edge function orchestrates resolution:
1. Validates input (alias + chain)
2. Routes to appropriate resolver (DNS or ENS)
3. Validates returned addresses
4. Stores lookup in database
5. Returns standardized result

**DNS Resolver Module**
```typescript
async function resolveDNS(domain: string, chain: string)
```
- Uses Cloudflare DNS-over-HTTPS API
- Queries TXT records for domain
- Parses `bitcoin=<address>` and `ethereum=<address>` patterns
- Validates addresses before returning
- Returns proof metadata (raw TXT records)

**ENS Resolver Module** 
```typescript
async function resolveENS(ensName: string)
```
- Currently placeholder implementation
- Production requires ethers.js or viem library
- Would perform:
  1. Namehash ENS name
  2. Query ENS registry for resolver
  3. Query resolver for ETH address

**Address Validators**
- `validateBitcoinAddress()`: Validates P2PKH, P2SH, Bech32 formats
- `validateEthereumAddress()`: Validates 0x prefixed 40-character hex

### Database

**lookups table** (`public.lookups`)
```sql
- id: UUID (primary key)
- alias: TEXT (domain or ENS name)
- chain: TEXT (bitcoin/ethereum/all)
- resolved_address: TEXT (wallet address)
- alias_type: TEXT (dns/ens)
- confidence: TEXT (high/medium/low)
- proof_metadata: JSONB (DNS records, ENS details)
- error_message: TEXT (if resolution failed)
- created_at: TIMESTAMP
```

Public RLS policies allow reading and inserting (public lookup service).

## 🔧 How It Works

### DNS TXT Resolution Flow

1. User enters `example.com` and selects `Bitcoin`
2. Frontend calls `resolve-alias` edge function
3. Edge function queries Cloudflare DNS-over-HTTPS:
   ```
   GET https://cloudflare-dns.com/dns-query?name=example.com&type=TXT
   ```
4. Parses TXT records for `bitcoin=<address>` pattern
5. Validates Bitcoin address format
6. Returns address with DNS record proofs
7. Stores lookup in database

### ENS Resolution Flow (In Progress)

1. User enters `vitalik.eth` 
2. Frontend calls `resolve-alias` edge function
3. Edge function would:
   - Hash name using namehash algorithm
   - Query ENS registry contract for resolver
   - Query resolver contract for address
4. Returns Ethereum address with ENS metadata

## 📝 Sample DNS TXT Records

To make your domain resolvable, add TXT records:

```
example.com TXT "bitcoin=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
example.com TXT "ethereum=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

## 🔮 Extending to New Alias Types

The modular architecture makes it easy to add new resolution methods:

### Adding Lightning Network Support

1. **Create resolver module**:
```typescript
async function resolveLightning(alias: string) {
  // Parse user@domain format
  // Query LNURL or Lightning Address
  // Return node pubkey or invoice
}
```

2. **Add to main resolver**:
```typescript
if (alias.includes('@')) {
  aliasType = 'lightning';
  result = await resolveLightning(alias);
}
```

3. **Update types**:
```typescript
export type AliasType = 'dns' | 'ens' | 'lightning';
```

### Adding PayString Support

1. **Create PayString module**:
```typescript
async function resolvePayString(paystring: string) {
  // Parse $domain/user format
  // Query PayID endpoint
  // Return payment address
}
```

2. **Add validator**:
```typescript
function validatePayString(input: string) {
  return /^\$[a-zA-Z0-9.-]+\/[a-zA-Z0-9]+$/.test(input);
}
```

## 🧪 Testing

The app includes sample test cases built-in:

**DNS TXT (Try these)**:
- `bitcoin.org` - May have Bitcoin address
- `ethereum.org` - May have Ethereum address  
- Custom domains with TXT records

**ENS (Coming soon)**:
- `vitalik.eth`
- `brantly.eth`
- Any registered .eth name

## 🚢 Deployment

This project uses Lovable Cloud (Supabase):
- Frontend: Automatic deployment via Lovable
- Edge Functions: Auto-deployed with code changes
- Database: Managed PostgreSQL instance

## 🔐 Security

- Input validation on all user inputs
- Address format validation before display
- Public RLS policies (appropriate for lookup service)
- CORS configured for web app access
- No sensitive data stored

## 📚 Dependencies

**Frontend**:
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Query for data fetching
- Lucide icons

**Backend**:
- Deno runtime for edge functions
- Supabase client for database access
- Cloudflare DNS-over-HTTPS API

## 🎯 Roadmap

- [ ] Complete ENS resolver with ethers.js integration
- [ ] Add Lightning Network support
- [ ] Implement Solana name service (SNS)
- [ ] Add Unstoppable Domains (.crypto, .nft)
- [ ] Batch resolution API endpoint
- [ ] Historical lookup browser UI
- [ ] Rate limiting and caching
- [ ] Address balance checking
- [ ] QR code generation for addresses

## 📖 Further Reading

- [DNS TXT Records Spec](https://www.rfc-editor.org/rfc/rfc1035)
- [ENS Documentation](https://docs.ens.domains/)
- [Bitcoin Address Formats](https://en.bitcoin.it/wiki/Address)
- [Ethereum Address Format](https://ethereum.org/en/developers/docs/accounts/)

## 🤝 Contributing

To add support for new alias types:
1. Create resolver function in `supabase/functions/resolve-alias/index.ts`
2. Add validator function for address format
3. Update type definitions in `src/types/resolver.ts`
4. Update UI to handle new alias type in components
5. Document resolution method in this README

---

**Built with Lovable** | [View Project](https://lovable.dev/projects/94e7880a-cb08-44f0-a83a-5b648c2a3e95)

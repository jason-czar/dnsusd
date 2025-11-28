# BlueKeyID

**Universal Crypto Address Identity Verification**

A comprehensive identity and trust verification platform that bridges DNS (web2) domain names with cryptocurrency wallet addresses (web3). BlueKeyID resolves human-readable aliases across 14+ naming systems into verified blockchain addresses with trust scoring and real-time monitoring.

---

## 🚀 Core Features

### Multi-System Alias Resolution
BlueKeyID supports **14 naming systems** across multiple blockchains:

- **ENS** (.eth) - Ethereum Name Service
- **DNS TXT Records** - Traditional domain-based resolution
- **Unstoppable Domains** (.crypto, .nft, .blockchain, .wallet, etc.)
- **Handshake** (.hns) - Decentralized DNS
- **Namecoin** (.bit) - Blockchain-based DNS
- **Zilliqa Name Service** (.zil)
- **Cardano Name Service** ($adahandles, .ada)
- **Bitcoin Name System** (.btc, .id) - Stacks-based
- **FIO Protocol** (@fio handles)
- **Lightning Network** (user@domain addresses)
- **Nostr NIP-05** (user@domain identifiers)
- **PayString/PayID** ($domain/user)
- **WebFinger** (acct: protocol)
- **Well-Known Endpoints** (/.well-known/crypto.json)

### Trust Score Verification
- **DNS Verification** - Validates domain ownership
- **HTTPS Verification** - Confirms secure connections
- **DNSSEC Validation** - Cryptographic domain authentication
- **Trust Score Calculation** (0-100) - Automated confidence ratings
- **Verification History** - Track changes over time

### Real-Time Monitoring & Alerts
- **Continuous Monitoring** - Automated revalidation
- **Email Alerts** - Instant notifications on changes
- **Webhook Integration** - Real-time event delivery
- **Alert Management** - Configurable thresholds and rules
- **Activity Logging** - Complete audit trail

### Developer API
- **REST API Endpoints** - Programmatic access
- **API Key Management** - Secure authentication
- **Rate Limiting** - Tiered usage controls (Free/Pro/Enterprise)
- **Webhook Registration** - Custom callback URLs
- **Usage Analytics** - Request tracking and metrics

### Team Collaboration
- **Organizations** - Multi-tenant workspace support
- **Role-Based Access** - Owner/Admin/Member/Viewer permissions
- **Team Invitations** - Email-based member onboarding
- **Activity Logs** - Organization-level audit trails
- **Shared Resources** - Collaborative alias management

### Billing & Subscriptions
- **Multiple Tiers** - Free, Pro, Enterprise plans
- **Stripe Integration** - Secure payment processing
- **Usage Tracking** - Per-organization billing
- **Self-Service Portal** - Subscription management

---

## 🏗️ Architecture

### Resolution Orchestrator Pattern

BlueKeyID uses a modular **ResolutionOrchestrator** that coordinates multiple specialized resolvers:

```typescript
class ResolutionOrchestrator {
  private resolvers: IAliasResolver[] = [
    new ENSResolver(),
    new UnstoppableDomainsResolver(),
    new DNSResolver(),
    new NostrResolver(),
    new LightningResolver(),
    new HandshakeResolver(),
    new NamecoinResolver(),
    new ZNSResolver(),
    new CNSResolver(),
    new BNSResolver(),
    new FIOResolver(),
    new PayStringResolver(),
    new WebFingerResolver(),
    new WellKnownResolver()
  ];
}
```

Each resolver implements the `IAliasResolver` interface:

```typescript
interface IAliasResolver {
  canResolve(alias: string): boolean;
  resolve(alias: string, chain?: string): Promise<ResolvedResult[]>;
  getName(): string;
}
```

### Core Components

**Frontend** (`src/`)
- **Pages**: Index, Dashboard, Monitoring, API Keys, Organizations, Billing, Admin
- **Components**: ResolverForm, ResolutionResult, TrustScoreBadge, OrganizationSwitcher
- **Contexts**: OrganizationContext for team state management
- **Hooks**: Custom hooks for API interactions

**Backend** (`supabase/functions/`)
- **resolve-alias** - Main resolution orchestrator
- **verify-alias-ownership** - Domain ownership verification
- **verify-domain** - Trust score validation
- **trust-report** - Generate verification reports
- **scheduled-revalidation** - Automated monitoring
- **webhook-trigger** - Event notification system
- **generate-api-key** - API key generation
- **organization-*** - Team management functions
- **create-checkout-session** - Stripe billing integration

### Caching Layer

In-memory cache with TTL (5 minutes default):
```typescript
class SimpleCache {
  get(alias: string, chain?: string): any | null
  set(alias: string, data: any, chain?: string, ttlMs?: number): void
  cleanup(): void  // Runs every 10 minutes
}
```

### Conflict Resolution

When multiple sources provide different addresses for the same currency:
1. Group results by currency
2. Detect conflicts (different addresses for same currency)
3. Select highest confidence result
4. Prioritize chain-specific requests
5. Return conflict flag for transparency

---

## 💾 Database Schema

### Core Tables

**`aliases`** - Registered aliases with trust scores
- `id`, `alias_string`, `user_id`, `organization_id`
- `current_address`, `current_currency`, `current_source`
- `dns_verified`, `https_verified`, `dnssec_enabled`
- `trust_score` (0-100), `verification_method`

**`alias_history`** - Resolution change tracking
- `alias_id`, `address`, `currency`, `source_type`
- `confidence`, `raw_data`, `resolved_at`

**`lookups`** - Public resolution logs
- `alias`, `chain`, `resolved_address`
- `alias_type`, `confidence`, `proof_metadata`

### User Management

**`profiles`** - User information
- `id`, `email`, `display_name`, `subscription_tier`
- `notification_preferences`, `api_preferences`

**`user_roles`** - Role-based access control
- `user_id`, `role` (admin/moderator/user)

**`api_keys`** - API authentication
- `user_id`, `key_name`, `key_hash`, `key_prefix`
- `is_active`, `last_used_at`

**`api_usage`** - Request analytics
- `user_id`, `endpoint`, `method`, `status_code`
- `response_time_ms`, `ip_address`, `user_agent`

### Monitoring & Alerts

**`monitoring_rules`** - Alert configuration
- `user_id`, `alias_id`, `enabled`, `trust_threshold`
- `alert_email`, `alert_webhook_url`

**`alerts`** - Generated notifications
- `user_id`, `alias_id`, `rule_id`
- `alert_type`, `severity`, `message`
- `email_sent`, `webhook_sent`, `resolved`

**`webhooks`** - Webhook registrations
- `user_id`, `alias_id`, `callback_url`, `secret_token`
- `is_active`, `last_triggered_at`

### Organizations

**`organizations`** - Team workspaces
- `id`, `name`, `slug`, `logo_url`
- `created_by`, `settings`

**`organization_members`** - Team membership
- `organization_id`, `user_id`
- `role` (owner/admin/member/viewer)

**`organization_invitations`** - Pending invites
- `organization_id`, `email`, `role`, `token`
- `invited_by`, `expires_at`, `status`

**`organization_activity_logs`** - Audit trail
- `organization_id`, `user_id`, `action`
- `resource_type`, `resource_id`, `metadata`

### Billing

**`subscriptions`** - Payment tracking
- `user_id`, `organization_id`, `tier`
- `stripe_customer_id`, `stripe_subscription_id`
- `status`, `current_period_start`, `current_period_end`

---

## 🔧 API Overview

### Resolution Endpoint

```bash
POST /functions/v1/resolve-alias
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "alias": "example.eth",
  "chain": "ethereum"
}
```

**Response:**
```json
{
  "alias": "example.eth",
  "resolved": [
    {
      "source_type": "ENS",
      "currency": "ethereum",
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "confidence": 0.95,
      "raw_data": { "ens_name": "example.eth" }
    }
  ],
  "chosen": { /* highest confidence result */ },
  "sources_conflict": false,
  "cached": false
}
```

### Rate Limits
- **Free Tier**: 100 requests/day
- **Pro Tier**: 10,000 requests/day
- **Enterprise**: Custom limits

### Webhook Events
- `alias.verified` - New alias verified
- `alias.changed` - Address updated
- `trust.decreased` - Trust score dropped
- `verification.failed` - Validation error

---

## 🔐 Security

### Row-Level Security (RLS)
All database tables enforce RLS policies:
- Users can only access their own data
- Organization members can access shared resources
- Admins have elevated permissions via `has_role()` function
- Service role for system operations

### Trust Score Methodology
```
Trust Score = (DNS_Verified * 40) + 
              (HTTPS_Verified * 30) + 
              (DNSSEC_Enabled * 30)
```

### Input Validation
- Address format validation per currency
- Alias pattern matching per resolver
- API key authentication and rate limiting
- CORS configuration for web security

### Authentication
- Email/password authentication
- Session management with JWT tokens
- API key generation with SHA-256 hashing
- Automatic user profile creation

---

## 📝 Sample Usage

### DNS TXT Resolution
Add TXT records to your domain:
```
example.com TXT "bitcoin=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
example.com TXT "ethereum=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

### ENS Resolution
Register .eth name and set address records via ENS app.

### Unstoppable Domains
Manage crypto addresses through Unstoppable Domains dashboard.

### Lightning Address
Configure `.well-known/lnurlp/{username}` endpoint on your domain.

---

## 🚢 Deployment

**Platform**: Lovable Cloud (Supabase)
- **Frontend**: Vite + React, auto-deployed on push
- **Edge Functions**: Deno runtime, auto-deployed
- **Database**: PostgreSQL with automated backups
- **CDN**: Global edge network

**Environment Variables** (auto-configured):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `ETHEREUM_RPC_URL` (for ENS resolution)
- `STRIPE_SECRET_KEY` (for billing)
- `RESEND_API_KEY` (for email alerts)

---

## 📚 Technology Stack

**Frontend**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui components
- TanStack Query for data fetching
- React Router for navigation
- Lucide icons

**Backend**
- Deno edge functions
- Supabase client for database
- Ethers.js for ENS resolution
- Stripe SDK for payments
- Cloudflare DNS-over-HTTPS API

---

## 🎯 Roadmap

### ✅ Completed
- [x] 14+ naming system support
- [x] Trust score verification
- [x] Real-time monitoring
- [x] API key management
- [x] Organization support
- [x] Stripe billing integration
- [x] Webhook system
- [x] Conflict resolution
- [x] Caching layer

### 🔄 In Progress
- [ ] Balance checking for resolved addresses
- [ ] QR code generation for addresses
- [ ] Batch resolution API endpoint
- [ ] Historical lookup browser UI
- [ ] Advanced analytics dashboard

### 🔮 Future
- [ ] Solana Name Service (SNS) support
- [ ] TON DNS integration
- [ ] NEAR Name Service
- [ ] Mobile SDK (iOS/Android)
- [ ] Browser extension
- [ ] GraphQL API
- [ ] Multi-signature support
- [ ] Address book management

---

## 🤝 Contributing

To add support for new alias types:

1. **Create Resolver Module** in `supabase/functions/resolve-alias/resolvers/`:
```typescript
export class NewSystemResolver implements IAliasResolver {
  getName(): string {
    return 'New System';
  }

  canResolve(alias: string): boolean {
    // Detect alias pattern
    return /pattern/.test(alias);
  }

  async resolve(alias: string, chain?: string): Promise<ResolvedResult[]> {
    // Query naming system
    // Validate addresses
    // Return results
  }
}
```

2. **Add to Orchestrator** in `orchestrator.ts`:
```typescript
new NewSystemResolver()
```

3. **Update Type Definitions** in `src/types/resolver.ts`

4. **Test Resolution** across different scenarios

5. **Document** in this README

---

## 📖 Documentation

- [Protocol Specification](public/Proof_of_Domain_Identity_PDI_Protocol_v1.2_Draft-3.pdf)
- [API Documentation](/api-docs)
- [SDK Documentation](/sdk-docs)
- [Terms of Service](/tos)
- [Privacy Policy](/policy)

---

## 🔗 Links

- **Website**: [BlueKeyID](/)
- **Dashboard**: [Login](/auth)
- **API Docs**: [Documentation](/api-docs)
- **Support**: [Contact Us](mailto:support@bluekeyid.com)

---

**Built with Lovable** | MIT License | © 2025 BlueKeyID

# Platform Upgrade & Critical Fixes Changelog

**Project:** DataFlex Ghana / Referral Powerhouse  
**Period:** May 2026 upgrade batch  
**Build verified:** `npm run build` (Next.js 16.2.4)

This document records production-critical fixes and feature upgrades applied during the latest stabilization pass. Use it alongside [`TECHNICAL_ISSUES_AND_FIXES.md`](./TECHNICAL_ISSUES_AND_FIXES.md) for constraint details, root-cause analysis, and testing steps.

---

## Wallet transaction constraint violations

### Problem
Inserts into `wallet_transactions` failed with PostgreSQL check constraint errors (e.g. `wallet_transactions_type_check`). Causes included:

- A legacy `type` column being sent on insert (production has **only** `transaction_type`).
- Invalid `transaction_type` values such as `adjustment`, `credit`, `debit`, or `admin_credit`.
- Dynamic helpers mapping admin actions to disallowed strings.

### Fix
- Centralized allowed types in `lib/wallet-transaction-types.ts` (exactly seven values).
- `createAdminAdjustment` and `createAdminReversal` in `lib/earnings-calculator.ts` now use **direct inserts** with hardcoded production types—no `buildWalletTransactionInsertRow`, no `type` field.
- Credits use `admin_adjustment`; debits and reversals use `admin_reversal`.

### Files
| File | Change |
|------|--------|
| `lib/wallet-transaction-types.ts` | Canonical `DB_TRANSACTION_TYPES`; `buildWalletTransactionInsertRow` strips `type` |
| `lib/earnings-calculator.ts` | Hardcoded `createAdminAdjustment` / `createAdminReversal` |
| `components/admin/tabs/WalletsTab.tsx` | Top-up flow uses `transaction_type: "topup"` only |
| `app/api/admin/agents/manual-register/route.ts` | Welcome credit via `createAdminAdjustment` |
| `app/api/admin/agents/[id]/approve/route.ts` | ₵5 approval credit via `createAdminAdjustment` |
| `app/api/admin/wallet/route.ts` | Admin adjustments/reversals via same helpers |

```typescript
// lib/earnings-calculator.ts — production-safe insert
transaction_type: isCredit ? "admin_adjustment" : "admin_reversal",
```

---

## Agent status constraint violation on delete / clear

### Problem
Clearing an agent’s transactional history via a monolithic SQL/RPC function sometimes failed with agent `status` check violations or FK errors when triggers attempted invalid state transitions.

### Fix
Replaced the RPC with **ordered, table-by-table deletes** in the API route using the service-role client (`getAdminClient()`):

1. Withdrawals (by `wallet_transaction_id`, then by `agent_id`)
2. `wallet_transactions`
3. `wallet_topups`
4. Commissions, commission deposits, data orders, wholesale orders, referrals, project chats, sessions, pending transactions
5. Reset agent balance counters to zero (account row preserved)

### Files
| File | Change |
|------|--------|
| `app/api/admin/agents/[id]/clear-records/route.ts` | `getAdminClient()` + sequential deletes + balance reset |
| `components/admin/tabs/AgentManagementTab.tsx` | Calls clear-records API with admin auth headers |

---

## Double wallet credit on slow network

### Problem
Admins could click **Approve** on a pending wallet top-up multiple times before the first request finished, creating duplicate `wallet_transactions` rows and inflating balances.

### Fix
**Defense in depth:**

1. **UI:** Approve button disables immediately on click and re-enables only after the API response (`approvingTopupIds` state in `WalletsTab`).
2. **API:** New idempotent approval route checks for an existing transaction with reference `TOPUP-{topupId}` before insert; duplicate unique-key errors are treated as success.

### Files
| File | Change |
|------|--------|
| `components/admin/tabs/WalletsTab.tsx` | Disabled “Approving…” button; calls approval API |
| `app/api/admin/wallet-topups/[id]/approve/route.ts` | **New** — idempotent server-side approval |

```typescript
// Stable reference — one credit per top-up request
const referenceCode = `TOPUP-${topupId}`
```

---

## Manual registration auto-approve 500

### Problem
Manual registration with **Auto approve** returned HTTP 500 when the welcome wallet credit insert violated `wallet_transactions_type_check`.

### Fix
Same hardcoded `createAdminAdjustment` path as agent approval (₵5 credit, `admin_adjustment`). Registration still succeeds with a warning if credit fails unexpectedly.

### Files
| File | Change |
|------|--------|
| `app/api/admin/agents/manual-register/route.ts` | Auto-approve branch calls `createAdminAdjustment` |
| `lib/earnings-calculator.ts` | Correct transaction types on insert |
| `components/admin/tabs/ManualRegistrationTab.tsx` | UI for manual registration |

---

## Agent approval button failing

### Problem
Same root cause as manual registration: approving a new agent attempted a wallet credit with an invalid `transaction_type`, causing approval to fail after the agent row was updated.

### Fix
`PATCH /api/admin/agents/[id]/approve` uses `createAdminAdjustment(agentId, 5, adminId, "Approval credit for new agent", true)` with production types. Referral credit hook runs after successful wallet insert.

### Files
| File | Change |
|------|--------|
| `app/api/admin/agents/[id]/approve/route.ts` | `getAdminClient` + `createAdminAdjustment` |
| `lib/referral-agent-program.ts` | `ensureReferralCreditOnAgentApproval` |
| `components/admin/tabs/AgentsTab.tsx` | Approve action in admin UI |

---

## Storefront Paystack callback redirecting to Vercel login

### Problem
After Paystack payment, users were redirected to `localhost:3000/...` or a generic `*.vercel.app` deployment URL that showed a Vercel login wall instead of the live storefront.

### Fix
- Paystack `callback_url` forced to `{NEXT_PUBLIC_STOREFRONT_ORIGIN}/api/paystack/storefront/callback` (default `https://referralpowerhouse.vercel.app`).
- Callback handler verifies payment, captures orders, credits storefront commission, redirects to `/store/{slug}?payment=success&ref=...` on the public storefront origin.
- `lib/storefront-utils.ts` and `lib/app-url.ts` avoid localhost and non-storefront Vercel hosts for customer-facing links.

### Files
| File | Change |
|------|--------|
| `app/api/paystack/storefront/initialize/route.ts` | Fixed `PAYSTACK_STOREFRONT_CALLBACK_URL` |
| `app/api/paystack/storefront/callback/route.ts` | Verify + redirect to live store URL |
| `lib/storefront-order-capture.ts` | Order rows + commission credit |
| `lib/storefront-utils.ts` | `getStorefrontServerOrigin`, `buildStorefrontUrl` |
| `lib/app-url.ts` | Production origin resolution |

---

## Storefront slug mismatch blank page

### Problem
Store URLs using a custom slug (e.g. `/store/anna-store`) could 404 or render empty when the slug in the URL did not exactly match `agent_store_profiles.store_slug` (case, typos, legacy UUID paths).

### Fix
`resolveStoreSegmentToAgentId` in `lib/storefront-server.ts` resolves segments by UUID, exact slug, lowercase match, `ilike`, and controlled prefix matching. Public route `app/store/[segment]/page.tsx` uses this resolver before loading storefront data.

### Files
| File | Change |
|------|--------|
| `lib/storefront-server.ts` | `resolveStoreSegmentToAgentId`, slug availability checks |
| `app/store/[segment]/page.tsx` | Slug/UUID segment routing |
| `app/api/storefront/resolve-slug/route.ts` | API slug lookup |
| `lib/storefront-public.ts` | Public storefront payload |
| `app/agent/referralhub/page.tsx` | Slug editing + QR/link via `buildStorefrontUrl` |

---

## Jobs “not found” from agent dashboard

### Problem
The agent dashboard loaded jobs from the browser Supabase client against an external jobs database, which failed under RLS or missing env keys—surfacing as “not found” or empty lists.

### Fix
Jobs are loaded through server API routes using `getJobsSupabaseAdmin()` (`lib/jobs-supabase-admin.ts`). The dashboard imports `fetchJobsFromApi` from `lib/jobs-api.ts`.

### Files
| File | Change |
|------|--------|
| `app/api/jobs/route.ts` | List jobs (server-only) |
| `app/api/jobs/[id]/route.ts` | Single job |
| `lib/jobs-supabase-admin.ts` | Service-role client for jobs DB |
| `lib/jobs-api.ts` | Client wrapper |
| `app/agent/dashboard/page.tsx` | Uses `fetchJobsFromApi` |

---

## Public storefront not loading (404)

### Problem
Public store pages returned 404 when only UUID-based sandbox paths worked or slug resolution failed.

### Fix
Unified public entry at `/store/[segment]` with slug resolution (see above) plus `app/api/storefront/public/[agentId]` for JSON payloads. Reserved paths: `not-available`, `payment-failed`, `invalid-agent`.

### Files
| File | Change |
|------|--------|
| `app/store/[segment]/page.tsx` | Primary public storefront |
| `app/public-agent-sandbox/[agentId]/page.tsx` | Legacy/sandbox entry |
| `app/api/storefront/public/[agentId]/route.ts` | Public API |

---

## Security hardening

### Problem
Some database views exposed `auth.users` metadata to `anon` / `authenticated` roles, creating unnecessary attack surface.

### Fix
Revoked `SELECT` on sensitive views from `anon` and `authenticated`; admin operations use service role via `getAdminClient()` only on the server. Application routes enforce `requireAdminSession` / `authenticateAdmin`.

### Files / ops
| Item | Notes |
|------|--------|
| Supabase SQL (run in dashboard) | `REVOKE` on views joining `auth.users` |
| `lib/supabase-base.ts` | Server-only admin client guard |
| `lib/api-auth.ts` | Admin session validation |
| `app/robots.ts` | Blocks AI training crawlers on all paths |

---

## Upgrades

### WhatsApp channel popup
- `components/WhatsAppChannelPopup.tsx` — channel join promo.
- `components/teaching/whatsapp-promo-notification.tsx` — teaching surfaces.
- Store OG image: `/whatsapp-channel.jpg`.

### Storefront payout request
- Agent storefront commission balance and cashout requests.
- `app/api/admin/storefront/cashout/route.ts`, `cashout-profiles/route.ts`.
- `components/admin/tabs/StorefrontManagerTab.tsx` — admin payout workflow.

### Social sharing
- Open Graph / Twitter metadata on `app/store/[segment]/page.tsx` and blog routes.
- Referral Hub QR and share links via `buildStorefrontUrl`.

### Wholesale products
- Product variants, admin CSV export, agent browser/cart (`WHOLESALE_PRODUCT_VARIANTS_CHANGELOG.md`).

### Compliance forms
- Agent compliance hub: bank account, TIN, partnership, passport, etc. under `components/agent/compliance/forms/`.

### AI crawler blocking
- `app/robots.ts` disallows GPTBot, ClaudeBot, Google-Extended, Bytespider, CCBot, and related agents site-wide.

---

## Finalisation pass (this release)

| Item | Status |
|------|--------|
| `createAdminAdjustment` / `createAdminReversal` hardcoded types | Verified |
| Clear-records via `getAdminClient()` | Implemented |
| WalletsTab approve button debounce | Implemented |
| Wallet top-up approval API + idempotency | Implemented |
| Agent approve route uses `createAdminAdjustment` | Verified |
| `npm run build` | Passes |

---

*For constraint definitions, migration SQL, environment variables, and manual test checklists, see [TECHNICAL_ISSUES_AND_FIXES.md](./TECHNICAL_ISSUES_AND_FIXES.md).*

# Manual Payment SMS Capture (Android / Flutter) — Implementation Record

**Date started:** 21 August 2026  
**Status:** Phase 1 implemented (additive). Run migration + sideload APK before production use.  
**Related:** [`apps/admin-ops-mobile/`](../apps/admin-ops-mobile/)

---

## Goal

Android ops app on the **payment SIM** (`0557943392` / `+233557943392`) that:

1. Reads MoMo “Payment received” SMS
2. Parses amount + **Reference** + Transaction ID
3. Calls platform API to move matching **pending** orders → **processing**
4. Sticky-alerts wallet top-ups (**no auto-credit** — approve on Wallets tab)
5. Mirrors admin dashboard notifications onto the phone with pestering alerts until **Attend**

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Orders / short-code MoMo | Auto `pending` → `processing` + phone alert |
| Wallet top-ups | Alert only; sticky/pestering until Attend; Approve on web |
| Registration | Persist intent; SMS match → sticky alert; never auto-approve agent |
| Webapp Orders / Wallets tabs | Unchanged |
| Quality | Full Phase 1, no rush shortcuts |

---

## Sample SMS

```text
Payment received for GHS 47.50 from PHILIP AKUTSE AGBAVITOR
Current Balance: GHS 131.47 . Available Balance: GHS 131.47.
Reference: 71788. Transaction ID: 84157189921. TRANSACTION FEE: 0.00
```

---

## Architecture

```
MoMo SMS → Flutter Ops App → POST /api/ops/momo/confirm
                              → match ref + amount (48h window)
                              → data_orders / wholesale / bulk / AFA → processing
                              → wallet_topups → sticky inbox only
                              → registration_payment_intents → matched + sticky

Web events → audit_log / notify helpers → admin_ops_inbox
Flutter polls GET /api/ops/inbox → sticky until POST .../ack
```

---

## Database (migration)

Run: [`scripts/090_admin_ops_momo_sms.sql`](../scripts/090_admin_ops_momo_sms.sql)

Tables:

- `ops_devices` — hashed API keys for the phone
- `ops_momo_sms_events` — idempotent by `transaction_id`
- `admin_ops_inbox` — unified mirror + `requires_ack`
- `registration_payment_intents` — manual/Paystack registration payment rows

---

## API surface

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/ops/momo/confirm` | Ops Bearer `ops_…` | Parse/match SMS; set processing or alert |
| GET | `/api/ops/inbox` | Ops Bearer | List inbox (`?unacked_only=1&since=`) |
| POST | `/api/ops/inbox/[id]/ack` | Ops Bearer | Clear sticky after Attend |
| POST | `/api/ops/registration-intent` | Public | Persist manual registration code |
| GET/POST | `/api/admin/ops/devices` | Admin | List / create device API keys |

Optional env: `OPS_DEVICE_BOOTSTRAP_KEY` — temporary bearer before first device row exists.

---

## Key server files

- [`lib/ops/auth.ts`](../lib/ops/auth.ts)
- [`lib/ops/parse-momo-sms.ts`](../lib/ops/parse-momo-sms.ts)
- [`lib/ops/match-momo-payment.ts`](../lib/ops/match-momo-payment.ts)
- [`lib/ops/set-order-processing.ts`](../lib/ops/set-order-processing.ts)
- [`lib/ops/notify-admin-ops.ts`](../lib/ops/notify-admin-ops.ts)
- Fan-out from [`lib/audit-logger.ts`](../lib/audit-logger.ts), [`lib/admin-wallet-topup-notify.ts`](../lib/admin-wallet-topup-notify.ts)

**Do not rewrite:** OrdersTab / WalletsTab / wallet approve credit path.

---

## Flutter app

Path: `apps/admin-ops-mobile/`

See [`apps/admin-ops-mobile/README.md`](../apps/admin-ops-mobile/README.md) for build/sideload steps.

Sticky alerts: ongoing high-priority notification + vibrate every ~25s until Attend.

---

## Match priority (confirm API)

1. `data_orders` (pending + payment_reference + amount)
2. `wholesale_orders`
3. `bulk_orders` / `mtnafa_registrations` (`payment_pin`)
4. `data_orders_log` (guest — alert only)
5. `wallet_topups` (TXN ID or unique amount heuristic — alert only)
6. `registration_payment_intents`

Ambiguous (2+ order matches) → **no** status change; critical sticky alert.

---

## Tests / dry run

```bash
# Parser
npx tsx scripts/test-ops-momo-parser.ts

# Flutter parser
cd apps/admin-ops-mobile && flutter test
```

### Manual E2E checklist

1. [ ] Apply `090_admin_ops_momo_sms.sql` on Supabase/Postgres
2. [ ] Create ops device key via admin API; configure app Settings
3. [ ] Create pending `data_orders` with known 5-digit ref + amount
4. [ ] Simulate/send MoMo SMS with that Reference → order becomes `processing` in Orders tab (realtime)
5. [ ] Create pending wallet top-up → SMS/alert sticky only; Approve on Wallets tab still works
6. [ ] Manual registration page generates code → row in `registration_payment_intents`
7. [ ] New agent register / Paystack verify → inbox sticky on phone
8. [ ] Attend clears sticky; pestering stops
9. [ ] Duplicate same Transaction ID → idempotent no double processing
10. [ ] Manual status change on Orders tab still works independently

---

## Explicit non-goals

- No auto wallet credit
- No auto agent approval
- No Paystack storefront rewrite
- No auto-complete past `processing`
- FCM push deferred (polling + local sticky first)

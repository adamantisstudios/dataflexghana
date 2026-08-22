# Install & test (do this once)

**Phase 1** = orders → processing, wallet sticky alerts, registration alerts, admin inbox mirror, Flutter ops app.

---

## 1. Run SQL in Supabase (SQL Editor)

1. `scripts/090_admin_ops_momo_sms.sql`
2. `scripts/091_seed_ops_payment_phone.sql`
3. `scripts/092_ops_inbox_guest_orders.sql`

That creates the tables and seeds the payment-phone device (hashed key only).

## 2. Deploy the website

Deploy this repo so `/api/ops/*` is live on `https://www.dataflexghana.com`.

## 3. Install the release APK

`apps/admin-ops-mobile/build/app/outputs/flutter-apk/app-release.apk`  
(or Desktop `DataFlexOps-release.apk`)

Install on the MoMo SIM phone (`0557943392`).

## 4. Open the app → Settings (one paste)

| Field | What to enter |
|--------|----------------|
| **API base URL** | `https://www.dataflexghana.com` (default) |
| **Ops API key** | From local `apps/admin-ops-mobile/DEVICE_KEY.txt` (not in git) |
| **MoMo number** | `0557943392` |

Tap **Save**. Grant **SMS** + **Notifications**.

---

## Why a “device key”?

Password for this phone only so random people cannot call confirm/inbox APIs.  
Plaintext key is kept locally only; the DB stores a hash.

---

## Quick test

1. App Home → **Test sample SMS parser**.
2. Create a pending data order with a known 5-digit reference.
3. Wait for a real MoMo SMS (or send a matching sample after editing ref/amount).
4. Wallet top-up → sticky alert only (Approve still on Wallets tab).
5. Tap **Attend** to stop pestering.
6. Guest `/no-registration` order → phone sticky alert + pending feed “Guest / No-Reg Orders”.

# DataFlex Admin Ops Mobile

Android Flutter app for the **payment SIM phone** (`0557943392` / `+233557943392`).

## What it does

1. Listens for MTN MoMo **Payment received** SMS
2. Parses amount, Reference (5-digit platform code), Transaction ID
3. Calls `POST /api/ops/momo/confirm` to:
   - Move matching **pending** orders → **processing** (does not complete / does not credit wallets)
   - Sticky-alert wallet top-ups (you still Approve on the Wallets tab)
   - Sticky-alert registration payments
4. Polls `GET /api/ops/inbox` to mirror admin dashboard alerts
5. **Pestering sticky notifications** until you tap **Attend** (ack)

## Setup

1. Run SQL migration: [`scripts/090_admin_ops_momo_sms.sql`](../../scripts/090_admin_ops_momo_sms.sql)
2. As admin, create a device key:

```bash
curl -X POST https://YOUR_HOST/api/admin/ops/devices \
  -H "Authorization: Bearer <admin-token-or-json-id>" \
  -H "Content-Type: application/json" \
  -d '{"label":"payment-phone"}'
```

Save the returned `api_key` (shown once).

3. Build APK:

```bash
cd apps/admin-ops-mobile
flutter pub get
flutter test
flutter build apk --release
```

4. Sideload `build/app/outputs/flutter-apk/app-release.apk` onto the payment phone.
5. Open app → Settings → paste API base URL + `ops_…` key → Save.
6. Grant SMS + notification permissions.

## Safety rules (enforced server-side)

- Wallet top-ups: **never auto-approved / never credited** from SMS
- Agents: **never auto-approved** from registration SMS
- Orders: only `pending` → `processing`
- Existing Orders tab / Wallets tab flows unchanged

## Optional bootstrap

If no devices exist yet, set env `OPS_DEVICE_BOOTSTRAP_KEY` to a temporary bearer token matching what the phone sends.

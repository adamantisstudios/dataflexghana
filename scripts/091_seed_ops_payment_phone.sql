-- Seed one payment-phone ops device (run AFTER 090_admin_ops_momo_sms.sql)
-- The plaintext API key is NOT stored in git.
-- Use your local copy: apps/admin-ops-mobile/DEVICE_KEY.txt (or regenerate via admin ops devices API).
--
-- Base URL in the app defaults to: https://www.dataflexghana.com

INSERT INTO ops_devices (label, api_key_hash, api_key_prefix, enabled)
VALUES (
  'payment-phone',
  'a75db06c3938e91942ab5a6d9031c7c3c56605a69ade6b2237dcfd2538ba253c',
  'ops_AtBEu2sk',
  true
)
ON CONFLICT DO NOTHING;

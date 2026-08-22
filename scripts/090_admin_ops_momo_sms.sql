-- Admin Ops / MoMo SMS capture tables (additive; does not alter existing order/wallet flows)

-- Devices that may call /api/ops/* with a bearer API key
CREATE TABLE IF NOT EXISTS ops_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL DEFAULT 'payment-phone',
  api_key_hash TEXT NOT NULL,
  api_key_prefix TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ops_devices_api_key_hash
  ON ops_devices (api_key_hash);

CREATE INDEX IF NOT EXISTS idx_ops_devices_enabled
  ON ops_devices (enabled)
  WHERE enabled = true;

-- Idempotent MoMo SMS processing log
CREATE TABLE IF NOT EXISTS ops_momo_sms_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL,
  amount NUMERIC(12, 2),
  reference_code TEXT,
  payer_name TEXT,
  raw_sms TEXT,
  raw_sms_hash TEXT,
  match_status TEXT NOT NULL DEFAULT 'unmatched',
  -- unmatched | matched | ambiguous | wallet_alert | registration_matched | error | duplicate
  match_entity_type TEXT,
  match_entity_id TEXT,
  match_detail JSONB,
  device_id UUID REFERENCES ops_devices(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ops_momo_sms_events_txn_id
  ON ops_momo_sms_events (transaction_id);

CREATE INDEX IF NOT EXISTS idx_ops_momo_sms_events_reference
  ON ops_momo_sms_events (reference_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_momo_sms_events_processed
  ON ops_momo_sms_events (processed_at DESC);

-- Unified admin ops inbox for the Android ops app (mirrors admin alerts)
CREATE TABLE IF NOT EXISTS admin_ops_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  -- info | warning | critical
  title TEXT NOT NULL,
  body TEXT,
  deeplink_tab TEXT,
  entity_type TEXT,
  entity_id TEXT,
  requires_ack BOOLEAN NOT NULL DEFAULT false,
  acked_at TIMESTAMPTZ,
  acked_by_device UUID REFERENCES ops_devices(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'system',
  -- audit_log | pending | momo_sms | registration | system
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_ops_inbox_created
  ON admin_ops_inbox (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_ops_inbox_unacked
  ON admin_ops_inbox (created_at DESC)
  WHERE requires_ack = true AND acked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_ops_inbox_category
  ON admin_ops_inbox (category, created_at DESC);

-- Manual registration MoMo payment intents (persisted so SMS can match)
CREATE TABLE IF NOT EXISTS registration_payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 47,
  agent_name TEXT,
  agent_email TEXT,
  agent_phone TEXT,
  payment_method TEXT NOT NULL DEFAULT 'manual',
  -- manual | paystack
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | matched | expired | cancelled
  paystack_reference TEXT,
  matched_transaction_id TEXT,
  matched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_registration_payment_intents_code_pending
  ON registration_payment_intents (reference_code)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_registration_payment_intents_status
  ON registration_payment_intents (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_payment_intents_paystack
  ON registration_payment_intents (paystack_reference)
  WHERE paystack_reference IS NOT NULL;

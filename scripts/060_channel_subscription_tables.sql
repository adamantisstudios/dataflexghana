-- ============================================================
-- 060: Channel subscription tables (additive / sandboxed)
-- Documents and creates subscription-related tables used by the app.
-- Safe to run multiple times (IF NOT EXISTS).
-- ============================================================

-- Per-channel subscription settings
CREATE TABLE IF NOT EXISTS channel_subscription_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_contact_name TEXT,
  payment_contact_number TEXT,
  payment_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id)
);

-- Legacy channel_subscriptions (historical reference only; app logic uses member_subscription_status)
CREATE TABLE IF NOT EXISTS channel_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  subscription_start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  subscription_end_date TIMESTAMPTZ NOT NULL,
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subscription_status VARCHAR(50) DEFAULT 'active',
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by VARCHAR(255),
  verified_payment_amount DECIMAL(10, 2),
  is_renewal_due BOOLEAN DEFAULT false,
  renewal_reminder_sent_at TIMESTAMPTZ,
  auto_removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Active member subscription tracking (source of truth)
CREATE TABLE IF NOT EXISTS member_subscription_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  join_request_id UUID REFERENCES channel_join_requests(id) ON DELETE CASCADE,
  subscription_starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  subscription_expires_at TIMESTAMPTZ NOT NULL,
  renewal_reminder_sent_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  payment_verified_at TIMESTAMPTZ,
  payment_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_notes TEXT,
  approved_by_agent_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_member_sub_status_channel ON member_subscription_status(channel_id);
CREATE INDEX IF NOT EXISTS idx_member_sub_status_agent ON member_subscription_status(agent_id);
CREATE INDEX IF NOT EXISTS idx_member_sub_status_expires ON member_subscription_status(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_member_sub_status_active ON member_subscription_status(is_active);

-- Payment audit logs
CREATE TABLE IF NOT EXISTS subscription_payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  payment_date TIMESTAMPTZ,
  notes TEXT,
  admin_notes TEXT,
  verification_status VARCHAR(50) DEFAULT 'unverified',
  verified_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Renewal requests (references member_subscription_status)
CREATE TABLE IF NOT EXISTS subscription_renewal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES channel_subscriptions(id) ON DELETE CASCADE,
  member_subscription_id UUID REFERENCES member_subscription_status(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id VARCHAR(255) NOT NULL,
  renewal_start_date TIMESTAMPTZ NOT NULL,
  renewal_end_date TIMESTAMPTZ NOT NULL,
  renewal_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscription_renewal_requests
  ADD COLUMN IF NOT EXISTS member_subscription_id UUID REFERENCES member_subscription_status(id) ON DELETE CASCADE;

-- Admin verification audit log
CREATE TABLE IF NOT EXISTS subscription_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES channel_subscriptions(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id VARCHAR(255) NOT NULL,
  verified_by VARCHAR(255) NOT NULL,
  action VARCHAR(50) DEFAULT 'approved',
  amount_verified DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow member_subscription_status ids in verification log (nullable legacy FK)
ALTER TABLE subscription_verification_log
  ALTER COLUMN subscription_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_status ON channel_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_expiry ON channel_subscriptions(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_renewal_requests_agent_id ON subscription_renewal_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_subscription_renewal_requests_payment_status ON subscription_renewal_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_subscription_verification_log_channel_id ON subscription_verification_log(channel_id);

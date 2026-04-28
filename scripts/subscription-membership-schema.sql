-- ============================================================
-- SUBSCRIPTION MEMBERSHIP TRACKING SCHEMA
-- Adds complete tracking for subscription status, payments, and auto-expiry
-- ============================================================

-- Add subscription_status column to channel_subscriptions to track membership status
ALTER TABLE channel_subscriptions ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE channel_subscriptions ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE channel_subscriptions ADD COLUMN IF NOT EXISTS payment_verified_by VARCHAR(255);
ALTER TABLE channel_subscriptions ADD COLUMN IF NOT EXISTS verified_payment_amount DECIMAL(10, 2);
ALTER TABLE channel_subscriptions ADD COLUMN IF NOT EXISTS is_renewal_due BOOLEAN DEFAULT FALSE;
ALTER TABLE channel_subscriptions ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE channel_subscriptions ADD COLUMN IF NOT EXISTS auto_removed_at TIMESTAMP WITH TIME ZONE;

-- Update subscription_payment_logs to track more payment details
ALTER TABLE subscription_payment_logs ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE subscription_payment_logs ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified';
ALTER TABLE subscription_payment_logs ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255);

-- Create subscription_renewal_requests table for renewal tracking
CREATE TABLE IF NOT EXISTS subscription_renewal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES channel_subscriptions(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id VARCHAR(255) NOT NULL,
  renewal_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  renewal_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  renewal_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_verification_log for tracking admin/teacher actions
CREATE TABLE IF NOT EXISTS subscription_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES channel_subscriptions(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id VARCHAR(255) NOT NULL,
  verified_by VARCHAR(255) NOT NULL,
  action VARCHAR(50) DEFAULT 'approved',
  amount_verified DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_status ON channel_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_renewal_due ON channel_subscriptions(is_renewal_due);
CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_expiry ON channel_subscriptions(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_renewal_requests_agent_id ON subscription_renewal_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_subscription_renewal_requests_payment_status ON subscription_renewal_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_subscription_verification_log_channel_id ON subscription_verification_log(channel_id);

-- RLS Policies for subscription_renewal_requests
ALTER TABLE subscription_renewal_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own renewal requests" ON subscription_renewal_requests;
CREATE POLICY "Users can view their own renewal requests"
  ON subscription_renewal_requests
  FOR SELECT
  USING (agent_id = auth.uid()::text);

DROP POLICY IF EXISTS "Channel admins can view renewal requests" ON subscription_renewal_requests;
CREATE POLICY "Channel admins can view renewal requests"
  ON subscription_renewal_requests
  FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM teaching_channels
      WHERE created_by = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Allow insert renewal requests" ON subscription_renewal_requests;
CREATE POLICY "Allow insert renewal requests"
  ON subscription_renewal_requests
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for subscription_verification_log
ALTER TABLE subscription_verification_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view verification logs for their subscriptions" ON subscription_verification_log;
CREATE POLICY "Users can view verification logs for their subscriptions"
  ON subscription_verification_log
  FOR SELECT
  USING (agent_id = auth.uid()::text);

DROP POLICY IF EXISTS "Channel admins can view verification logs" ON subscription_verification_log;
CREATE POLICY "Channel admins can view verification logs"
  ON subscription_verification_log
  FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM teaching_channels
      WHERE created_by = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Allow insert verification logs" ON subscription_verification_log;
CREATE POLICY "Allow insert verification logs"
  ON subscription_verification_log
  FOR INSERT
  WITH CHECK (true);

-- Add subscription_visible_to_non_members view for channels section
CREATE OR REPLACE VIEW channel_subscription_info_for_browse AS
SELECT 
  c.id,
  c.name,
  c.description,
  css.is_enabled,
  css.monthly_fee,
  CASE WHEN css.is_enabled THEN 'paid' ELSE 'free' END AS channel_type
FROM teaching_channels c
LEFT JOIN channel_subscription_settings css ON c.id = css.channel_id
WHERE c.is_public = true AND c.is_active = true;

-- ============================================================
-- SUBSCRIPTION MEMBERSHIP TRACKING SCHEMA - FIX v2
-- Fixes RLS policy type mismatches (UUID vs TEXT)
-- ============================================================

-- Fixed UUID type mismatch in subscription_renewal_requests RLS policies
-- Changed from auth.uid()::text to plain auth.uid() since agent_id should be TEXT but we need consistent casting
-- Actually reverting: agent_id is VARCHAR(255), so we need ::text cast on auth.uid()

-- Drop and recreate subscription_renewal_requests RLS policies with correct casting
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

-- Fixed UUID type mismatch in subscription_verification_log RLS policies
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

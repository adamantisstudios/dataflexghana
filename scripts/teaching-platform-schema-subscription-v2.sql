-- ============================================================
-- TEACHING PLATFORM SUBSCRIPTION SCHEMA - FIX v2
-- Fixed RLS policy type mismatches
-- ============================================================

-- Fixed channel_subscription_settings RLS - teaching_channels.created_by is VARCHAR(255)
DROP POLICY IF EXISTS "Channel admins/teachers can update subscription settings" ON channel_subscription_settings;
CREATE POLICY "Channel admins/teachers can update subscription settings"
  ON channel_subscription_settings
  FOR UPDATE
  USING (
    channel_id IN (
      SELECT id FROM teaching_channels
      WHERE created_by = auth.uid()::text  -- VARCHAR(255) column, cast UUID to text
    )
  );

-- Fixed channel_subscriptions RLS - agent_id is UUID
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON channel_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON channel_subscriptions
  FOR SELECT
  USING (agent_id = auth.uid());  -- UUID column, auth.uid() is already UUID, no cast needed

-- Fixed channel_subscriptions RLS for channel admins
DROP POLICY IF EXISTS "Channel admins can view member subscriptions" ON channel_subscriptions;
CREATE POLICY "Channel admins can view member subscriptions"
  ON channel_subscriptions
  FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM teaching_channels
      WHERE created_by = auth.uid()::text  -- VARCHAR(255) column, cast UUID to text
    )
  );

DROP POLICY IF EXISTS "Allow insert subscriptions" ON channel_subscriptions;
CREATE POLICY "Allow insert subscriptions"
  ON channel_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Fixed subscription_payment_logs RLS - agent_id is UUID
DROP POLICY IF EXISTS "Users can view their own payment logs" ON subscription_payment_logs;
CREATE POLICY "Users can view their own payment logs"
  ON subscription_payment_logs
  FOR SELECT
  USING (agent_id = auth.uid());  -- UUID column, auth.uid() is already UUID, no cast needed

-- Fixed subscription_payment_logs RLS for channel admins
DROP POLICY IF EXISTS "Channel admins can view payment logs" ON subscription_payment_logs;
CREATE POLICY "Channel admins can view payment logs"
  ON subscription_payment_logs
  FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM teaching_channels
      WHERE created_by = auth.uid()::text  -- VARCHAR(255) column, cast UUID to text
    )
  );

DROP POLICY IF EXISTS "Allow insert payment logs" ON subscription_payment_logs;
CREATE POLICY "Allow insert payment logs"
  ON subscription_payment_logs
  FOR INSERT
  WITH CHECK (true);

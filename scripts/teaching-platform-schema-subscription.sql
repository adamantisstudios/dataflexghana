-- -------------------------------
-- channel_subscription_settings
-- -------------------------------

-- Anyone can view subscription settings for public channels
DROP POLICY IF EXISTS "Anyone can view subscription settings for public channels" ON channel_subscription_settings;
CREATE POLICY "Anyone can view subscription settings for public channels"
  ON channel_subscription_settings
  FOR SELECT
  USING (true);

-- Channel admins/teachers can update subscription settings
DROP POLICY IF EXISTS "Channel admins/teachers can update subscription settings" ON channel_subscription_settings;
CREATE POLICY "Channel admins/teachers can update subscription settings"
  ON channel_subscription_settings
  FOR UPDATE
  USING (
    channel_id IN (
      SELECT id FROM teaching_channels
      WHERE created_by = auth.uid()::text  -- cast auth.uid() to text to match varchar
    )
  );

-- Channel admins can insert subscription settings
DROP POLICY IF EXISTS "Channel admins can insert subscription settings" ON channel_subscription_settings;
CREATE POLICY "Channel admins can insert subscription settings"
  ON channel_subscription_settings
  FOR INSERT
  WITH CHECK (true);

-- -------------------------------
-- channel_subscriptions
-- -------------------------------

-- Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON channel_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON channel_subscriptions
  FOR SELECT
  USING (agent_id = auth.uid()::uuid);  -- cast auth.uid() to UUID to match agent_id

-- Channel admins can view member subscriptions
DROP POLICY IF EXISTS "Channel admins can view member subscriptions" ON channel_subscriptions;
CREATE POLICY "Channel admins can view member subscriptions"
  ON channel_subscriptions
  FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM teaching_channels
      WHERE created_by = auth.uid()::text  -- cast auth.uid() to text to match varchar
    )
  );

-- Allow insert subscriptions
DROP POLICY IF EXISTS "Allow insert subscriptions" ON channel_subscriptions;
CREATE POLICY "Allow insert subscriptions"
  ON channel_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- -------------------------------
-- subscription_payment_logs
-- -------------------------------

-- Users can view their own payment logs
DROP POLICY IF EXISTS "Users can view their own payment logs" ON subscription_payment_logs;
CREATE POLICY "Users can view their own payment logs"
  ON subscription_payment_logs
  FOR SELECT
  USING (agent_id = auth.uid()::uuid);  -- cast auth.uid() to UUID to match agent_id

-- Channel admins can view payment logs
DROP POLICY IF EXISTS "Channel admins can view payment logs" ON subscription_payment_logs;
CREATE POLICY "Channel admins can view payment logs"
  ON subscription_payment_logs
  FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM teaching_channels
      WHERE created_by = auth.uid()::text  -- cast auth.uid() to text to match varchar
    )
  );

-- Allow insert payment logs
DROP POLICY IF EXISTS "Allow insert payment logs" ON subscription_payment_logs;
CREATE POLICY "Allow insert payment logs"
  ON subscription_payment_logs
  FOR INSERT
  WITH CHECK (true);

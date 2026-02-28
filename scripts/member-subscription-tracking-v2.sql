-- ============================================================
-- MEMBER SUBSCRIPTION TRACKING - FIX v2
-- Fixed RLS policy type mismatches
-- ============================================================

-- Fixed RLS policies - agent_id is UUID in member_subscription_status
DROP POLICY IF EXISTS "Users can view their own subscription status" ON member_subscription_status;
CREATE POLICY "Users can view their own subscription status" ON member_subscription_status
  FOR SELECT USING (agent_id = auth.uid());  -- UUID column, auth.uid() is already UUID, no cast needed

DROP POLICY IF EXISTS "Channel admins can view member subscriptions" ON member_subscription_status;
CREATE POLICY "Channel admins can view member subscriptions" ON member_subscription_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teaching_channels tc
      WHERE tc.id = member_subscription_status.channel_id
      AND tc.created_by = auth.uid()::text  -- VARCHAR(255) column, cast UUID to text
    ) OR EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = member_subscription_status.channel_id
      AND cm.agent_id = auth.uid()::text  -- agent_id in channel_members is VARCHAR(255)
      AND cm.role IN ('admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Channel admins can update subscription status" ON member_subscription_status;
CREATE POLICY "Channel admins can update subscription status" ON member_subscription_status
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teaching_channels tc
      WHERE tc.id = member_subscription_status.channel_id
      AND tc.created_by = auth.uid()::text  -- VARCHAR(255) column, cast UUID to text
    ) OR EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = member_subscription_status.channel_id
      AND cm.agent_id = auth.uid()::text  -- VARCHAR(255) column, cast UUID to text
      AND cm.role IN ('admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "System can insert subscriptions" ON member_subscription_status;
CREATE POLICY "System can insert subscriptions" ON member_subscription_status
  FOR INSERT WITH CHECK (true);

-- Create member subscription tracking table
CREATE TABLE IF NOT EXISTS member_subscription_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  join_request_id UUID REFERENCES channel_join_requests(id) ON DELETE CASCADE,
  subscription_starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subscription_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  renewal_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  payment_verified_at TIMESTAMP WITH TIME ZONE,
  payment_amount NUMERIC(10, 2) NOT NULL,
  payment_notes TEXT,
  approved_by_agent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, agent_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_member_sub_status_channel ON member_subscription_status(channel_id);
CREATE INDEX IF NOT EXISTS idx_member_sub_status_agent ON member_subscription_status(agent_id);
CREATE INDEX IF NOT EXISTS idx_member_sub_status_expires ON member_subscription_status(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_member_sub_status_active ON member_subscription_status(is_active);

-- RLS Policies
ALTER TABLE member_subscription_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription status
DROP POLICY IF EXISTS "Users can view their own subscription status" ON member_subscription_status;
CREATE POLICY "Users can view their own subscription status" ON member_subscription_status
  FOR SELECT USING (agent_id = auth.uid()::text);

-- Policy: Channel admins can view member subscriptions
DROP POLICY IF EXISTS "Channel admins can view member subscriptions" ON member_subscription_status;
CREATE POLICY "Channel admins can view member subscriptions" ON member_subscription_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teaching_channels tc
      WHERE tc.id = member_subscription_status.channel_id
      AND tc.created_by = auth.uid()::text
    ) OR EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = member_subscription_status.channel_id
      AND cm.agent_id = auth.uid()::text
      AND cm.role IN ('admin', 'teacher')
    )
  );

-- Policy: Channel admins can update subscription status
DROP POLICY IF EXISTS "Channel admins can update subscription status" ON member_subscription_status;
CREATE POLICY "Channel admins can update subscription status" ON member_subscription_status
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teaching_channels tc
      WHERE tc.id = member_subscription_status.channel_id
      AND tc.created_by = auth.uid()::text
    ) OR EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = member_subscription_status.channel_id
      AND cm.agent_id = auth.uid()::text
      AND cm.role IN ('admin', 'teacher')
    )
  );

-- Policy: System can insert new subscriptions
DROP POLICY IF EXISTS "System can insert subscriptions" ON member_subscription_status;
CREATE POLICY "System can insert subscriptions" ON member_subscription_status
  FOR INSERT WITH CHECK (true);

-- Create SMS Logs Table for Tracking SMS Notifications
-- This table tracks all SMS messages sent to agents

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  campaign_name VARCHAR(255),
  api_response JSONB, -- Store full API response for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sms_logs_agent_id ON sms_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_campaign_name ON sms_logs(campaign_name);
CREATE INDEX IF NOT EXISTS idx_sms_logs_agent_sent_at ON sms_logs(agent_id, sent_at DESC);

-- Enable Row Level Security
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow admins to view all SMS logs
CREATE POLICY "Admins can view all SMS logs" ON sms_logs
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'is_admin' = 'true');

-- Create RLS policy to allow system to insert SMS logs
CREATE POLICY "System can insert SMS logs" ON sms_logs
  FOR INSERT
  WITH CHECK (true);

-- Optional: Create a view for easier querying
CREATE OR REPLACE VIEW sms_logs_with_agent_details AS
SELECT 
  sl.id,
  sl.agent_id,
  sl.phone_number,
  sl.message_content,
  sl.sent_at,
  sl.status,
  sl.campaign_name,
  sl.api_response,
  sl.created_at,
  a.full_name,
  a.email,
  a.region,
  a.isapproved
FROM sms_logs sl
JOIN agents a ON sl.agent_id = a.id
ORDER BY sl.sent_at DESC;

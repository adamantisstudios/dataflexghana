-- Target a notification to one agent (null = broadcast to all agents)
ALTER TABLE agent_notifications
  ADD COLUMN IF NOT EXISTS target_agent_id UUID REFERENCES agents(id);

CREATE INDEX IF NOT EXISTS idx_agent_notifications_target_agent_id
  ON agent_notifications (target_agent_id)
  WHERE target_agent_id IS NOT NULL;

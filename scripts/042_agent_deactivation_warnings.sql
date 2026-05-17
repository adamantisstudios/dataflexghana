-- Agent deactivation warnings & soft-delete support
ALTER TABLE agents ADD COLUMN IF NOT EXISTS warned_at TIMESTAMPTZ;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN agents.warned_at IS 'Last deactivation warning sent (7-day or 3-day notice)';
COMMENT ON COLUMN agents.deleted_at IS 'Soft-delete timestamp; hidden from public storefront when set';

-- Optional: per-agent in-app notifications (null = broadcast to all agents)
ALTER TABLE agent_notifications ADD COLUMN IF NOT EXISTS target_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_agent_notifications_target ON agent_notifications (target_agent_id)
  WHERE target_agent_id IS NOT NULL;

-- Allow admins to grant channel-creation (teacher) permission to approved agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS can_teach BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_agents_can_teach ON agents(can_teach) WHERE can_teach = true;

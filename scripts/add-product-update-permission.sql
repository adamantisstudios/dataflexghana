-- Add can_update_products column to agents table
-- This column controls whether agents can edit/update their submitted products

ALTER TABLE agents ADD COLUMN IF NOT EXISTS can_update_products boolean DEFAULT false NOT NULL;

-- Create index for performance on this column
CREATE INDEX IF NOT EXISTS idx_agents_can_update_products ON agents(can_update_products);

-- Add comment for documentation
COMMENT ON COLUMN agents.can_update_products IS 'Permission flag: whether this agent can edit/update their submitted products. When false, only admin can edit. When true, agent can edit (except status field which only admin controls).';

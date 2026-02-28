-- Fix foreign key constraint by converting agent_id to UUID
-- This script handles the type mismatch between character varying and uuid

-- Step 1: Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS channel_members 
DROP CONSTRAINT IF EXISTS fk_channel_members_agent_id CASCADE;

ALTER TABLE IF EXISTS channel_join_requests 
DROP CONSTRAINT IF EXISTS fk_channel_join_requests_agent_id CASCADE;

-- Step 2: Convert agent_id columns to UUID type
ALTER TABLE channel_members 
ALTER COLUMN agent_id TYPE uuid USING agent_id::uuid;

ALTER TABLE channel_join_requests 
ALTER COLUMN agent_id TYPE uuid USING agent_id::uuid;

-- Step 3: Add proper foreign key constraints
ALTER TABLE channel_members
ADD CONSTRAINT fk_channel_members_agent_id 
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

ALTER TABLE channel_join_requests
ADD CONSTRAINT fk_channel_join_requests_agent_id 
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_channel_members_agent_id ON channel_members(agent_id);
CREATE INDEX IF NOT EXISTS idx_channel_join_requests_agent_id ON channel_join_requests(agent_id);

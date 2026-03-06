-- =============================================================================
-- ADD MISSING FOREIGN KEY RELATIONSHIPS FOR TEACHING CHANNELS
-- =============================================================================

-- 1. Add foreign key from channel_members to agents table
ALTER TABLE channel_members
ADD CONSTRAINT fk_channel_members_agent_id 
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- 2. Add foreign key from channel_join_requests to agents table
ALTER TABLE channel_join_requests
ADD CONSTRAINT fk_channel_join_requests_agent_id 
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_channel_members_agent_id ON channel_members(agent_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_status ON channel_members(status);
CREATE INDEX IF NOT EXISTS idx_channel_join_requests_agent_id ON channel_join_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_channel_join_requests_channel_id ON channel_join_requests(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_join_requests_status ON channel_join_requests(status);

-- 4. Create a view for easy member queries with agent details
CREATE OR REPLACE VIEW channel_members_with_agents AS
SELECT 
    cm.id,
    cm.channel_id,
    cm.agent_id,
    cm.role,
    cm.status,
    cm.joined_at,
    a.full_name,
    a.email
FROM channel_members cm
LEFT JOIN agents a ON cm.agent_id = a.id;

-- 5. Create a view for easy join request queries with agent details
CREATE OR REPLACE VIEW channel_join_requests_with_agents AS
SELECT 
    cjr.id,
    cjr.channel_id,
    cjr.agent_id,
    cjr.request_message,
    cjr.status,
    cjr.created_at,
    cjr.responded_at,
    a.full_name,
    a.email
FROM channel_join_requests cjr
LEFT JOIN agents a ON cjr.agent_id = a.id;

-- 6. Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON channel_members_with_agents TO authenticated;
-- GRANT SELECT ON channel_join_requests_with_agents TO authenticated;

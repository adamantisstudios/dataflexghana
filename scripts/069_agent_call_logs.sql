-- Admin agent call-tracking CRM (sandboxed)

CREATE TABLE IF NOT EXISTS agent_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    call_date TIMESTAMPTZ DEFAULT NOW(),
    call_duration_minutes INTEGER,
    discussion_notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    call_status TEXT DEFAULT 'completed' CHECK (call_status IN ('completed','no_answer','voicemail','scheduled')),
    admin_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_agent ON agent_call_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON agent_call_logs(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_follow_up ON agent_call_logs(follow_up_required, follow_up_date);

ALTER TABLE agent_call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Block anon/authenticated" ON agent_call_logs;
CREATE POLICY "Block anon/authenticated" ON agent_call_logs AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

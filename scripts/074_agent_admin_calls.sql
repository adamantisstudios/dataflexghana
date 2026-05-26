-- Agent-to-admin voice support calls (LiveKit audio rooms + status signaling)

CREATE TABLE IF NOT EXISTS call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    livekit_room_name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'ringing'
        CHECK (status IN ('ringing', 'active', 'ended', 'declined', 'busy')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions (status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_receiver_status ON call_sessions (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller_status ON call_sessions (caller_id, status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_created ON call_sessions (created_at DESC);

ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Block anon/authenticated" ON call_sessions;
CREATE POLICY "Block anon/authenticated" ON call_sessions AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

-- Enable Supabase Realtime for admin incoming-call notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'call_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
  END IF;
END $$;

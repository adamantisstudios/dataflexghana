-- Channel live audio/video sessions (TikTok-style; host = channel admin/teacher)

CREATE TABLE IF NOT EXISTS channel_live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
    room_name TEXT NOT NULL UNIQUE,
    session_type TEXT NOT NULL CHECK (session_type IN ('audio', 'video')),
    host_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    title TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_channel_live_active ON channel_live_sessions (channel_id, is_active);
CREATE INDEX IF NOT EXISTS idx_channel_live_room ON channel_live_sessions (room_name);

CREATE TABLE IF NOT EXISTS channel_live_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES channel_live_sessions(id) ON DELETE CASCADE,
    sender_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_live_messages_session ON channel_live_messages (session_id, created_at ASC);

ALTER TABLE channel_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_live_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated sessions" ON channel_live_sessions;
CREATE POLICY "Block anon/authenticated sessions" ON channel_live_sessions AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Block anon/authenticated messages" ON channel_live_messages;
CREATE POLICY "Block anon/authenticated messages" ON channel_live_messages AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'channel_live_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE channel_live_sessions;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'channel_live_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE channel_live_messages;
  END IF;
END $$;

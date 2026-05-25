-- Voice room live chat (sandboxed) — persisted messages per room

CREATE TABLE IF NOT EXISTS voice_room_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_name TEXT NOT NULL REFERENCES voice_rooms(room_name) ON DELETE CASCADE,
    sender_agent_id UUID REFERENCES agents(id),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_room_chats_room_created
    ON voice_room_chats (room_name, created_at ASC);

ALTER TABLE voice_room_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Block anon/authenticated" ON voice_room_chats;
CREATE POLICY "Block anon/authenticated" ON voice_room_chats AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

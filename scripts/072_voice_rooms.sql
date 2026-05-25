-- Voice conference rooms (LiveKit) — sandboxed table

CREATE TABLE IF NOT EXISTS voice_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_name TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL,
    created_by UUID REFERENCES agents(id),
    is_active BOOLEAN DEFAULT true,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_voice_rooms_region_active ON voice_rooms (region, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_voice_rooms_created_at ON voice_rooms (created_at DESC);

ALTER TABLE voice_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Block anon/authenticated" ON voice_rooms;
CREATE POLICY "Block anon/authenticated" ON voice_rooms AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

-- Audio Classroom: long-form lectures with timestamped comments (SoundCloud-style)

CREATE TABLE IF NOT EXISTS channel_audio_lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    audio_url TEXT NOT NULL,
    duration INT,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_audio_lectures_channel ON channel_audio_lectures (channel_id, created_at DESC);

CREATE TABLE IF NOT EXISTS channel_audio_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecture_id UUID NOT NULL REFERENCES channel_audio_lectures(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp INT,
    parent_id UUID REFERENCES channel_audio_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_audio_comments_lecture ON channel_audio_comments (lecture_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_channel_audio_comments_parent ON channel_audio_comments (parent_id);

ALTER TABLE channel_audio_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_audio_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated audio lectures" ON channel_audio_lectures;
CREATE POLICY "Block anon/authenticated audio lectures" ON channel_audio_lectures
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Block anon/authenticated audio comments" ON channel_audio_comments;
CREATE POLICY "Block anon/authenticated audio comments" ON channel_audio_comments
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'channel_audio_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE channel_audio_comments;
  END IF;
END $$;

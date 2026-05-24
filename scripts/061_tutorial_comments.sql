-- Tutorial video comments for agent tutorials feed
CREATE TABLE IF NOT EXISTS tutorial_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_video_id UUID REFERENCES tutorial_videos(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutorial_comments_video_id ON tutorial_comments(tutorial_video_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_comments_created_at ON tutorial_comments(created_at DESC);

ALTER TABLE tutorial_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON tutorial_comments;
CREATE POLICY "Block anon/authenticated" ON tutorial_comments AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

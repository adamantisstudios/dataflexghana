-- Admin embed videos for Dataflex Channels
CREATE TABLE IF NOT EXISTS channel_embed_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES teaching_channels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    embed_code TEXT NOT NULL,
    platform TEXT DEFAULT 'vimeo' CHECK (platform IN ('vimeo','youtube')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channel_embed_videos_channel_id ON channel_embed_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_embed_videos_created_at ON channel_embed_videos(created_at DESC);

ALTER TABLE channel_embed_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON channel_embed_videos;
CREATE POLICY "Block anon/authenticated" ON channel_embed_videos AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

-- Allow comments on embed videos (uploaded videos use video_id)
ALTER TABLE video_comments ADD COLUMN IF NOT EXISTS embed_video_id UUID REFERENCES channel_embed_videos(id) ON DELETE CASCADE;
ALTER TABLE video_comments ALTER COLUMN video_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_video_comments_embed_video_id ON video_comments(embed_video_id);

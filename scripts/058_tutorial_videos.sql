CREATE TABLE IF NOT EXISTS tutorial_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vimeo_video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tutorial_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON tutorial_videos;
CREATE POLICY "Block anon/authenticated" ON tutorial_videos AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

INSERT INTO tutorial_videos (vimeo_video_id, title, order_index) VALUES
('1194247499', 'Platform Overview', 1),
('1195030090', 'Storefront Quick Overview', 2);

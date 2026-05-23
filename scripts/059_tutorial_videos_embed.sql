ALTER TABLE tutorial_videos ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'vimeo' CHECK (platform IN ('vimeo', 'youtube'));
ALTER TABLE tutorial_videos ADD COLUMN IF NOT EXISTS embed_code TEXT;

UPDATE tutorial_videos SET platform = 'vimeo' WHERE platform IS NULL;

ALTER TABLE tutorial_videos ALTER COLUMN vimeo_video_id DROP NOT NULL;

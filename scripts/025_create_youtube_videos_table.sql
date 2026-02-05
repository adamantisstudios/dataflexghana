-- YOUTUBE VIDEO POSTS FEATURE
-- Allows teachers to post YouTube videos in the overview section
-- Videos can be viewed in a custom frame or full-screen preview

-- Create youtube_videos table
CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  youtube_video_id VARCHAR(255) NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create youtube_video_likes table
CREATE TABLE IF NOT EXISTS youtube_video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES youtube_videos(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, user_id)
);

-- Create youtube_video_comments table
CREATE TABLE IF NOT EXISTS youtube_video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES youtube_videos(id) ON DELETE CASCADE,
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create youtube_video_saves table
CREATE TABLE IF NOT EXISTS youtube_video_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES youtube_videos(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, user_id)
);

-- Create youtube_video_shares table
CREATE TABLE IF NOT EXISTS youtube_video_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES youtube_videos(id) ON DELETE CASCADE,
  shared_by VARCHAR(255) NOT NULL,
  share_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_video_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_video_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for youtube_videos
CREATE POLICY "youtube_videos_read" ON youtube_videos
  FOR SELECT USING (true);

CREATE POLICY "youtube_videos_insert" ON youtube_videos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "youtube_videos_update" ON youtube_videos
  FOR UPDATE USING (true);

CREATE POLICY "youtube_videos_delete" ON youtube_videos
  FOR DELETE USING (true);

-- RLS Policies for youtube_video_likes
CREATE POLICY "youtube_video_likes_read" ON youtube_video_likes
  FOR SELECT USING (true);

CREATE POLICY "youtube_video_likes_insert" ON youtube_video_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "youtube_video_likes_delete" ON youtube_video_likes
  FOR DELETE USING (true);

-- RLS Policies for youtube_video_comments
CREATE POLICY "youtube_video_comments_read" ON youtube_video_comments
  FOR SELECT USING (true);

CREATE POLICY "youtube_video_comments_insert" ON youtube_video_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "youtube_video_comments_update" ON youtube_video_comments
  FOR UPDATE USING (true);

CREATE POLICY "youtube_video_comments_delete" ON youtube_video_comments
  FOR DELETE USING (true);

-- RLS Policies for youtube_video_saves
CREATE POLICY "youtube_video_saves_read" ON youtube_video_saves
  FOR SELECT USING (true);

CREATE POLICY "youtube_video_saves_insert" ON youtube_video_saves
  FOR INSERT WITH CHECK (true);

CREATE POLICY "youtube_video_saves_delete" ON youtube_video_saves
  FOR DELETE USING (true);

-- RLS Policies for youtube_video_shares
CREATE POLICY "youtube_video_shares_read" ON youtube_video_shares
  FOR SELECT USING (true);

CREATE POLICY "youtube_video_shares_insert" ON youtube_video_shares
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_youtube_videos_channel_id ON youtube_videos(channel_id);
CREATE INDEX idx_youtube_videos_author_id ON youtube_videos(author_id);
CREATE INDEX idx_youtube_videos_created_at ON youtube_videos(created_at DESC);
CREATE INDEX idx_youtube_video_likes_video_id ON youtube_video_likes(video_id);
CREATE INDEX idx_youtube_video_likes_user_id ON youtube_video_likes(user_id);
CREATE INDEX idx_youtube_video_comments_video_id ON youtube_video_comments(video_id);
CREATE INDEX idx_youtube_video_comments_author_id ON youtube_video_comments(author_id);
CREATE INDEX idx_youtube_video_saves_video_id ON youtube_video_saves(video_id);
CREATE INDEX idx_youtube_video_saves_user_id ON youtube_video_saves(user_id);
CREATE INDEX idx_youtube_video_shares_video_id ON youtube_video_shares(video_id);

-- DONE - YouTube videos schema is ready to use

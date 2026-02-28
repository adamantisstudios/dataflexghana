-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL, -- in seconds
  file_size INTEGER, -- in bytes
  width INTEGER DEFAULT 576,
  height INTEGER DEFAULT 1024,
  status TEXT DEFAULT 'processing', -- processing, ready, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0
);

-- Create video_comments table
CREATE TABLE IF NOT EXISTS video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_saves table
CREATE TABLE IF NOT EXISTS video_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Create video_shares table
CREATE TABLE IF NOT EXISTS video_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, shared_by, shared_with)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_by ON videos(created_by);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_user_id ON video_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_created_at ON video_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_saves_video_id ON video_saves(video_id);
CREATE INDEX IF NOT EXISTS idx_video_saves_user_id ON video_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_video_shares_video_id ON video_shares(video_id);
CREATE INDEX IF NOT EXISTS idx_video_shares_shared_by ON video_shares(shared_by);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos
CREATE POLICY "Users can view videos from their channels" ON videos
  FOR SELECT USING (
    channel_id IN (
      SELECT id FROM channels WHERE id IN (
        SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Channel admins can insert videos" ON videos
  FOR INSERT WITH CHECK (
    channel_id IN (
      SELECT channel_id FROM channel_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Video creators can update their videos" ON videos
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Video creators can delete their videos" ON videos
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for video_comments
CREATE POLICY "Users can view comments on accessible videos" ON video_comments
  FOR SELECT USING (
    video_id IN (
      SELECT id FROM videos WHERE channel_id IN (
        SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Channel members can insert comments" ON video_comments
  FOR INSERT WITH CHECK (
    video_id IN (
      SELECT id FROM videos WHERE channel_id IN (
        SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Comment creators can update their comments" ON video_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Comment creators can delete their comments" ON video_comments
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for video_saves
CREATE POLICY "Users can view their own saves" ON video_saves
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can save videos from their channels" ON video_saves
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    video_id IN (
      SELECT id FROM videos WHERE channel_id IN (
        SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own saves" ON video_saves
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for video_shares
CREATE POLICY "Users can view shares involving them" ON video_shares
  FOR SELECT USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Users can share videos" ON video_shares
  FOR INSERT WITH CHECK (
    shared_by = auth.uid() AND
    video_id IN (
      SELECT id FROM videos WHERE channel_id IN (
        SELECT channel_id FROM channel_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Share creators can delete shares" ON video_shares
  FOR DELETE USING (shared_by = auth.uid());

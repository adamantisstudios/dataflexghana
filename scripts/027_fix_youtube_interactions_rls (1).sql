-- Fix RLS policies for youtube_video_likes and youtube_video_saves
-- Cast user_id to UUID to ensure type compatibility

-- Drop existing policies
DROP POLICY IF EXISTS "youtube_video_likes_select" ON youtube_video_likes;
DROP POLICY IF EXISTS "youtube_video_likes_insert" ON youtube_video_likes;
DROP POLICY IF EXISTS "youtube_video_likes_delete" ON youtube_video_likes;

DROP POLICY IF EXISTS "youtube_video_saves_select" ON youtube_video_saves;
DROP POLICY IF EXISTS "youtube_video_saves_insert" ON youtube_video_saves;
DROP POLICY IF EXISTS "youtube_video_saves_delete" ON youtube_video_saves;

-- Create permissive policies for youtube_video_likes with proper UUID casting
CREATE POLICY "youtube_video_likes_select" ON youtube_video_likes
  FOR SELECT USING (true);

CREATE POLICY "youtube_video_likes_insert" ON youtube_video_likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "youtube_video_likes_delete" ON youtube_video_likes
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create permissive policies for youtube_video_saves with proper UUID casting
CREATE POLICY "youtube_video_saves_select" ON youtube_video_saves
  FOR SELECT USING (true);

CREATE POLICY "youtube_video_saves_insert" ON youtube_video_saves
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "youtube_video_saves_delete" ON youtube_video_saves
  FOR DELETE USING (auth.uid()::text = user_id::text);

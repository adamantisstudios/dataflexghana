-- Create storage bucket for teaching media (audio, documents, images)
-- Run this script in Supabase SQL Editor

-- Create the teaching-media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('teaching-media', 'teaching-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the teaching-media bucket
CREATE POLICY "Allow authenticated users to upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'teaching-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public read access to media"
ON storage.objects FOR SELECT
USING (bucket_id = 'teaching-media');

CREATE POLICY "Allow users to delete their own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'teaching-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table to track media uploads
CREATE TABLE IF NOT EXISTS media_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('audio', 'document', 'image')),
  storage_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for media_uploads
CREATE INDEX IF NOT EXISTS idx_media_uploads_user_id ON media_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_media_uploads_channel_id ON media_uploads(channel_id);
CREATE INDEX IF NOT EXISTS idx_media_uploads_created_at ON media_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_media_uploads_media_type ON media_uploads(media_type);

-- Enable RLS on media_uploads
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for media_uploads
CREATE POLICY "Users can view media in their channels"
ON media_uploads FOR SELECT
USING (
  channel_id IN (
    SELECT id FROM teaching_channels 
    WHERE admin_id = auth.uid() 
    OR id IN (
      SELECT channel_id FROM channel_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert media to their channels"
ON media_uploads FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND channel_id IN (
    SELECT id FROM teaching_channels 
    WHERE admin_id = auth.uid() 
    OR id IN (
      SELECT channel_id FROM channel_members 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can delete media from their channels"
ON media_uploads FOR DELETE
USING (
  channel_id IN (
    SELECT id FROM teaching_channels 
    WHERE admin_id = auth.uid()
  )
);

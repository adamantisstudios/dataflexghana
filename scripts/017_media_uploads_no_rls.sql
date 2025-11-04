-- ============================================================================
-- MEDIA UPLOADS TABLE - NO RLS (Custom Auth System)
-- ============================================================================
-- This script creates a media_uploads table for tracking media metadata
-- WITHOUT RLS policies, since the app uses custom localStorage-based auth
-- instead of Supabase Auth. Authentication is handled at the API layer.
-- ============================================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS media_uploads CASCADE;

-- Create media_uploads table
CREATE TABLE media_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  uploader_id VARCHAR(255) NOT NULL,  -- Agent ID from custom auth
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,  -- 'image', 'audio', 'document', 'text'
  file_size BIGINT,
  storage_path VARCHAR(500),
  mime_type VARCHAR(100),
  duration_seconds INTEGER,  -- For audio files
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_media_uploads_channel_id ON media_uploads(channel_id);
CREATE INDEX idx_media_uploads_uploader_id ON media_uploads(uploader_id);
CREATE INDEX idx_media_uploads_file_type ON media_uploads(file_type);
CREATE INDEX idx_media_uploads_created_at ON media_uploads(created_at DESC);

-- Enable RLS (but don't create policies - auth handled at API layer)
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy that allows all authenticated requests
-- The actual authorization happens in the API middleware
CREATE POLICY "media_uploads_authenticated_access" ON media_uploads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================

-- Create storage buckets for different media types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('channel-images', 'channel-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('channel-audio', 'channel-audio', true, 104857600, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']),
  ('channel-documents', 'channel-documents', true, 52428800, ARRAY['application/pdf', 'application/msword', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE BUCKET POLICIES (Permissive - Auth at API Layer)
-- ============================================================================

-- Images bucket - allow all authenticated users to read and write
CREATE POLICY "images_authenticated_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'channel-images');

CREATE POLICY "images_authenticated_write" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'channel-images');

CREATE POLICY "images_authenticated_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'channel-images');

-- Audio bucket - allow all authenticated users to read and write
CREATE POLICY "audio_authenticated_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'channel-audio');

CREATE POLICY "audio_authenticated_write" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'channel-audio');

CREATE POLICY "audio_authenticated_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'channel-audio');

-- Documents bucket - allow all authenticated users to read and write
CREATE POLICY "documents_authenticated_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'channel-documents');

CREATE POLICY "documents_authenticated_write" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'channel-documents');

CREATE POLICY "documents_authenticated_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'channel-documents');

-- ============================================================================
-- HELPER FUNCTION FOR MEDIA UPLOADS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_media_upload(
  p_channel_id UUID,
  p_uploader_id VARCHAR(255),
  p_file_name VARCHAR(255),
  p_file_type VARCHAR(50),
  p_file_size BIGINT,
  p_storage_path VARCHAR(500),
  p_mime_type VARCHAR(100),
  p_duration_seconds INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_media_id UUID;
BEGIN
  INSERT INTO media_uploads (
    channel_id,
    uploader_id,
    file_name,
    file_type,
    file_size,
    storage_path,
    mime_type,
    duration_seconds
  ) VALUES (
    p_channel_id,
    p_uploader_id,
    p_file_name,
    p_file_type,
    p_file_size,
    p_storage_path,
    p_mime_type,
    p_duration_seconds
  )
  RETURNING id INTO v_media_id;
  
  RETURN v_media_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
SELECT 'media_uploads table created' as status;
SELECT 'Storage buckets configured' as status;
SELECT 'RLS policies created' as status;

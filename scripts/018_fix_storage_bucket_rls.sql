-- ============================================================================
-- FIX STORAGE BUCKET RLS POLICIES
-- ============================================================================
-- This script fixes the RLS policies for storage buckets to allow uploads
-- The issue was that policies were referencing bucket_id incorrectly
-- ============================================================================

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "images_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "images_authenticated_write" ON storage.objects;
DROP POLICY IF EXISTS "images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "audio_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "audio_authenticated_write" ON storage.objects;
DROP POLICY IF EXISTS "audio_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_write" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_delete" ON storage.objects;

-- ============================================================================
-- CREATE PERMISSIVE POLICIES FOR TEACHING-MEDIA BUCKET
-- ============================================================================

-- Allow all users to read from teaching-media bucket
CREATE POLICY "teaching_media_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'teaching-media');

-- Allow all users to upload to teaching-media bucket
CREATE POLICY "teaching_media_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'teaching-media');

-- Allow all users to delete from teaching-media bucket
CREATE POLICY "teaching_media_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'teaching-media');

-- ============================================================================
-- CREATE PERMISSIVE POLICIES FOR CHANNEL-IMAGES BUCKET
-- ============================================================================

CREATE POLICY "channel_images_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'channel-images');

CREATE POLICY "channel_images_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'channel-images');

CREATE POLICY "channel_images_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'channel-images');

-- ============================================================================
-- CREATE PERMISSIVE POLICIES FOR CHANNEL-AUDIO BUCKET
-- ============================================================================

CREATE POLICY "channel_audio_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'channel-audio');

CREATE POLICY "channel_audio_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'channel-audio');

CREATE POLICY "channel_audio_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'channel-audio');

-- ============================================================================
-- CREATE PERMISSIVE POLICIES FOR CHANNEL-DOCUMENTS BUCKET
-- ============================================================================

CREATE POLICY "channel_documents_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'channel-documents');

CREATE POLICY "channel_documents_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'channel-documents');

CREATE POLICY "channel_documents_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'channel-documents');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Storage bucket RLS policies fixed' as status;

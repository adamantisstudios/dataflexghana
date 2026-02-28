-- ============================================================
-- MESSAGE MEDIA TABLE ENHANCEMENTS
-- Add support for audio, documents, and other media types
-- ============================================================

-- Ensure message_media table exists with all required columns
CREATE TABLE IF NOT EXISTS message_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES channel_messages(id) ON DELETE CASCADE,
  media_type VARCHAR(50) NOT NULL,
  media_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  duration DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE message_media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "message_media_read" ON message_media;
DROP POLICY IF EXISTS "message_media_insert" ON message_media;
DROP POLICY IF EXISTS "message_media_delete" ON message_media;

-- Create policies
CREATE POLICY "message_media_read" ON message_media
  FOR SELECT USING (true);

CREATE POLICY "message_media_insert" ON message_media
  FOR INSERT WITH CHECK (true);

CREATE POLICY "message_media_delete" ON message_media
  FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_media_message_id ON message_media(message_id);
CREATE INDEX IF NOT EXISTS idx_message_media_media_type ON message_media(media_type);
CREATE INDEX IF NOT EXISTS idx_message_media_created_at ON message_media(created_at);

-- ============================================================
-- DONE - Message media table is ready
-- ============================================================

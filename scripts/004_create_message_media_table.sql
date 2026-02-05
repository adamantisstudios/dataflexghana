-- Create message_media table to store media references (images, audio)
CREATE TABLE IF NOT EXISTS message_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES channel_messages(id) ON DELETE CASCADE,
  media_type varchar(50) NOT NULL, -- 'image', 'audio'
  media_url text NOT NULL, -- URL from Vercel Blob
  file_name text NOT NULL,
  file_size integer, -- in bytes
  duration integer, -- for audio, in milliseconds
  width integer, -- for images
  height integer, -- for images
  thumbnail_url text, -- for images
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_media_message_id ON message_media(message_id);
CREATE INDEX IF NOT EXISTS idx_message_media_media_type ON message_media(media_type);

-- Enable RLS
ALTER TABLE message_media ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view media from messages they can see
CREATE POLICY "Users can view message media" ON message_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_messages 
      WHERE channel_messages.id = message_media.message_id
      AND EXISTS (
        SELECT 1 FROM channel_members 
        WHERE channel_members.channel_id = channel_messages.channel_id 
        AND channel_members.agent_id = auth.uid()
      )
    )
  );

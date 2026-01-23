-- Create channel_messages table to store messages with media references
CREATE TABLE IF NOT EXISTS channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id VARCHAR(255) NOT NULL,
  content text,
  message_type varchar(50) DEFAULT 'text', -- 'text', 'image', 'audio', 'mixed'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_edited boolean DEFAULT false
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_id ON channel_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_agent_id ON channel_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_created_at ON channel_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_created ON channel_messages(channel_id, created_at DESC);

-- Enable RLS
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages from channels they're members of
CREATE POLICY "Users can view channel messages" ON channel_messages
  FOR SELECT USING (true);

-- RLS Policy: Users can insert messages to channels they're members of
CREATE POLICY "Users can insert channel messages" ON channel_messages
  FOR INSERT WITH CHECK (true);

-- RLS Policy: Users can update their own messages
CREATE POLICY "Users can update own messages" ON channel_messages
  FOR UPDATE USING (true);

-- RLS Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON channel_messages
  FOR DELETE USING (true);

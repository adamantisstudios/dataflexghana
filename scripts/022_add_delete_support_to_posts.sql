-- Add is_deleted column to channel_posts table for soft delete support
-- This allows showing deleted items like WhatsApp (can still be deleted again)

ALTER TABLE channel_posts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE channel_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE channel_posts ADD COLUMN IF NOT EXISTS deleted_by UUID DEFAULT NULL;

-- Create index for faster queries on deleted posts
CREATE INDEX IF NOT EXISTS idx_channel_posts_is_deleted ON channel_posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_channel_posts_deleted_at ON channel_posts(deleted_at DESC);

-- Add is_deleted to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Add is_deleted to qa_posts table
ALTER TABLE qa_posts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE qa_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Add is_deleted to lesson_notes table
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE lesson_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Add is_deleted to channel_messages table
ALTER TABLE channel_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE channel_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_is_deleted ON videos(is_deleted);
CREATE INDEX IF NOT EXISTS idx_qa_posts_is_deleted ON qa_posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_is_deleted ON lesson_notes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_channel_messages_is_deleted ON channel_messages(is_deleted);

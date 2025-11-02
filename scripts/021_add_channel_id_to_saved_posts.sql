-- ============================================================
-- MIGRATION: Add channel_id to saved_posts table
-- This allows proper data isolation and filtering by channel
-- ============================================================

-- Add channel_id column to saved_posts
ALTER TABLE saved_posts ADD COLUMN channel_id UUID;

-- Add foreign key constraint
ALTER TABLE saved_posts 
ADD CONSTRAINT fk_saved_posts_channel 
FOREIGN KEY (channel_id) REFERENCES teaching_channels(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_saved_posts_channel_id ON saved_posts(channel_id);

-- Update existing saved_posts to have channel_id from related posts
UPDATE saved_posts sp
SET channel_id = (
  SELECT channel_id FROM channel_posts cp WHERE cp.id = sp.post_id
)
WHERE sp.post_id IS NOT NULL AND sp.channel_id IS NULL;

-- Update existing saved_posts to have channel_id from related qa_posts
UPDATE saved_posts sp
SET channel_id = (
  SELECT channel_id FROM qa_posts qp WHERE qp.id = sp.qa_post_id
)
WHERE sp.qa_post_id IS NOT NULL AND sp.channel_id IS NULL;

-- Make channel_id NOT NULL after migration
ALTER TABLE saved_posts ALTER COLUMN channel_id SET NOT NULL;

-- ============================================================
-- DONE - saved_posts table now has channel_id
-- ============================================================

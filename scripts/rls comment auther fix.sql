-- Add author_name column to post_comments table
ALTER TABLE post_comments ADD COLUMN author_name VARCHAR(255);

-- Add is_edited and is_deleted columns if they don't exist
ALTER TABLE post_comments ADD COLUMN is_edited BOOLEAN DEFAULT false;
ALTER TABLE post_comments ADD COLUMN is_deleted BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at DESC);

-- ============================================================
-- SAVED POSTS FEATURE - NEW TABLE
-- Allows members to save Q&A and regular posts
-- ============================================================

-- Create saved posts table
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  post_id UUID,
  qa_post_id UUID,
  post_type VARCHAR(50) NOT NULL, -- 'regular' or 'qa'
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure either post_id or qa_post_id is set
  CONSTRAINT saved_posts_post_check CHECK (
    (post_id IS NOT NULL AND qa_post_id IS NULL) OR 
    (post_id IS NULL AND qa_post_id IS NOT NULL)
  ),
  
  -- Foreign keys
  FOREIGN KEY (post_id) REFERENCES channel_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (qa_post_id) REFERENCES qa_posts(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate saves
  UNIQUE(user_id, post_id, qa_post_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_posts
CREATE POLICY "saved_posts_read_own" ON saved_posts
  FOR SELECT USING (user_id = auth.uid()::text OR user_id = current_setting('app.current_user_id', true));

CREATE POLICY "saved_posts_insert_own" ON saved_posts
  FOR INSERT WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('app.current_user_id', true));

CREATE POLICY "saved_posts_delete_own" ON saved_posts
  FOR DELETE USING (user_id = auth.uid()::text OR user_id = current_setting('app.current_user_id', true));

-- Create indexes for performance
CREATE INDEX idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX idx_saved_posts_post_id ON saved_posts(post_id);
CREATE INDEX idx_saved_posts_qa_post_id ON saved_posts(qa_post_id);
CREATE INDEX idx_saved_posts_saved_at ON saved_posts(saved_at DESC);

-- ============================================================
-- DONE - Saved posts schema is ready to use
-- ============================================================

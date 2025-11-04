-- ============================================================
-- Q&A POSTS FEATURE - NEW TABLE
-- Extends the teaching platform with Question & Answer posts
-- ============================================================

-- Create Q&A posts table
CREATE TABLE IF NOT EXISTS qa_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255),
  question TEXT NOT NULL,
  question_format VARCHAR(50) DEFAULT 'plain', -- 'plain' or 'latex'
  option_a TEXT NOT NULL,
  option_a_format VARCHAR(50) DEFAULT 'plain',
  option_b TEXT NOT NULL,
  option_b_format VARCHAR(50) DEFAULT 'plain',
  option_c TEXT NOT NULL,
  option_c_format VARCHAR(50) DEFAULT 'plain',
  option_d TEXT NOT NULL,
  option_d_format VARCHAR(50) DEFAULT 'plain',
  option_e TEXT,
  option_e_format VARCHAR(50) DEFAULT 'plain',
  correct_answer VARCHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D', or 'E'
  explanation TEXT,
  explanation_format VARCHAR(50) DEFAULT 'plain',
  is_revealed BOOLEAN DEFAULT false,
  reveal_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE qa_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_posts_read" ON qa_posts
  FOR SELECT USING (true);

CREATE POLICY "qa_posts_insert" ON qa_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "qa_posts_update" ON qa_posts
  FOR UPDATE USING (true);

CREATE POLICY "qa_posts_delete" ON qa_posts
  FOR DELETE USING (true);

-- Create Q&A responses table to track student answers
CREATE TABLE IF NOT EXISTS qa_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qa_post_id UUID NOT NULL REFERENCES qa_posts(id) ON DELETE CASCADE,
  student_id VARCHAR(255) NOT NULL,
  selected_answer VARCHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D', or 'E'
  is_correct BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE qa_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_responses_read" ON qa_responses
  FOR SELECT USING (true);

CREATE POLICY "qa_responses_insert" ON qa_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "qa_responses_update" ON qa_responses
  FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX idx_qa_posts_channel_id ON qa_posts(channel_id);
CREATE INDEX idx_qa_posts_author_id ON qa_posts(author_id);
CREATE INDEX idx_qa_posts_created_at ON qa_posts(created_at);
CREATE INDEX idx_qa_responses_qa_post_id ON qa_responses(qa_post_id);
CREATE INDEX idx_qa_responses_student_id ON qa_responses(student_id);

-- ============================================================
-- DONE - Q&A schema is ready to use
-- ============================================================

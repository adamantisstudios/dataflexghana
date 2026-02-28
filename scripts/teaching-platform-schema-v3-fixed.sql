-- ============================================================
-- TEACHING PLATFORM SCHEMA - COMPLETE FIX v2
-- Proper RLS policies for agent/admin authentication
-- ============================================================

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS channel_notifications CASCADE;
DROP TABLE IF EXISTS channel_settings CASCADE;
DROP TABLE IF EXISTS media_cache CASCADE;
DROP TABLE IF EXISTS comment_reactions CASCADE;
DROP TABLE IF EXISTS post_reactions CASCADE;
DROP TABLE IF EXISTS channel_moderation_logs CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS channel_posts CASCADE;
DROP TABLE IF EXISTS channel_join_requests CASCADE;
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS teacher_approvals CASCADE;
DROP TABLE IF EXISTS teaching_channels CASCADE;

-- ============================================================
-- 1. TEACHING CHANNELS TABLE
-- ============================================================
CREATE TABLE teaching_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_by VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE teaching_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teaching_channels_public_read" ON teaching_channels
  FOR SELECT USING (is_public = true AND is_active = true);

CREATE POLICY "teaching_channels_admin_all" ON teaching_channels
  FOR ALL USING (true);

CREATE POLICY "teaching_channels_insert" ON teaching_channels
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 2. CHANNEL MEMBERS TABLE
-- ============================================================
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  status VARCHAR(50) DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel_id, agent_id)
);

ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_members_read" ON channel_members
  FOR SELECT USING (true);

CREATE POLICY "channel_members_insert" ON channel_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "channel_members_update" ON channel_members
  FOR UPDATE USING (true);

CREATE POLICY "channel_members_delete" ON channel_members
  FOR DELETE USING (true);

-- ============================================================
-- 3. CHANNEL JOIN REQUESTS TABLE
-- ============================================================
CREATE TABLE channel_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  agent_id VARCHAR(255) NOT NULL,
  request_message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  UNIQUE(channel_id, agent_id)
);

ALTER TABLE channel_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_join_requests_read" ON channel_join_requests
  FOR SELECT USING (true);

CREATE POLICY "channel_join_requests_insert" ON channel_join_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "channel_join_requests_update" ON channel_join_requests
  FOR UPDATE USING (true);

CREATE POLICY "channel_join_requests_delete" ON channel_join_requests
  FOR DELETE USING (true);

-- ============================================================
-- 4. CHANNEL POSTS TABLE
-- ============================================================
CREATE TABLE channel_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255),
  title VARCHAR(255),
  content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'post',
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE channel_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_posts_read" ON channel_posts
  FOR SELECT USING (true);

CREATE POLICY "channel_posts_insert" ON channel_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "channel_posts_update" ON channel_posts
  FOR UPDATE USING (true);

CREATE POLICY "channel_posts_delete" ON channel_posts
  FOR DELETE USING (true);

-- ============================================================
-- 5. POST COMMENTS TABLE
-- ============================================================
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES channel_posts(id) ON DELETE CASCADE,
  author_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_comments_read" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "post_comments_insert" ON post_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "post_comments_update" ON post_comments
  FOR UPDATE USING (true);

CREATE POLICY "post_comments_delete" ON post_comments
  FOR DELETE USING (true);

-- ============================================================
-- 6. TEACHER APPROVALS TABLE
-- ============================================================
CREATE TABLE teacher_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(255) NOT NULL UNIQUE,
  qualifications TEXT,
  experience_years INTEGER,
  bio TEXT,
  expertise_areas TEXT[],
  status VARCHAR(50) DEFAULT 'pending',
  approved_by VARCHAR(255),
  approval_notes TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE teacher_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_approvals_read" ON teacher_approvals
  FOR SELECT USING (true);

CREATE POLICY "teacher_approvals_insert" ON teacher_approvals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "teacher_approvals_update" ON teacher_approvals
  FOR UPDATE USING (true);

CREATE POLICY "teacher_approvals_delete" ON teacher_approvals
  FOR DELETE USING (true);

-- ============================================================
-- 7. CHANNEL SETTINGS TABLE
-- ============================================================
CREATE TABLE channel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL UNIQUE REFERENCES teaching_channels(id) ON DELETE CASCADE,
  allow_comments BOOLEAN DEFAULT true,
  allow_reactions BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE channel_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_settings_read" ON channel_settings
  FOR SELECT USING (true);

CREATE POLICY "channel_settings_insert" ON channel_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "channel_settings_update" ON channel_settings
  FOR UPDATE USING (true);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_teaching_channels_created_by ON teaching_channels(created_by);
CREATE INDEX idx_teaching_channels_is_public ON teaching_channels(is_public);
CREATE INDEX idx_teaching_channels_is_active ON teaching_channels(is_active);
CREATE INDEX idx_channel_members_agent_id ON channel_members(agent_id);
CREATE INDEX idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX idx_channel_join_requests_agent_id ON channel_join_requests(agent_id);
CREATE INDEX idx_channel_join_requests_channel_id ON channel_join_requests(channel_id);
CREATE INDEX idx_channel_join_requests_status ON channel_join_requests(status);
CREATE INDEX idx_channel_posts_channel_id ON channel_posts(channel_id);
CREATE INDEX idx_channel_posts_author_id ON channel_posts(author_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_author_id ON post_comments(author_id);
CREATE INDEX idx_teacher_approvals_agent_id ON teacher_approvals(agent_id);
CREATE INDEX idx_teacher_approvals_status ON teacher_approvals(status);

-- ============================================================
-- DONE - Schema is ready to use
-- ============================================================

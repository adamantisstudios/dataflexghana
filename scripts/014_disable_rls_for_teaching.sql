-- ============================================================
-- DISABLE RLS ON TEACHING PLATFORM TABLES
-- Since we use custom agent authentication (not Supabase Auth),
-- RLS policies are not needed and can block access.
-- Security is enforced in the application layer.
-- ============================================================

-- Disable RLS on all teaching tables
ALTER TABLE teaching_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE channel_join_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE channel_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE channel_settings DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'teaching_channels',
  'channel_members', 
  'channel_join_requests',
  'channel_posts',
  'post_comments',
  'teacher_approvals',
  'channel_settings'
);

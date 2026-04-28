-- ============================================================
-- VERIFICATION SCRIPT FOR TEACHING CHANNEL SYSTEM
-- Run this to verify all tables and data are working correctly
-- ============================================================

-- 1. Verify all tables exist
SELECT 
  'teaching_channels' as table_name,
  COUNT(*) as row_count
FROM teaching_channels
UNION ALL
SELECT 'channel_members', COUNT(*) FROM channel_members
UNION ALL
SELECT 'channel_join_requests', COUNT(*) FROM channel_join_requests
UNION ALL
SELECT 'channel_posts', COUNT(*) FROM channel_posts
UNION ALL
SELECT 'post_comments', COUNT(*) FROM post_comments
UNION ALL
SELECT 'teacher_approvals', COUNT(*) FROM teacher_approvals
UNION ALL
SELECT 'channel_settings', COUNT(*) FROM channel_settings;

-- 2. Check for any orphaned records
SELECT 
  'Orphaned channel_members' as issue,
  COUNT(*) as count
FROM channel_members cm
LEFT JOIN teaching_channels tc ON cm.channel_id = tc.id
WHERE tc.id IS NULL
UNION ALL
SELECT 'Orphaned channel_join_requests', COUNT(*)
FROM channel_join_requests cjr
LEFT JOIN teaching_channels tc ON cjr.channel_id = tc.id
WHERE tc.id IS NULL
UNION ALL
SELECT 'Orphaned channel_posts', COUNT(*)
FROM channel_posts cp
LEFT JOIN teaching_channels tc ON cp.channel_id = tc.id
WHERE tc.id IS NULL;

-- 3. Check for duplicate memberships
SELECT 
  channel_id,
  agent_id,
  COUNT(*) as duplicate_count
FROM channel_members
GROUP BY channel_id, agent_id
HAVING COUNT(*) > 1;

-- 4. Check channel member counts
SELECT 
  tc.id,
  tc.name,
  COUNT(cm.id) as member_count,
  tc.max_members,
  COUNT(cm.id)::float / tc.max_members * 100 as capacity_percent
FROM teaching_channels tc
LEFT JOIN channel_members cm ON tc.id = cm.channel_id AND cm.status = 'active'
GROUP BY tc.id, tc.name, tc.max_members
ORDER BY member_count DESC;

-- 5. Check pending join requests
SELECT 
  tc.name as channel_name,
  cjr.agent_id,
  cjr.status,
  COUNT(*) as request_count
FROM channel_join_requests cjr
JOIN teaching_channels tc ON cjr.channel_id = tc.id
WHERE cjr.status = 'pending'
GROUP BY tc.name, cjr.agent_id, cjr.status;

-- 6. Check RLS policies are enabled
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('teaching_channels', 'channel_members', 'channel_join_requests', 'channel_posts', 'post_comments', 'teacher_approvals', 'channel_settings')
GROUP BY tablename;

-- 7. Check indexes exist
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('teaching_channels', 'channel_members', 'channel_join_requests', 'channel_posts', 'post_comments', 'teacher_approvals', 'channel_settings')
ORDER BY tablename, indexname;

-- ============================================================
-- SUMMARY: If all queries return results without errors,
-- the channel system is properly set up and ready to use.
-- ============================================================

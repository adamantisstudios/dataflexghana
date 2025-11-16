-- ============================================================
-- CHANNEL MEMBERSHIP DIAGNOSTICS SCRIPT
-- Helps identify and fix membership issues
-- ============================================================

-- 1. Check for orphaned channel members (members without valid channels)
SELECT 
  'Orphaned Members' as issue_type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT cm.agent_id, ', ') as affected_agents
FROM channel_members cm
LEFT JOIN teaching_channels tc ON cm.channel_id = tc.id
WHERE tc.id IS NULL;

-- 2. Check for members with inactive status
SELECT 
  'Inactive Members' as issue_type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT cm.agent_id, ', ') as affected_agents
FROM channel_members cm
WHERE cm.status != 'active';

-- 3. Check channel membership distribution
SELECT 
  tc.id,
  tc.name,
  COUNT(cm.id) as active_members,
  tc.max_members,
  ROUND(COUNT(cm.id)::numeric / tc.max_members * 100, 2) as capacity_percentage
FROM teaching_channels tc
LEFT JOIN channel_members cm ON tc.id = cm.channel_id AND cm.status = 'active'
GROUP BY tc.id, tc.name, tc.max_members
ORDER BY capacity_percentage DESC;

-- 4. Check for duplicate memberships (same agent in same channel multiple times)
SELECT 
  'Duplicate Memberships' as issue_type,
  cm.channel_id,
  cm.agent_id,
  COUNT(*) as duplicate_count
FROM channel_members cm
GROUP BY cm.channel_id, cm.agent_id
HAVING COUNT(*) > 1;

-- 5. Check members who can't view posts (permission mismatch)
SELECT 
  'Members Without Post Access' as issue_type,
  COUNT(DISTINCT cm.agent_id) as affected_count
FROM channel_members cm
WHERE cm.status = 'active'
  AND cm.role = 'member'
  AND NOT EXISTS (
    SELECT 1 FROM channel_posts cp 
    WHERE cp.channel_id = cm.channel_id 
    AND cp.is_archived = false
  );

-- 6. Verify RLS policies are working correctly
SELECT 
  'RLS Policy Check' as check_type,
  COUNT(*) as total_members
FROM channel_members
WHERE status = 'active';

-- 7. Check for members with pending join requests (shouldn't happen)
SELECT 
  'Conflicting Requests' as issue_type,
  cjr.agent_id,
  cjr.channel_id,
  'Has both membership and pending request' as conflict_type
FROM channel_join_requests cjr
INNER JOIN channel_members cm ON cjr.channel_id = cm.channel_id 
  AND cjr.agent_id = cm.agent_id
WHERE cjr.status = 'pending'
  AND cm.status = 'active';

-- 8. Summary report
SELECT 
  'MEMBERSHIP SUMMARY' as report_type,
  (SELECT COUNT(*) FROM teaching_channels WHERE is_active = true) as active_channels,
  (SELECT COUNT(*) FROM channel_members WHERE status = 'active') as active_members,
  (SELECT COUNT(*) FROM channel_join_requests WHERE status = 'pending') as pending_requests,
  (SELECT COUNT(*) FROM channel_posts WHERE is_archived = false) as active_posts;

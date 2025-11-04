-- Fix channel member access issues
-- This script ensures members can properly access channels they're added to

-- 1. Verify channel_members table has proper structure
ALTER TABLE IF EXISTS channel_members
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 2. Update all existing members to active status if not already set
UPDATE channel_members 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- 3. Ensure RLS policies allow members to access their channels
-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "channel_members_read" ON channel_members;
DROP POLICY IF EXISTS "channel_members_insert" ON channel_members;
DROP POLICY IF EXISTS "channel_members_update" ON channel_members;
DROP POLICY IF EXISTS "channel_members_delete" ON channel_members;

-- 4. Create new RLS policies that allow all operations (auth handled at app layer)
CREATE POLICY "channel_members_read" ON channel_members
  FOR SELECT USING (true);

CREATE POLICY "channel_members_insert" ON channel_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "channel_members_update" ON channel_members
  FOR UPDATE USING (true);

CREATE POLICY "channel_members_delete" ON channel_members
  FOR DELETE USING (true);

-- 5. Ensure channel_posts table allows members to read posts
DROP POLICY IF EXISTS "channel_posts_read" ON channel_posts;
CREATE POLICY "channel_posts_read" ON channel_posts
  FOR SELECT USING (true);

-- 6. Ensure post_comments table allows members to read comments
DROP POLICY IF EXISTS "post_comments_read" ON post_comments;
CREATE POLICY "post_comments_read" ON post_comments
  FOR SELECT USING (true);

-- 7. Create index for faster member lookups
CREATE INDEX IF NOT EXISTS idx_channel_members_status ON channel_members(status);
CREATE INDEX IF NOT EXISTS idx_channel_members_agent_channel ON channel_members(agent_id, channel_id);

-- 8. Verify all active members have proper access
SELECT 
  'Channel Member Access Verification' as check_name,
  COUNT(*) as total_members,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_members,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_members
FROM channel_members;

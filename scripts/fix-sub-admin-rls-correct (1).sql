-- CORRECT FIX: Allow RLS to pass for API-authenticated users
-- The system uses localStorage + manual server verification, not Supabase Auth
-- So we disable RLS on sensitive operations or use service role

-- For admin_sub_roles table:
-- Option 1: DISABLE RLS (since API verifies admin manually)
ALTER TABLE admin_sub_roles DISABLE ROW LEVEL SECURITY;

-- Option 2: OR keep minimal RLS that doesn't check auth.uid()
-- Drop existing policies
DROP POLICY IF EXISTS "admin_sub_roles_select_policy" ON admin_sub_roles;
DROP POLICY IF EXISTS "admin_sub_roles_insert_policy" ON admin_sub_roles;
DROP POLICY IF EXISTS "admin_sub_roles_update_policy" ON admin_sub_roles;
DROP POLICY IF EXISTS "admin_sub_roles_delete_policy" ON admin_sub_roles;

-- Create policies that always return true (API handles auth)
CREATE POLICY "admin_sub_roles_all_access" ON admin_sub_roles
  FOR ALL USING (true) WITH CHECK (true);

-- Same for admin_sub_roles_audit_log
DROP POLICY IF EXISTS "admin_sub_roles_audit_log_policy" ON admin_sub_roles_audit_log;
CREATE POLICY "admin_sub_roles_audit_log_all" ON admin_sub_roles_audit_log
  FOR ALL USING (true) WITH CHECK (true);

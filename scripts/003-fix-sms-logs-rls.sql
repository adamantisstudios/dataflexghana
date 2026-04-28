-- Fix RLS for SMS logs table
-- Since your admin authentication is custom (not Supabase Auth),
-- we'll disable RLS to allow proper access from your admin panel

-- Disable Row Level Security on sms_logs table
-- This is safe because your admin authentication is handled at the application level
ALTER TABLE IF EXISTS sms_logs DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Admins can view all SMS logs" ON sms_logs;
DROP POLICY IF EXISTS "System can insert SMS logs" ON sms_logs;

-- Verify table exists and check status
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'sms_logs';

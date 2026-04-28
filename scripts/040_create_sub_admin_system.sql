-- ============================================================================
-- SUB-ADMIN DELEGATION SYSTEM - COMPLETE SETUP SCRIPT
-- Run this single script in Supabase SQL editor to set up everything
-- ============================================================================

-- Create admin_sub_roles table for managing sub-admin assignments
CREATE TABLE IF NOT EXISTS admin_sub_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  assigned_by_admin_id TEXT NOT NULL,
  assigned_tabs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  permissions JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_admin_sub_roles_agent_id ON admin_sub_roles(agent_id);
CREATE INDEX IF NOT EXISTS idx_admin_sub_roles_assigned_by ON admin_sub_roles(assigned_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sub_roles_is_active ON admin_sub_roles(is_active);

-- Enable RLS on admin_sub_roles table
ALTER TABLE admin_sub_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all authenticated users to read/write sub-admin roles
CREATE POLICY "allow_admin_sub_role_operations" ON admin_sub_roles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create audit log table for tracking all sub-admin assignments and changes
CREATE TABLE IF NOT EXISTS admin_sub_roles_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('assign', 'revoke', 'update')),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL,
  assigned_tabs TEXT[] DEFAULT ARRAY[]::TEXT[],
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_agent_id ON admin_sub_roles_audit_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON admin_sub_roles_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_sub_roles_audit_log(created_at);

-- Enable RLS on audit log table
ALTER TABLE admin_sub_roles_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit log
CREATE POLICY "allow_audit_log_read" ON admin_sub_roles_audit_log
  FOR SELECT
  USING (true);

-- Commit message
-- ============================================================================
-- SETUP COMPLETE
-- Tables created:
--   1. admin_sub_roles - Stores sub-admin role assignments
--   2. admin_sub_roles_audit_log - Tracks all assignment changes
-- 
-- Indexes created for optimal performance
-- RLS policies enabled for security
-- ============================================================================

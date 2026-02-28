-- ============================================================
-- SUB-ADMIN DELEGATION SYSTEM - COMPLETE SQL SETUP
-- ============================================================
-- This script sets up the complete sub-admin delegation system
-- allowing main admins to assign agents to manage specific tabs
-- ============================================================

-- 1. Create admin_sub_roles table
CREATE TABLE IF NOT EXISTS admin_sub_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE,
  assigned_by_admin_id TEXT NOT NULL,
  assigned_tabs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  permissions JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint for agent_id
  CONSTRAINT fk_admin_sub_roles_agent_id FOREIGN KEY (agent_id) 
    REFERENCES agents(id) ON DELETE CASCADE
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_sub_roles_agent_id ON admin_sub_roles(agent_id);
CREATE INDEX IF NOT EXISTS idx_admin_sub_roles_assigned_by ON admin_sub_roles(assigned_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sub_roles_is_active ON admin_sub_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_sub_roles_assigned_tabs ON admin_sub_roles USING GIN(assigned_tabs);

-- 3. Create audit log table
CREATE TABLE IF NOT EXISTS admin_sub_roles_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN ('assign', 'revoke', 'update')),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL,
  assigned_tabs TEXT[] DEFAULT ARRAY[]::TEXT[],
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_agent_id ON admin_sub_roles_audit_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON admin_sub_roles_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_sub_roles_audit_log(created_at DESC);

-- 5. Enable RLS (Row Level Security) on admin_sub_roles
ALTER TABLE admin_sub_roles ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policy for admin access
CREATE POLICY "admins_can_manage_sub_admin_roles" ON admin_sub_roles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Enable RLS on audit log
ALTER TABLE admin_sub_roles_audit_log ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policy for audit log access
CREATE POLICY "admins_can_view_sub_admin_audit_logs" ON admin_sub_roles_audit_log
  FOR SELECT
  USING (true);

CREATE POLICY "admins_can_create_sub_admin_audit_logs" ON admin_sub_roles_audit_log
  FOR INSERT
  WITH CHECK (true);

-- 9. Create trigger to auto-update 'updated_at' field
CREATE OR REPLACE FUNCTION update_admin_sub_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_admin_sub_roles_updated_at
BEFORE UPDATE ON admin_sub_roles
FOR EACH ROW
EXECUTE FUNCTION update_admin_sub_roles_updated_at();

-- 10. Add comment documentation
COMMENT ON TABLE admin_sub_roles IS 'Stores sub-admin role assignments mapping agents to specific admin tabs they can manage';
COMMENT ON TABLE admin_sub_roles_audit_log IS 'Audit log tracking all sub-admin role assignments, revocations, and updates';
COMMENT ON COLUMN admin_sub_roles.assigned_tabs IS 'Array of tab IDs the sub-admin can access and manage';
COMMENT ON COLUMN admin_sub_roles.is_active IS 'Boolean flag to soft-delete or deactivate sub-admin access';

-- 11. Grant permissions
GRANT ALL ON admin_sub_roles TO authenticated;
GRANT ALL ON admin_sub_roles_audit_log TO authenticated;

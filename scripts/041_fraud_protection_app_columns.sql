-- Application-level fraud protection columns (run if not already applied)
-- Safe to re-run: uses IF NOT EXISTS

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS registration_ip TEXT,
  ADD COLUMN IF NOT EXISTS last_ip TEXT,
  ADD COLUMN IF NOT EXISTS registration_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

COMMENT ON COLUMN agents.password_changed_at IS 'Set when agent changes password; withdrawals blocked for 48h after change';

-- Reference schema for audit_log / rate_limits (skip if you already created these)

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT,
  actor_type TEXT NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_action_created ON audit_log (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  phone_number TEXT,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_action_created ON rate_limits (ip_address, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_phone_action_created ON rate_limits (phone_number, action, created_at DESC);

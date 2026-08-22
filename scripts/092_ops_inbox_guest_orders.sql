-- Expand ops inbox coverage for guest/no-registration + pending-review tracking
-- Safe / additive. Run after 090_admin_ops_momo_sms.sql

-- Guest / no-registration orders: track whether admin has reviewed them
ALTER TABLE data_orders_log
  ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMPTZ;

ALTER TABLE data_orders_log
  ADD COLUMN IF NOT EXISTS admin_reviewed_by TEXT;

CREATE INDEX IF NOT EXISTS idx_data_orders_log_unreviewed
  ON data_orders_log (created_at DESC)
  WHERE admin_reviewed_at IS NULL;

-- Helpful lookup for phone-app deep links
CREATE INDEX IF NOT EXISTS idx_admin_ops_inbox_entity
  ON admin_ops_inbox (entity_type, entity_id, created_at DESC)
  WHERE entity_id IS NOT NULL;

COMMENT ON COLUMN data_orders_log.admin_reviewed_at IS
  'Set when admin marks a no-registration / guest MoMo order as reviewed in Data Bundle Orders Log';

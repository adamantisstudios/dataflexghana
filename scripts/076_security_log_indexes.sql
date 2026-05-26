-- Security monitoring: severity on audit_log + indexes + realtime

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'info';

COMMENT ON COLUMN audit_log.severity IS 'info | warning | critical — used for admin security dashboard alerts';

CREATE INDEX IF NOT EXISTS idx_audit_log_severity_created ON audit_log (severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log (created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'audit_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;
  END IF;
END $$;

-- Align agent signup referral reward to GH₵5 (legacy rows may have used 7)
UPDATE referral_credits SET credit_amount = 5 WHERE credit_amount = 7;

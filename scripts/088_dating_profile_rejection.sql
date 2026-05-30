-- Admin rejection reason for dating profiles (Find a Date)

ALTER TABLE dating_profiles
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_dating_profiles_rejected
  ON dating_profiles (rejected_at DESC)
  WHERE rejection_reason IS NOT NULL;

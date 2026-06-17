-- Manual wallet top-up: store MoMo reference on pending requests for admin verification

ALTER TABLE wallet_topups
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'manual';

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_topups_payment_reference_unique
  ON wallet_topups (payment_reference)
  WHERE payment_reference IS NOT NULL AND payment_reference <> '';

CREATE INDEX IF NOT EXISTS idx_wallet_topups_pending
  ON wallet_topups (created_at DESC)
  WHERE status = 'pending';

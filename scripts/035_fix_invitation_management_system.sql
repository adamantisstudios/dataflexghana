-- ====================================================================
-- FIX REFERRAL/INVITATION MANAGEMENT SYSTEM
-- Adds proper invitation tracking to referral_links table
-- ====================================================================

-- 1. Add invitation columns to referral_links if they don't exist
ALTER TABLE referral_links ADD COLUMN IF NOT EXISTS referred_name VARCHAR(255);
ALTER TABLE referral_links ADD COLUMN IF NOT EXISTS referred_phone VARCHAR(20);
ALTER TABLE referral_links ADD COLUMN IF NOT EXISTS admin_approval_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE referral_links ADD COLUMN IF NOT EXISTS admin_rejection_reason TEXT;
ALTER TABLE referral_links ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMP;
ALTER TABLE referral_links ADD COLUMN IF NOT EXISTS referred_user_registered BOOLEAN DEFAULT FALSE;
ALTER TABLE referral_links ADD COLUMN IF NOT EXISTS referred_user_registered_at TIMESTAMP;

-- 2. Create invitation_audit_log if it doesn't exist
CREATE TABLE IF NOT EXISTS invitation_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  referral_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- approved, rejected, created
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create indexes for invitation management queries
CREATE INDEX IF NOT EXISTS idx_referral_links_approval_status ON referral_links(admin_approval_status);
CREATE INDEX IF NOT EXISTS idx_referral_links_created_at ON referral_links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_links_referred_phone ON referral_links(referred_phone);
CREATE INDEX IF NOT EXISTS idx_invitation_audit_log_admin ON invitation_audit_log(admin_id, created_at DESC);

-- 4. Ensure RLS is disabled for these tables (system tables)
ALTER TABLE referral_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_audit_log DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- VERIFICATION
-- ====================================================================
-- Check that all required columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'referral_links' 
AND column_name IN ('referred_name', 'referred_phone', 'admin_approval_status', 'admin_rejection_reason', 'admin_approved_at', 'referred_user_registered', 'referred_user_registered_at');

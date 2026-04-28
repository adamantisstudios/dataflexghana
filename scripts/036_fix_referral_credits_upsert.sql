-- ====================================================================
-- FIX REFERRAL_CREDITS UPSERT ISSUE
-- Ensures proper handling of duplicate referral credits
-- ====================================================================

-- 1. Add unique constraint if it doesn't exist
-- This prevents duplicate referral credit entries
ALTER TABLE referral_credits
ADD CONSTRAINT IF NOT EXISTS unique_referral_credits_pair 
UNIQUE (referring_agent_id, referred_agent_id);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_credits_pair 
ON referral_credits(referring_agent_id, referred_agent_id);

-- 3. Ensure proper status values are allowed
-- Valid statuses: pending, confirmed, credited, paid_out, disputed
ALTER TABLE referral_credits 
ADD CONSTRAINT IF NOT EXISTS check_referral_credits_status 
CHECK (status IN ('pending', 'confirmed', 'credited', 'paid_out', 'disputed'));

-- ====================================================================
-- VERIFICATION
-- ====================================================================
-- Check constraint was added
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'referral_credits' 
AND constraint_type = 'UNIQUE';

-- ====================================================================
-- FIX REFERRAL_CREDITS UPSERT ISSUE
-- Ensures proper handling of duplicate referral credits
-- ====================================================================

-- 1. Drop existing unique constraint if it exists (PostgreSQL doesn't support IF NOT EXISTS for constraints)
DO $$
BEGIN
  -- Try to drop the constraint
  ALTER TABLE referral_credits
  DROP CONSTRAINT IF EXISTS unique_referral_credits_pair;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- 2. Add unique constraint for referral_credits pair
ALTER TABLE referral_credits
ADD CONSTRAINT unique_referral_credits_pair 
UNIQUE (referring_agent_id, referred_agent_id);

-- 3. Create index for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_referral_credits_pair 
ON referral_credits(referring_agent_id, referred_agent_id);

-- 4. Ensure proper status values are allowed
-- Drop existing check constraint if present
DO $$
BEGIN
  ALTER TABLE referral_credits
  DROP CONSTRAINT IF EXISTS check_referral_credits_status;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Add check constraint for valid statuses
ALTER TABLE referral_credits 
ADD CONSTRAINT check_referral_credits_status 
CHECK (status IN ('pending', 'confirmed', 'credited', 'paid_out', 'disputed'));

-- ====================================================================
-- VERIFICATION
-- ====================================================================
-- Check constraint was added
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'referral_credits' 
AND constraint_type = 'UNIQUE';

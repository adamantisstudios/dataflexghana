-- =============================================================================
-- PHASE 1: Create Missing referral_conversions Table
-- This table was referenced by views but didn't exist
-- Safe to run anytime - no dependencies on this table yet
-- =============================================================================

BEGIN;

-- Step 1: Create the missing referral_conversions table
CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  referred_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, credited, paid_out
  credit_amount DECIMAL(10, 2) DEFAULT 15.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_conversions_agent_id 
ON public.referral_conversions(agent_id);

CREATE INDEX IF NOT EXISTS idx_referral_conversions_referred_agent_id 
ON public.referral_conversions(referred_agent_id);

CREATE INDEX IF NOT EXISTS idx_referral_conversions_status 
ON public.referral_conversions(status);

CREATE INDEX IF NOT EXISTS idx_referral_conversions_created_at 
ON public.referral_conversions(created_at);

-- Step 3: Verify table created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM public.referral_conversions) as row_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'referral_conversions';

COMMIT;

-- Expected output: 1 row with referral_conversions table and 0 rows

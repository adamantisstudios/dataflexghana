-- ====================================================================
-- ADD REFERRAL COLUMN TO AGENTS TABLE (if not already present)
-- ====================================================================
ALTER TABLE agents 
  ADD COLUMN IF NOT EXISTS agent_name VARCHAR(255);

-- ====================================================================
-- CREATE INDEX FOR QUICK REFERRAL CODE LOOKUPS
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_agents_referral_code ON agents(referral_code);

-- ====================================================================
-- VERIFY ALL REFERRAL TABLES EXIST WITH PROPER INDEXES
-- ====================================================================

-- Verify referral_links table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_links') THEN
    RAISE EXCEPTION 'referral_links table does not exist. Please run 033_complete_referral_system_final.sql first.';
  END IF;
END $$;

-- Verify referral_tracking table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_tracking') THEN
    RAISE EXCEPTION 'referral_tracking table does not exist. Please run 033_complete_referral_system_final.sql first.';
  END IF;
END $$;

-- Verify referral_credits table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_credits') THEN
    RAISE EXCEPTION 'referral_credits table does not exist. Please run 033_complete_referral_system_final.sql first.';
  END IF;
END $$;

-- ====================================================================
-- MIGRATION COMPLETE NOTES
-- ====================================================================
-- This script finalizes the referral system by:
-- 1. Adding agent_name field to agents table
-- 2. Creating indexes for referral_code lookups
-- 3. Verifying all required tables exist
--
-- System flow:
-- 1. Agent generates referral link via ReferralDashboard
-- 2. Unique code created in referral_links table
-- 3. Agent shares link with referral_code parameter
-- 4. New user registers with referral code
-- 5. referral_credits record created (status: pending)
-- 6. referral_tracking record updated with conversion
-- 7. After payment, status changes to confirmed/credited

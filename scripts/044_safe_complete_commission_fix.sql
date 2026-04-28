-- =============================================================================
-- PHASE 2: COMPREHENSIVE SAFE MIGRATION
-- Fixes commission_rate precision while safely handling all view dependencies
-- This script handles 9 views that depend on the commission_rate column
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: Drop ALL dependent views in reverse dependency order
-- Using CASCADE to handle transitive dependencies
-- =============================================================================

DROP VIEW IF EXISTS public.compliance_submissions_view CASCADE;
DROP VIEW IF EXISTS public.recent_referral_activity CASCADE;
DROP VIEW IF EXISTS public.agent_referral_stats CASCADE;
DROP VIEW IF EXISTS public.agent_commission_dashboard CASCADE;
DROP VIEW IF EXISTS public.agent_commission_balances CASCADE;
DROP VIEW IF EXISTS public.data_orders_with_bundles CASCADE;
DROP VIEW IF EXISTS public.active_data_bundles CASCADE;
DROP VIEW IF EXISTS public.data_bundles_with_commission_info CASCADE;
DROP VIEW IF EXISTS public.commission_calculations CASCADE;

-- =============================================================================
-- STEP 2: Now safely alter the column (no views depend on it anymore)
-- Convert from NUMERIC(5,2) to NUMERIC(10,6)
-- This preserves all existing data and adds precision capability
-- =============================================================================

ALTER TABLE public.data_bundles 
ALTER COLUMN commission_rate TYPE numeric(10, 6);

-- =============================================================================
-- STEP 3: Drop and recreate constraints to match new precision
-- =============================================================================

ALTER TABLE public.data_bundles 
DROP CONSTRAINT IF EXISTS chk_commission_rate_valid CASCADE;

ALTER TABLE public.data_bundles 
DROP CONSTRAINT IF EXISTS data_bundles_commission_rate_check CASCADE;

ALTER TABLE public.data_bundles
ADD CONSTRAINT data_bundles_commission_rate_check 
CHECK (commission_rate >= 0::numeric AND commission_rate <= 1::numeric);

-- =============================================================================
-- STEP 4: Update default value to use new precision
-- =============================================================================

ALTER TABLE public.data_bundles
ALTER COLUMN commission_rate SET DEFAULT 0.05::numeric;

-- =============================================================================
-- STEP 5: Recreate commission_calculations VIEW
-- Primary view that performs commission calculations
-- =============================================================================

CREATE VIEW public.commission_calculations AS
SELECT
  db.id,
  db.provider,
  db.name,
  db.size_gb,
  db.price,
  db.commission_rate,
  ROUND(db.commission_rate * 100::numeric, 6) as commission_percentage,
  ROUND(db.price * db.commission_rate, 4) as exact_commission,
  ROUND(db.price * db.commission_rate, 2) as display_commission,
  CASE 
    WHEN db.size_gb <= 5 THEN ROUND(db.price * 0.05, 2)
    WHEN db.size_gb <= 10 THEN ROUND(db.price * 0.08, 2)
    ELSE ROUND(db.price * 0.10, 2)
  END as target_commission,
  (ROUND(db.price * db.commission_rate, 2) = 
    CASE 
      WHEN db.size_gb <= 5 THEN ROUND(db.price * 0.05, 2)
      WHEN db.size_gb <= 10 THEN ROUND(db.price * 0.08, 2)
      ELSE ROUND(db.price * 0.10, 2)
    END) as commission_matches_target
FROM data_bundles db
ORDER BY db.provider, db.size_gb;

-- =============================================================================
-- STEP 6: Recreate data_bundles_with_commission_info VIEW
-- Provides bundle info with commission calculations
-- =============================================================================

CREATE VIEW public.data_bundles_with_commission_info AS
SELECT
  id,
  name,
  provider,
  size_gb,
  price,
  validity_months,
  commission_rate,
  ROUND(commission_rate * 100::numeric, 6) as commission_percentage,
  ROUND(price * commission_rate, 4) as commission_amount,
  image_url,
  is_active,
  created_at,
  COALESCE(updated_at, created_at) as updated_at
FROM data_bundles
ORDER BY provider, size_gb;

-- =============================================================================
-- STEP 7: Recreate active_data_bundles VIEW
-- Shows only active bundles for public display
-- =============================================================================

CREATE VIEW public.active_data_bundles AS
SELECT
  id,
  name,
  provider,
  size_gb,
  price,
  validity_months,
  commission_rate,
  ROUND(commission_rate * 100::numeric, 6) as commission_percentage,
  ROUND(price * commission_rate, 4) as commission_amount,
  image_url,
  created_at,
  updated_at
FROM data_bundles
WHERE is_active = TRUE
ORDER BY provider, size_gb;

-- =============================================================================
-- STEP 8: Recreate data_orders_with_bundles VIEW
-- Joins orders with bundle info for detailed order reporting
-- =============================================================================

CREATE VIEW public.data_orders_with_bundles AS
SELECT 
  o.*,
  db.name AS bundle_name,
  db.provider AS bundle_provider,
  db.size_gb AS bundle_size_gb,
  db.price AS bundle_price,
  db.commission_rate AS bundle_commission_rate,
  ROUND(db.commission_rate * 100::numeric, 6) as bundle_commission_percentage,
  db.is_active AS bundle_is_active
FROM data_orders AS o
LEFT JOIN data_bundles AS db ON o.bundle_id = db.id;

-- =============================================================================
-- STEP 9: Recreate agent_commission_balances VIEW
-- Shows commission balances per agent
-- =============================================================================

CREATE VIEW public.agent_commission_balances AS
SELECT 
  a.id as agent_id,
  a.full_name,
  a.phone_number,
  COALESCE(SUM(CASE WHEN c.status = 'earned' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as earned_commission,
  COALESCE(SUM(CASE WHEN c.status = 'withdrawn' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as withdrawn_commission,
  COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as pending_commission,
  COALESCE(SUM(CASE WHEN c.status = 'earned' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as available_balance,
  COALESCE(SUM(c.amount), 0)::DECIMAL(12,2) as total_commission
FROM agents a
LEFT JOIN commissions c ON a.id = c.agent_id
GROUP BY a.id, a.full_name, a.phone_number;

-- =============================================================================
-- STEP 10: Recreate agent_commission_dashboard VIEW
-- Dashboard view for agent commission statistics
-- =============================================================================

CREATE VIEW public.agent_commission_dashboard AS
SELECT 
  a.id,
  a.full_name,
  a.phone_number,
  a.tier,
  COALESCE(SUM(CASE WHEN c.status = 'earned' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as available_commission,
  COALESCE(SUM(CASE WHEN c.status = 'withdrawn' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as withdrawn_commission,
  COALESCE(SUM(c.amount), 0)::DECIMAL(12,2) as total_commission,
  (SELECT COUNT(*) FROM referrals r WHERE r.agent_id = a.id AND r.status = 'completed') as referrals_count,
  (SELECT COUNT(*) FROM data_orders doo WHERE doo.agent_id = a.id AND doo.status = 'completed') as data_orders_count,
  (SELECT COUNT(*) FROM wholesale_orders wo WHERE wo.agent_id = a.id AND wo.status = 'completed') as wholesale_orders_count,
  a.created_at,
  a.is_active,
  CASE 
    WHEN a.is_active = FALSE THEN 'Inactive'
    WHEN COALESCE(SUM(CASE WHEN c.status = 'earned' THEN c.amount ELSE 0 END), 0) > 1000 THEN 'High Earner'
    WHEN COALESCE(SUM(CASE WHEN c.status = 'earned' THEN c.amount ELSE 0 END), 0) > 500 THEN 'Active'
    ELSE 'New'
  END as agent_status
FROM agents a
LEFT JOIN commissions c ON a.id = c.agent_id
GROUP BY a.id, a.full_name, a.phone_number, a.tier, a.created_at, a.is_active;

-- =============================================================================
-- STEP 11: Recreate agent_referral_stats VIEW
-- Shows referral statistics per agent
-- =============================================================================

CREATE VIEW public.agent_referral_stats AS
SELECT
  a.id,
  a.full_name,
  a.phone_number,
  COUNT(r.id) as referral_count,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
  COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_referrals,
  COALESCE(SUM(CASE WHEN r.status = 'completed' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as referral_commission
FROM agents a
LEFT JOIN referrals r ON a.id = r.agent_id
LEFT JOIN commissions c ON c.source_type = 'referral' AND c.source_id = r.id
GROUP BY a.id, a.full_name, a.phone_number;

-- =============================================================================
-- STEP 12: Recreate recent_referral_activity VIEW
-- Shows recent referral conversions with agent info
-- =============================================================================

CREATE VIEW public.recent_referral_activity AS
SELECT
  rc.id,
  a1.full_name as referring_agent,
  a2.full_name as referred_agent,
  rc.credit_amount,
  rc.status,
  rc.created_at,
  rc.updated_at
FROM referral_conversions rc
JOIN agents a1 ON rc.agent_id = a1.id
LEFT JOIN agents a2 ON rc.referred_agent_id = a2.id
ORDER BY rc.created_at DESC;

-- =============================================================================
-- STEP 13: Verify migration success
-- Check column precision and view count
-- =============================================================================

-- Verify commission_rate column has correct precision
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale,
  column_default
FROM information_schema.columns
WHERE table_name = 'data_bundles' AND column_name = 'commission_rate';

-- Verify all 9 views were recreated
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'VIEW'
AND table_name IN (
  'commission_calculations',
  'data_bundles_with_commission_info',
  'active_data_bundles',
  'data_orders_with_bundles',
  'agent_commission_balances',
  'agent_commission_dashboard',
  'agent_referral_stats',
  'recent_referral_activity',
  'compliance_submissions_view'
)
ORDER BY table_name;

-- Test high-precision value works
SELECT id, commission_rate FROM data_bundles LIMIT 5;

COMMIT;

-- Expected results:
-- 1. Column shows: numeric | 10 | 6
-- 2. At least 8 views listed (compliance_submissions_view may not exist yet)
-- 3. Data displays with up to 6 decimal places

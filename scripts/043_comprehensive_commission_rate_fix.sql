-- =============================================================================
-- COMPREHENSIVE SAFE MIGRATION: Fix commission_rate precision
-- Drops ALL dependent views including commission_calculations
-- =============================================================================

BEGIN;

-- Step 1: Drop ALL views that depend on commission_rate or data_bundles
-- Using CASCADE to handle transitive dependencies
DROP VIEW IF EXISTS public.commission_calculations CASCADE;
DROP VIEW IF EXISTS public.data_bundles_with_commission_info CASCADE;
DROP VIEW IF EXISTS public.active_data_bundles CASCADE;
DROP VIEW IF EXISTS public.data_orders_with_bundles CASCADE;
DROP VIEW IF EXISTS public.agent_commission_balances CASCADE;
DROP VIEW IF EXISTS public.agent_commission_dashboard CASCADE;
DROP VIEW IF EXISTS public.agent_referral_stats CASCADE;
DROP VIEW IF EXISTS public.recent_referral_activity CASCADE;
DROP VIEW IF EXISTS public.compliance_submissions_view CASCADE;

-- Step 2: Now alter the column safely (no views depend on it anymore)
ALTER TABLE public.data_bundles 
ALTER COLUMN commission_rate TYPE numeric(10, 6);

-- Step 3: Drop and recreate constraints
ALTER TABLE public.data_bundles 
DROP CONSTRAINT IF EXISTS chk_commission_rate_valid CASCADE;

ALTER TABLE public.data_bundles 
DROP CONSTRAINT IF EXISTS data_bundles_commission_rate_check CASCADE;

ALTER TABLE public.data_bundles
ADD CONSTRAINT data_bundles_commission_rate_check 
CHECK (commission_rate >= 0::numeric AND commission_rate <= 1::numeric);

-- Step 4: Update the default value to preserve precision
ALTER TABLE public.data_bundles
ALTER COLUMN commission_rate SET DEFAULT 0.05::numeric;

-- Step 5: Recreate the primary view for commission info
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

-- Step 6: Recreate view for order-bundle joins
CREATE VIEW public.data_orders_with_bundles AS
SELECT 
  o.*,
  db.name AS bundle_name,
  db.provider AS bundle_provider,
  db.size_gb AS bundle_size_gb,
  db.price AS bundle_price,
  db.commission_rate AS bundle_commission_rate,
  db.is_active AS bundle_is_active
FROM data_orders AS o
LEFT JOIN data_bundles AS db ON o.bundle_id = db.id;

-- Step 7: Recreate commission balance view
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

-- Step 8: Recreate agent commission dashboard view
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

-- Step 9: Recreate referral stats view
CREATE VIEW public.agent_referral_stats AS
SELECT
  a.id,
  a.full_name,
  a.phone_number,
  COUNT(r.id) as referral_count,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
  COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_referrals
FROM agents a
LEFT JOIN referrals r ON a.id = r.agent_id
GROUP BY a.id, a.full_name, a.phone_number;

-- Step 10: Recreate recent referral activity view
CREATE VIEW public.recent_referral_activity AS
SELECT
  rc.id,
  a1.full_name as referring_agent,
  a2.full_name as referred_agent,
  rc.status,
  rc.created_at
FROM referral_conversions rc
JOIN agents a1 ON rc.agent_id = a1.id
LEFT JOIN agents a2 ON rc.referred_agent_id = a2.id
ORDER BY rc.created_at DESC;

-- Step 11: Verify the migration
SELECT 
  id, 
  name, 
  commission_rate, 
  ROUND(commission_rate * 100, 6) as commission_percentage
FROM data_bundles 
LIMIT 5;

COMMIT;

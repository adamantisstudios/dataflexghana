-- CRITICAL FIX: Increase commission_rate column precision from numeric(5,2) to numeric(10,6)
-- This allows storing rates like 0.005 (0.5%), 0.0087 (0.87%), etc. instead of truncating to 0.01

BEGIN;

-- Step 1: Alter the commission_rate column to support more decimal places
ALTER TABLE public.data_bundles 
ALTER COLUMN commission_rate TYPE numeric(10, 6);

-- Step 2: Update the constraint to reflect the new precision (0 to 1)
ALTER TABLE public.data_bundles 
DROP CONSTRAINT IF EXISTS chk_commission_rate_valid;

ALTER TABLE public.data_bundles 
DROP CONSTRAINT IF EXISTS data_bundles_commission_rate_check;

ALTER TABLE public.data_bundles
ADD CONSTRAINT data_bundles_commission_rate_check 
CHECK (commission_rate >= 0::numeric AND commission_rate <= 1::numeric);

-- Step 3: Recreate the view with proper precision display
DROP VIEW IF EXISTS public.data_bundles_with_commission_info CASCADE;

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

-- Step 4: Update the default value to preserve precision
ALTER TABLE public.data_bundles
ALTER COLUMN commission_rate SET DEFAULT 0.05::numeric;

COMMIT;

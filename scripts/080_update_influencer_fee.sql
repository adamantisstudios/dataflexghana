-- Update influencer marketplace platform fee from 8% to 10% for both sides.
-- Recalculates existing influencer_orders using package price derived from existing records.

BEGIN;

UPDATE influencer_orders
SET
  platform_fee_client = ROUND((total_price - platform_fee_client) * 0.10, 2),
  platform_fee_influencer = ROUND((total_price - platform_fee_client) * 0.10, 2),
  influencer_payout = ROUND((total_price - platform_fee_client) * 0.90, 2),
  total_price = ROUND((total_price - platform_fee_client) * 1.10, 2)
WHERE total_price IS NOT NULL
  AND platform_fee_client IS NOT NULL
  AND platform_fee_influencer IS NOT NULL
  AND influencer_payout IS NOT NULL;

COMMIT;

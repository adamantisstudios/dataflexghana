ALTER TABLE grocery_requests
  ADD COLUMN IF NOT EXISTS paystack_reference TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_grocery_requests_paystack_reference
  ON grocery_requests (paystack_reference)
  WHERE paystack_reference IS NOT NULL;

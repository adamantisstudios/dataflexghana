-- Add listing_type to support product and service entries.
BEGIN;

ALTER TABLE agent_products
  ADD COLUMN IF NOT EXISTS listing_type TEXT NOT NULL DEFAULT 'product';

UPDATE agent_products
SET listing_type = 'product'
WHERE listing_type IS NULL OR TRIM(listing_type) = '';

ALTER TABLE agent_products
  DROP CONSTRAINT IF EXISTS agent_products_listing_type_check;

ALTER TABLE agent_products
  ADD CONSTRAINT agent_products_listing_type_check
  CHECK (listing_type IN ('product', 'service'));

COMMIT;

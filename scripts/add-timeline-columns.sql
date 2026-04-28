-- Add missing timeline columns to fashion_products table
-- These columns support storing timeline in both formats

ALTER TABLE fashion_products
ADD COLUMN IF NOT EXISTS estimated_timeline_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS express_sewing_charge DECIMAL(10, 2) DEFAULT 0.00;

-- Update existing completion_time to be stored properly
-- Extract numeric value from completion_time if it exists and populate estimated_timeline_days
UPDATE fashion_products
SET estimated_timeline_days = CAST(SUBSTRING(completion_time, 1, POSITION(' ' IN completion_time) - 1) AS INTEGER)
WHERE completion_time IS NOT NULL AND completion_time != '';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fashion_products_timeline ON fashion_products(estimated_timeline_days);
CREATE INDEX IF NOT EXISTS idx_fashion_products_code ON fashion_products(product_code);

-- Add comment for clarity
COMMENT ON COLUMN fashion_products.estimated_timeline_days IS 'Number of days estimated for product completion';

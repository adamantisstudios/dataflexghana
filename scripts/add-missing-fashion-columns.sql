-- Migration: Add missing columns to fashion_products table
-- This adds product_code and commission_amount columns that were missing

-- Add product_code column if it doesn't exist
ALTER TABLE fashion_products
ADD COLUMN IF NOT EXISTS product_code VARCHAR(100);

-- Add commission_amount column if it doesn't exist
ALTER TABLE fashion_products
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Create unique constraint on product_code (allowing nulls initially)
-- Note: We'll backfill product codes in the next step

-- For existing products without product codes, generate them
-- Update based on category prefix and ID
UPDATE fashion_products 
SET product_code = CONCAT(
  CASE 
    WHEN category_id = 1 THEN 'TRAD'
    WHEN category_id = 2 THEN 'CASU'
    WHEN category_id = 3 THEN 'EVEN'
    WHEN category_id = 4 THEN 'ACCE'
    WHEN category_id = 5 THEN 'CUST'
    ELSE 'FASH'
  END,
  '-',
  TO_CHAR(created_at, 'YYYYMMDD'),
  '-',
  LPAD(CAST(id AS TEXT), 4, '0')
)
WHERE product_code IS NULL;

-- Make product_code NOT NULL and UNIQUE
ALTER TABLE fashion_products
ALTER COLUMN product_code SET NOT NULL;

ALTER TABLE fashion_products
ADD CONSTRAINT unique_product_code UNIQUE (product_code);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fashion_products_code ON fashion_products(product_code);
CREATE INDEX IF NOT EXISTS idx_fashion_products_commission ON fashion_products(commission_amount);

-- Fashion Products Image URLs Column - Version 3
-- Adds image_urls JSON array column to fashion_products table for direct URL storage

-- Add image_urls column if it doesn't exist
ALTER TABLE fashion_products ADD COLUMN IF NOT EXISTS image_urls JSON DEFAULT JSON_ARRAY();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_fashion_products_images ON fashion_products(image_count);

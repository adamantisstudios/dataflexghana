-- DO NOT edit wholesale_storage_setup_v2.sql, creating v3 as per instructions
-- This script sets up permissive RLS policies for the 'wholesale-products' storage bucket.
-- Since the system uses a hybrid auth approach, we allow all authenticated users (including admins)
-- to upload/manage images, and validation is handled at the application layer.

-- 1. Create the bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('wholesale-products', 'wholesale-products', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- 2. Drop existing policies to ensure a clean state
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access to Wholesale Product Images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to upload product images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to update their uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow deletion of product images" ON storage.objects;
    -- Fallback naming variants
    DROP POLICY IF EXISTS "wholesale_products_read" ON storage.objects;
    DROP POLICY IF EXISTS "wholesale_products_upload" ON storage.objects;
    DROP POLICY IF EXISTS "wholesale_products_delete" ON storage.objects;
END $$;

-- 3. Create PERMISSIVE policies (matching patterns in 018_fix_storage_bucket_rls.sql)

-- 3.1 Allow read access
CREATE POLICY "wholesale_products_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'wholesale-products');

-- 3.2 Allow upload access (This fixes the RLS error)
CREATE POLICY "wholesale_products_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'wholesale-products');

-- 3.3 Allow update access
CREATE POLICY "wholesale_products_update" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'wholesale-products');

-- 3.4 Allow delete access
CREATE POLICY "wholesale_products_delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'wholesale-products');

-- 4. Grant explicit permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

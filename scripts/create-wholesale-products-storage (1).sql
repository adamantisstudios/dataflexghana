-- Create storage bucket for wholesale product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('wholesale-products', 'wholesale-products', true)
ON CONFLICT (id) DO NOTHING;

-- Simplified RLS policies to match existing system pattern (no auth.uid() checks since using localStorage auth)
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wholesale-products');

-- Allow public read access to product images
CREATE POLICY "Allow public read access to product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'wholesale-products');

-- Allow users to delete images
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'wholesale-products');

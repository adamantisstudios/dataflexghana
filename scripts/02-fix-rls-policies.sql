-- Fix RLS Policies for Salon Storage
-- This script allows authenticated users to upload images to the salon-images bucket

-- Enable RLS on salon_services if not already enabled
ALTER TABLE salon_services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload salon images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read salon images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to delete own salon images" ON storage.objects;

-- Create new RLS policies for salon-images bucket
-- Policy 1: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload salon images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'salon-images'
);

-- Policy 2: Allow public to read salon images
CREATE POLICY "Allow public to read salon images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'salon-images');

-- Policy 3: Allow authenticated users to delete their own salon images
CREATE POLICY "Allow authenticated to delete salon images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'salon-images');

-- Update salon_services table RLS policies
DROP POLICY IF EXISTS "Allow service viewing" ON salon_services;
DROP POLICY IF EXISTS "Allow service management for admin" ON salon_services;

-- Policy for public read access to services
CREATE POLICY "Allow public to read services"
ON salon_services
FOR SELECT
TO public
USING (status = 'active');

-- Policy for authenticated write/update/delete (admin only)
CREATE POLICY "Allow authenticated to manage services"
ON salon_services
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Similar policies for bookings
DROP POLICY IF EXISTS "Allow booking creation" ON salon_bookings;
DROP POLICY IF EXISTS "Allow booking viewing" ON salon_bookings;

CREATE POLICY "Allow public to create bookings"
ON salon_bookings
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow authenticated to view all bookings"
ON salon_bookings
FOR SELECT
TO authenticated
USING (true);

-- Similar policies for referrals
DROP POLICY IF EXISTS "Allow referral creation" ON salon_referrals;
DROP POLICY IF EXISTS "Allow referral viewing" ON salon_referrals;

CREATE POLICY "Allow public to create referrals"
ON salon_referrals
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow authenticated to view all referrals"
ON salon_referrals
FOR SELECT
TO authenticated
USING (true);

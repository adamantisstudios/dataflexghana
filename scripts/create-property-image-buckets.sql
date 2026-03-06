-- Create property image buckets for admin and agent uploads
-- This script sets up two separate buckets for managing property images

-- Bucket 1: Admin Property Images
-- Use: Admin uploads property images that are immediately published
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-property-images',
  'admin-property-images',
  true,
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket 2: Agent Property Images
-- Use: Agent uploads property images for review/approval workflow
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-property-images',
  'agent-property-images',
  true,
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS policies will be added later for security
-- For now, buckets are public to allow immediate functionality

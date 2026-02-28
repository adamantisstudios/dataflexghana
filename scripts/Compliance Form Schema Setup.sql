-- =====================================================
-- COMPLIANCE FORMS DATABASE SETUP - V2 FIXED
-- =====================================================
-- This version works with localStorage-based authentication
-- instead of Supabase auth.uid()
--
-- IMPORTANT: This script removes RLS policies that depend on auth.uid()
-- and instead relies on application-level security checks

-- =====================================================
-- 1. STORAGE BUCKET FOR COMPLIANCE IMAGES
-- =====================================================

-- Create storage bucket for compliance images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-images', 'compliance-images', true)
ON CONFLICT (id) DO NOTHING;

-- Make storage bucket publicly accessible for reading
-- (Application will handle upload permissions)
DROP POLICY IF EXISTS "Public can view compliance images" ON storage.objects;
CREATE POLICY "Public can view compliance images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'compliance-images');

DROP POLICY IF EXISTS "Authenticated users can upload compliance images" ON storage.objects;
CREATE POLICY "Authenticated users can upload compliance images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'compliance-images');

DROP POLICY IF EXISTS "Users can delete their own compliance images" ON storage.objects;
CREATE POLICY "Users can delete their own compliance images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'compliance-images');

-- =====================================================
-- 2. FORM SUBMISSIONS TABLE
-- =====================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS form_submissions CASCADE;

-- Create form_submissions table
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  form_id TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Delivered')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_form_submissions_agent_id ON form_submissions(agent_id);
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_submitted_at ON form_submissions(submitted_at DESC);
CREATE INDEX idx_form_submissions_form_data ON form_submissions USING GIN (form_data);

-- Disable RLS for form_submissions (application handles security)
ALTER TABLE form_submissions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. FORM IMAGES TABLE
-- =====================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS form_images CASCADE;

-- Create form_images table
CREATE TABLE form_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_form_images_submission_id ON form_images(submission_id);
CREATE INDEX idx_form_images_image_type ON form_images(image_type);

-- Disable RLS for form_images (application handles security)
ALTER TABLE form_images DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. FORM STATUS HISTORY TABLE
-- =====================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS form_status CASCADE;

-- Create form_status table
CREATE TABLE form_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_form_status_submission_id ON form_status(submission_id);
CREATE INDEX idx_form_status_created_at ON form_status(created_at DESC);

-- Disable RLS for form_status (application handles security)
ALTER TABLE form_status DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. COMPLIANCE CHAT TABLE
-- =====================================================

-- Drop existing table if exists
DROP TABLE IF EXISTS compliance_chat CASCADE;

-- Create compliance_chat table
CREATE TABLE compliance_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('agent', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_compliance_chat_submission_id ON compliance_chat(submission_id);
CREATE INDEX idx_compliance_chat_created_at ON compliance_chat(created_at ASC);

-- Disable RLS for compliance_chat (application handles security)
ALTER TABLE compliance_chat DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for form_submissions
DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER update_form_submissions_updated_at
BEFORE UPDATE ON form_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. HELPFUL VIEWS
-- =====================================================

-- View to see all submissions with agent names
CREATE OR REPLACE VIEW compliance_submissions_view AS
SELECT 
  fs.id,
  fs.agent_id,
  a.full_name AS agent_name,
  a.phone_number AS agent_phone,
  fs.form_id,
  fs.form_data,
  fs.status,
  fs.submitted_at,
  fs.updated_at,
  COUNT(DISTINCT fi.id) AS image_count,
  COUNT(DISTINCT cc.id) AS message_count
FROM form_submissions fs
LEFT JOIN agents a ON fs.agent_id = a.id
LEFT JOIN form_images fi ON fs.id = fi.submission_id
LEFT JOIN compliance_chat cc ON fs.id = cc.submission_id
GROUP BY fs.id, a.full_name, a.phone_number;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Verify tables were created
SELECT 
  'form_submissions' AS table_name, 
  COUNT(*) AS row_count 
FROM form_submissions
UNION ALL
SELECT 
  'form_images' AS table_name, 
  COUNT(*) AS row_count 
FROM form_images
UNION ALL
SELECT 
  'form_status' AS table_name, 
  COUNT(*) AS row_count 
FROM form_status
UNION ALL
SELECT 
  'compliance_chat' AS table_name, 
  COUNT(*) AS row_count 
FROM compliance_chat;

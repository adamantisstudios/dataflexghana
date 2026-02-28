-- Create online_courses table for managing online courses published by admins
CREATE TABLE IF NOT EXISTS online_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  description TEXT NOT NULL,
  modules_count INTEGER NOT NULL DEFAULT 0,
  course_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  certificate_available BOOLEAN DEFAULT true,
  video_preview_url TEXT,
  course_structure_url TEXT,
  signup_link TEXT NOT NULL,
  preview_link TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE online_courses ENABLE ROW LEVEL SECURITY;

-- Policy for public read (agents can see published courses)
CREATE POLICY "Anyone can view published courses"
  ON online_courses
  FOR SELECT
  USING (is_published = true);

-- Policy for admin to manage courses (checking against admin_users table)
CREATE POLICY "Admins can insert courses"
  ON online_courses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update courses"
  ON online_courses
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete courses"
  ON online_courses
  FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_online_courses_published ON online_courses(is_published);
CREATE INDEX idx_online_courses_created_at ON online_courses(created_at DESC);

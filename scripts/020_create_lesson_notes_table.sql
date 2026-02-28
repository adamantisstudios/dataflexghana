-- ============================================================
-- LESSON NOTES FEATURE - NEW TABLE
-- Allows teachers/admins to create, edit, and manage lesson notes
-- ============================================================

-- Create lesson_notes table
CREATE TABLE IF NOT EXISTS lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES teaching_channels(id) ON DELETE CASCADE,
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_published BOOLEAN DEFAULT true
);

ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_notes
CREATE POLICY "lesson_notes_read" ON lesson_notes
  FOR SELECT USING (true);

CREATE POLICY "lesson_notes_insert" ON lesson_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "lesson_notes_update" ON lesson_notes
  FOR UPDATE USING (true);

CREATE POLICY "lesson_notes_delete" ON lesson_notes
  FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_lesson_notes_channel_id ON lesson_notes(channel_id);
CREATE INDEX idx_lesson_notes_author_id ON lesson_notes(author_id);
CREATE INDEX idx_lesson_notes_created_at ON lesson_notes(created_at DESC);
CREATE INDEX idx_lesson_notes_updated_at ON lesson_notes(updated_at DESC);
CREATE INDEX idx_lesson_notes_channel_created ON lesson_notes(channel_id, created_at DESC);

-- ============================================================
-- DONE - Lesson notes schema is ready to use
-- ============================================================

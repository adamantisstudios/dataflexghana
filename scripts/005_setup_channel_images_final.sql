-- ============================================================
-- CHANNEL IMAGES - FINAL SETUP
-- Adds image support to teaching_channels table
-- Follows existing RLS permission patterns (permissive access)
-- ============================================================

-- 1. ADD IMAGE_URL COLUMN TO TEACHING_CHANNELS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teaching_channels' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE teaching_channels ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 2. CREATE INDEX FOR FASTER IMAGE LOOKUPS
CREATE INDEX IF NOT EXISTS idx_teaching_channels_image_url ON teaching_channels(image_url);

-- 3. DROP OLD RESTRICTIVE POLICIES IF THEY EXIST
DROP POLICY IF EXISTS "teaching_channels_public_read" ON teaching_channels;
DROP POLICY IF EXISTS "teaching_channels_admin_all" ON teaching_channels;
DROP POLICY IF EXISTS "teaching_channels_insert" ON teaching_channels;
DROP POLICY IF EXISTS "teaching_channels_select_all" ON teaching_channels;
DROP POLICY IF EXISTS "teaching_channels_insert_all" ON teaching_channels;
DROP POLICY IF EXISTS "teaching_channels_update_all" ON teaching_channels;
DROP POLICY IF EXISTS "teaching_channels_delete_all" ON teaching_channels;

-- 4. CREATE NEW PERMISSIVE RLS POLICIES (MATCHES EXISTING SYSTEM PATTERN)
-- These allow all operations - authentication is handled at the app layer
CREATE POLICY "teaching_channels_select" ON teaching_channels
    FOR SELECT USING (true);

CREATE POLICY "teaching_channels_insert" ON teaching_channels
    FOR INSERT WITH CHECK (true);

CREATE POLICY "teaching_channels_update" ON teaching_channels
    FOR UPDATE USING (true);

CREATE POLICY "teaching_channels_delete" ON teaching_channels
    FOR DELETE USING (true);

-- 5. ENSURE RLS IS ENABLED
ALTER TABLE teaching_channels ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICATION - Fixed column name from polname to policyname
SELECT 'Channel Images Setup Complete' as status;
SELECT COUNT(*) as teaching_channels_count FROM teaching_channels;
SELECT policyname, qual FROM pg_policies WHERE tablename = 'teaching_channels' ORDER BY policyname;

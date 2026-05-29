-- Dating profile photos table + richer profile fields

CREATE TABLE IF NOT EXISTS dating_profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dating_profile_photos_profile ON dating_profile_photos(profile_id, order_index);

ALTER TABLE dating_profiles
  ADD COLUMN IF NOT EXISTS height_cm INT,
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS religion TEXT,
  ADD COLUMN IF NOT EXISTS drinking TEXT,
  ADD COLUMN IF NOT EXISTS smoking TEXT,
  ADD COLUMN IF NOT EXISTS children TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS personality_traits TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weekly_availability TEXT;

ALTER TABLE dating_profiles DROP COLUMN IF EXISTS photo_urls;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['dating_profile_photos'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Block anon/authenticated" ON %I;', tbl);
    EXECUTE format(
      'CREATE POLICY "Block anon/authenticated" ON %I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);',
      tbl
    );
  END LOOP;
END $$;

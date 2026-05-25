-- Sandbox column on influencer_profiles (no core table changes)

ALTER TABLE influencer_profiles
  ADD COLUMN IF NOT EXISTS registration_source TEXT NOT NULL DEFAULT 'referral_hub'
  CHECK (registration_source IN ('referral_hub', 'self_registered'));

CREATE INDEX IF NOT EXISTS idx_influencer_profiles_registration_source
  ON influencer_profiles (registration_source);

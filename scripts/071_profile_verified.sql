-- Profile photo verification flag (auto-set after face-api pass; admin can approve/reject)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS profile_verified BOOLEAN DEFAULT false;

COMMENT ON COLUMN agents.profile_verified IS 'True when profile photo passed face verification or was approved by admin';

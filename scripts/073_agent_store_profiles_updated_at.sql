-- agent_store_profiles.updated_at (used by storefront payout and profile updates)

ALTER TABLE agent_store_profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN agent_store_profiles.updated_at IS 'Last profile or balance update';

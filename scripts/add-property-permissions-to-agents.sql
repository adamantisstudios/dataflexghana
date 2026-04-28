-- Migration: Add property publishing and editing permissions to agents table
-- Purpose: Allow admins to grant agents permission to publish and edit properties
-- Properties published by agents will be marked as unpublished (is_approved = false) pending admin approval

-- Add new columns to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS can_publish_properties boolean DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS can_update_properties boolean DEFAULT false;

-- Add comments to document the columns
COMMENT ON COLUMN agents.can_publish_properties IS 'If true, agent can publish properties (they will be unpublished pending admin approval)';
COMMENT ON COLUMN agents.can_update_properties IS 'If true, agent can edit existing properties (changes pending admin approval)';

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'agents' AND column_name LIKE 'can_%'
ORDER BY column_name;

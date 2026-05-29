-- Official read-only Announcements channel: all approved agents auto-joined.

ALTER TABLE teaching_channels
  ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_teaching_channels_is_official
  ON teaching_channels (is_official)
  WHERE is_official = true;

-- Stable ID for app/env (NEXT_PUBLIC_ANNOUNCEMENTS_CHANNEL_ID)
DO $$
DECLARE
  v_channel_id UUID := 'a0000000-0000-4000-8000-000000000001';
  v_admin_id TEXT;
BEGIN
  SELECT id INTO v_admin_id
  FROM agents
  WHERE lower(trim(coalesce(email, ''))) = 'sales.dataflex@gmail.com'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    v_admin_id := 'platform-admin';
  END IF;

  INSERT INTO teaching_channels (
    id,
    name,
    description,
    category,
    created_by,
    is_active,
    is_public,
    max_members,
    is_official
  )
  VALUES (
    v_channel_id,
    'Announcements',
    'Official platform updates from Dataflex Ghana. Read-only for agents. Visit /blogs for articles and tips.',
    'Official',
    v_admin_id,
    true,
    false,
    999999,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_official = true,
    is_active = true,
    updated_at = CURRENT_TIMESTAMP;

  INSERT INTO channel_members (channel_id, agent_id, role, status, joined_at)
  SELECT v_channel_id, a.id, 'member', 'active', CURRENT_TIMESTAMP
  FROM agents a
  WHERE a.isapproved = true
    AND coalesce(a.isbanned, false) = false
  ON CONFLICT (channel_id, agent_id) DO UPDATE SET
    status = 'active',
    joined_at = COALESCE(channel_members.joined_at, EXCLUDED.joined_at);
END $$;

-- Find a Meaningful Connection (dating) feature — service-role API only

CREATE TABLE IF NOT EXISTS dating_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  age INT CHECK (age >= 18 AND age <= 100),
  gender TEXT,
  interested_in TEXT,
  relationship_status TEXT CHECK (relationship_status IN ('single', 'divorced', 'widowed', 'complicated')),
  intentions TEXT NOT NULL CHECK (intentions IN (
    'serious_relationship', 'marriage', 'friendship', 'open_to_possibilities_serious'
  )),
  location TEXT,
  occupation TEXT,
  interests TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  ladies_first BOOLEAN DEFAULT false,
  profile_completeness INT DEFAULT 0,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dating_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  min_age INT DEFAULT 18,
  max_age INT DEFAULT 60,
  preferred_genders TEXT[] DEFAULT '{}',
  max_distance_km INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dating_swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  swiped_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('like', 'pass')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (swiper_agent_id, swiped_agent_id)
);

CREATE TABLE IF NOT EXISTS dating_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_a_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  agent_b_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  chat_initiator_agent_id UUID REFERENCES agents(id),
  chat_started BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT dating_matches_unique_pair UNIQUE (agent_a_id, agent_b_id),
  CONSTRAINT dating_matches_ordered CHECK (agent_a_id < agent_b_id)
);

CREATE TABLE IF NOT EXISTS dating_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES dating_matches(id) ON DELETE CASCADE,
  sender_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'icebreaker', 'image')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dating_counselling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  counsellor_name TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  meeting_link TEXT,
  is_free BOOLEAN DEFAULT false,
  session_type TEXT DEFAULT 'intro' CHECK (session_type IN ('intro', 'monthly', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dating_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  reported_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'actioned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dating_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  blocked_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (blocker_agent_id, blocked_agent_id)
);

CREATE TABLE IF NOT EXISTS dating_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'silver', 'gold')),
  swipes_remaining INT DEFAULT 10,
  matches_remaining INT DEFAULT 2,
  coins INT DEFAULT 0,
  streak_count INT DEFAULT 0,
  last_active_date DATE,
  swipes_reset_at TIMESTAMPTZ,
  matches_reset_at TIMESTAMPTZ,
  intro_counselling_claimed BOOLEAN DEFAULT false,
  monthly_counselling_claimed_at TIMESTAMPTZ,
  paystack_reference TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dating_profiles_agent ON dating_profiles(agent_id);
CREATE INDEX IF NOT EXISTS idx_dating_profiles_active ON dating_profiles(is_active, is_approved) WHERE is_active = true AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_dating_swipes_swiper ON dating_swipes(swiper_agent_id);
CREATE INDEX IF NOT EXISTS idx_dating_swipes_swiped ON dating_swipes(swiped_agent_id);
CREATE INDEX IF NOT EXISTS idx_dating_matches_agents ON dating_matches(agent_a_id, agent_b_id);
CREATE INDEX IF NOT EXISTS idx_dating_messages_match ON dating_messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dating_reports_reported ON dating_reports(reported_agent_id);
CREATE INDEX IF NOT EXISTS idx_dating_blocks ON dating_blocks(blocker_agent_id, blocked_agent_id);

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'dating_profiles', 'dating_preferences', 'dating_swipes', 'dating_matches',
    'dating_messages', 'dating_counselling_sessions', 'dating_reports',
    'dating_blocks', 'dating_subscriptions'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Block anon/authenticated" ON %I;', tbl);
    EXECUTE format(
      'CREATE POLICY "Block anon/authenticated" ON %I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);',
      tbl
    );
  END LOOP;
END $$;

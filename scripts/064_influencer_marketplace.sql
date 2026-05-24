-- Micro-Influencer Marketplace (sandboxed tables)

CREATE TABLE IF NOT EXISTS influencer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID UNIQUE REFERENCES agents(id),
    bio TEXT,
    photo_url TEXT,
    social_handles JSONB NOT NULL DEFAULT '{}',
    audience_size INTEGER NOT NULL,
    niche TEXT,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS influencer_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES influencer_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    delivery_days INTEGER DEFAULT 7,
    terms TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS influencer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES influencer_packages(id),
    agent_id UUID REFERENCES agents(id),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    requirements TEXT NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    platform_fee_client NUMERIC(12,2) NOT NULL,
    platform_fee_influencer NUMERIC(12,2) NOT NULL,
    influencer_payout NUMERIC(12,2) NOT NULL,
    paystack_reference TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','content_created','completed','disputed','cancelled')),
    review TEXT,
    rating INTEGER,
    escrow_released BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_orders ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['influencer_profiles','influencer_packages','influencer_orders'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Block anon/authenticated" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "Block anon/authenticated" ON %I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);', tbl);
  END LOOP;
END $$;

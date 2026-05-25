-- Agent listing packages marketplace (sandboxed)

CREATE TABLE IF NOT EXISTS listing_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    max_listings INTEGER NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    includes_analytics BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO listing_packages (name, max_listings, price, includes_analytics)
SELECT 'Starter', 20, 35.00, false
WHERE NOT EXISTS (SELECT 1 FROM listing_packages WHERE name = 'Starter');

INSERT INTO listing_packages (name, max_listings, price, includes_analytics)
SELECT 'Growth', 30, 60.00, false
WHERE NOT EXISTS (SELECT 1 FROM listing_packages WHERE name = 'Growth');

INSERT INTO listing_packages (name, max_listings, price, includes_analytics)
SELECT 'Ultimate', 60, 100.00, true
WHERE NOT EXISTS (SELECT 1 FROM listing_packages WHERE name = 'Ultimate');

CREATE TABLE IF NOT EXISTS agent_listing_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    package_id UUID REFERENCES listing_packages(id),
    paystack_reference TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','expired','cancelled')),
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    subscription_id UUID REFERENCES agent_listing_subscriptions(id),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    images TEXT[] DEFAULT '{}',
    momo_number TEXT,
    momo_name TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_subs_agent ON agent_listing_subscriptions(agent_id);
CREATE INDEX IF NOT EXISTS idx_listing_subs_status ON agent_listing_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_agent_products_agent ON agent_products(agent_id);

ALTER TABLE agent_store_profiles
  ADD COLUMN IF NOT EXISTS can_list_products BOOLEAN DEFAULT true;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['listing_packages','agent_listing_subscriptions','agent_products'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Block anon/authenticated" ON %I;', tbl);
    EXECUTE format(
      'CREATE POLICY "Block anon/authenticated" ON %I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);',
      tbl
    );
  END LOOP;
END $$;

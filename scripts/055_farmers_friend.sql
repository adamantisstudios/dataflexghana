-- Farmers Friend marketplace (sandboxed). Run on Supabase.

CREATE TABLE IF NOT EXISTS farm_platform_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    agent_commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.10,
    default_delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO farm_platform_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS farm_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    farmer_name TEXT NOT NULL,
    farmer_phone TEXT NOT NULL,
    farmer_location TEXT,
    produce_name TEXT NOT NULL,
    quantity_available NUMERIC(12,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    negotiated_price NUMERIC(12,2) NOT NULL,
    admin_markup NUMERIC(12,2) DEFAULT 0,
    retail_price NUMERIC(12,2) DEFAULT 0,
    photos TEXT[] DEFAULT '{}',
    harvest_date DATE,
    notes TEXT,
    is_published BOOLEAN DEFAULT false,
    is_fulfilled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farm_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES farm_listings(id),
    agent_id UUID REFERENCES agents(id),
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    buyer_email TEXT,
    delivery_address TEXT NOT NULL,
    quantity_ordered NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    delivery_fee NUMERIC(12,2) DEFAULT 0,
    paystack_reference TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','picked_up','out_for_delivery','delivered','cancelled')),
    agent_commission NUMERIC(12,2) DEFAULT 0,
    commission_credited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farm_listings_agent ON farm_listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_farm_listings_published ON farm_listings(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_farm_orders_agent ON farm_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_farm_orders_reference ON farm_orders(paystack_reference);

ALTER TABLE farm_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_platform_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON farm_listings;
CREATE POLICY "Block anon/authenticated" ON farm_listings AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Block anon/authenticated" ON farm_orders;
CREATE POLICY "Block anon/authenticated" ON farm_orders AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Block anon/authenticated" ON farm_platform_config;
CREATE POLICY "Block anon/authenticated" ON farm_platform_config AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

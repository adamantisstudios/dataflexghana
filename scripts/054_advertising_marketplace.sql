-- Advertising marketplace (sandboxed — no core table changes)

CREATE TABLE IF NOT EXISTS ad_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_name TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('radio','tv','online','print','outdoor','other')),
    package_name TEXT NOT NULL,
    description TEXT,
    number_of_spots INTEGER,
    spot_duration TEXT,
    price NUMERIC(12,2) NOT NULL,
    agent_commission NUMERIC(12,2) DEFAULT 0,
    custom_fields JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES ad_packages(id),
    agent_id UUID REFERENCES agents(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    customer_business TEXT,
    ad_message TEXT,
    total_paid NUMERIC(12,2) NOT NULL,
    paystack_reference TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','booked','aired','completed','cancelled')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_orders_paystack_reference
    ON ad_orders (paystack_reference)
    WHERE paystack_reference IS NOT NULL;

ALTER TABLE ad_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON ad_packages;
CREATE POLICY "Block anon/authenticated" ON ad_packages AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Block anon/authenticated" ON ad_orders;
CREATE POLICY "Block anon/authenticated" ON ad_orders AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

-- Allow ad_package in agent_store_settings (run after storefront-upgrade-2026.sql)
ALTER TABLE agent_store_settings DROP CONSTRAINT IF EXISTS agent_store_settings_item_type_check;
ALTER TABLE agent_store_settings ADD CONSTRAINT agent_store_settings_item_type_check
  CHECK (item_type IN ('data_bundle', 'referral_service', 'wholesale_product', 'compliance_form', 'ad_package'));

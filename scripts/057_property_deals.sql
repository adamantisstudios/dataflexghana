-- Property deals & storefront property catalog (sandboxed)

CREATE TABLE IF NOT EXISTS property_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id),
    agent_id UUID REFERENCES agents(id),
    deal_type TEXT NOT NULL CHECK (deal_type IN ('sale','rent','agent_owes_platform')),
    listing_source TEXT NOT NULL CHECK (listing_source IN ('agent','platform')),
    final_price NUMERIC(12,2),
    platform_commission NUMERIC(12,2) NOT NULL,
    agent_commission NUMERIC(12,2) DEFAULT 0,
    deal_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE property_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON property_deals;
CREATE POLICY "Block anon/authenticated" ON property_deals AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

-- Allow property listings in agent_store_settings
ALTER TABLE agent_store_settings DROP CONSTRAINT IF EXISTS agent_store_settings_item_type_check;
ALTER TABLE agent_store_settings ADD CONSTRAINT agent_store_settings_item_type_check
  CHECK (item_type IN (
    'data_bundle',
    'referral_service',
    'wholesale_product',
    'compliance_form',
    'ad_package',
    'writing_service',
    'farm_listing',
    'property'
  ));

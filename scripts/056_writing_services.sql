-- Professional Writing Services marketplace (sandboxed)

CREATE TABLE IF NOT EXISTS writing_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    agent_commission NUMERIC(12,2) NOT NULL DEFAULT 0,
    turnaround_time TEXT DEFAULT '2-3 business days',
    category TEXT DEFAULT 'General',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS writing_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES writing_services(id),
    agent_id UUID REFERENCES agents(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    instructions TEXT,
    cv_fields JSONB DEFAULT '{}',
    attached_file_url TEXT,
    total_paid NUMERIC(12,2) NOT NULL,
    paystack_reference TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','delivered','cancelled')),
    completed_file_url TEXT,
    admin_notes TEXT,
    agent_commission_earned NUMERIC(12,2) DEFAULT 0,
    commission_credited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE writing_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON writing_services;
CREATE POLICY "Block anon/authenticated" ON writing_services AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Block anon/authenticated" ON writing_orders;
CREATE POLICY "Block anon/authenticated" ON writing_orders AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

-- Storage bucket for briefs and completed PDFs (public URLs via service role uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('writing-documents', 'writing-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow writing_service in agent_store_settings
ALTER TABLE agent_store_settings DROP CONSTRAINT IF EXISTS agent_store_settings_item_type_check;
ALTER TABLE agent_store_settings ADD CONSTRAINT agent_store_settings_item_type_check
  CHECK (item_type IN (
    'data_bundle',
    'referral_service',
    'wholesale_product',
    'compliance_form',
    'ad_package',
    'writing_service',
    'farm_listing'
  ));

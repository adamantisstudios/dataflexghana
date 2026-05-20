-- Storefront & Referral Hub upgrade (run in Supabase SQL editor)

-- WhatsApp channel
ALTER TABLE agent_store_profiles ADD COLUMN IF NOT EXISTS whatsapp_channel_url TEXT;
ALTER TABLE agent_store_profiles ADD COLUMN IF NOT EXISTS show_whatsapp_popup BOOLEAN DEFAULT true;

-- Compliance submissions
CREATE TABLE IF NOT EXISTS storefront_compliance_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    form_type VARCHAR(100) NOT NULL,
    customer_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    paystack_reference TEXT,
    amount_paid NUMERIC(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE storefront_compliance_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Block anon/authenticated" ON storefront_compliance_submissions;
CREATE POLICY "Block anon/authenticated" ON storefront_compliance_submissions
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_storefront_compliance_agent ON storefront_compliance_submissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_storefront_compliance_ref ON storefront_compliance_submissions(paystack_reference);

-- Extend sandbox storefront_orders for wholesale / buyer details
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'data_bundle';
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS wholesale_product_id UUID;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS buyer_details JSONB;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS item_title TEXT;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Allow bundle-less product orders
ALTER TABLE storefront_orders ALTER COLUMN data_bundle_id DROP NOT NULL;
ALTER TABLE storefront_orders ALTER COLUMN customer_phone DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_storefront_orders_type ON storefront_orders(order_type);

-- Allow wholesale_product and compliance_form in agent_store_settings (fixes PUT 500 on toggles)
ALTER TABLE agent_store_settings DROP CONSTRAINT IF EXISTS agent_store_settings_item_type_check;
ALTER TABLE agent_store_settings DROP CONSTRAINT IF EXISTS agent_store_settings_item_type_check1;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'agent_store_settings'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%item_type%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE agent_store_settings DROP CONSTRAINT ' || quote_ident(conname)
      FROM pg_constraint
      WHERE conrelid = 'agent_store_settings'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%item_type%'
      LIMIT 1
    );
  END IF;
END $$;

ALTER TABLE agent_store_settings ADD CONSTRAINT agent_store_settings_item_type_check
  CHECK (item_type IN ('data_bundle', 'referral_service', 'wholesale_product', 'compliance_form'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_store_settings_unique
  ON agent_store_settings (agent_id, item_id, item_type);

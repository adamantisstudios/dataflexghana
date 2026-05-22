-- Grocery request platform (run on Supabase before deploy)
CREATE TABLE IF NOT EXISTS grocery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  landmark TEXT,
  delivery_time TEXT,
  shopping_list TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'new_request' CHECK (status IN ('new_request','reviewing','contacted_customer','awaiting_payment','processing','delivered','cancelled')),
  estimated_price NUMERIC(12,2),
  delivery_fee NUMERIC(12,2),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grocery_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Block anon/authenticated" ON grocery_requests;
CREATE POLICY "Block anon/authenticated" ON grocery_requests
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

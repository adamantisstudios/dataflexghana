-- Admin-configurable dating subscription & counselling prices

CREATE TABLE IF NOT EXISTS dating_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  silver_price NUMERIC(12, 2) NOT NULL DEFAULT 15,
  gold_price NUMERIC(12, 2) NOT NULL DEFAULT 30,
  coin_pack_price NUMERIC(12, 2) NOT NULL DEFAULT 5,
  counselling_session_price NUMERIC(12, 2) NOT NULL DEFAULT 20,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO dating_settings (silver_price, gold_price, coin_pack_price, counselling_session_price)
SELECT 15, 30, 5, 20
WHERE NOT EXISTS (SELECT 1 FROM dating_settings LIMIT 1);

ALTER TABLE dating_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON dating_settings;
CREATE POLICY "Block anon/authenticated" ON dating_settings
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

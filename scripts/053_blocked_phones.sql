-- Blocked phone numbers for grocery request anti-abuse (run on Supabase)

CREATE TABLE IF NOT EXISTS blocked_phones (
    phone TEXT PRIMARY KEY,
    blocked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blocked_phones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON blocked_phones;
CREATE POLICY "Block anon/authenticated" ON blocked_phones AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

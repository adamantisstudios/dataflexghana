-- Idempotency for Paystack agent wallet top-ups (sandboxed)

CREATE TABLE IF NOT EXISTS paystack_wallet_topup_credits (
    paystack_reference TEXT PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES agents(id),
    amount NUMERIC(12,2) NOT NULL,
    wallet_transaction_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE paystack_wallet_topup_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block anon/authenticated" ON paystack_wallet_topup_credits;
CREATE POLICY "Block anon/authenticated" ON paystack_wallet_topup_credits AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

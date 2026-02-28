-- Add referral_code to agents table if it doesn't exist
ALTER TABLE agents ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS referral_credit_earned DECIMAL(10, 2) DEFAULT 0;

-- Create referral_credits table for tracking referral commissions
CREATE TABLE IF NOT EXISTS referral_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referring_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  referred_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  credit_amount DECIMAL(10, 2) DEFAULT 15.00,
  status VARCHAR(50) DEFAULT 'pending', -- pending, credited, paid_out
  created_at TIMESTAMP DEFAULT NOW(),
  credited_at TIMESTAMP,
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_credits_referring_agent ON referral_credits(referring_agent_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_referred_agent ON referral_credits(referred_agent_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_status ON referral_credits(status);

-- Disable RLS for system tables
ALTER TABLE referral_credits DISABLE ROW LEVEL SECURITY;

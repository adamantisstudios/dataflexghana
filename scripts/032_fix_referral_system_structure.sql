-- Add referral_code to agents table to track who referred them
ALTER TABLE agents ADD COLUMN referral_code VARCHAR(50);

-- Add referral_credit_earned to track earnings from referrals
ALTER TABLE agents ADD COLUMN referral_credit_earned DECIMAL(10, 2) DEFAULT 0;

-- Create a tracking table for referral credits
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

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referral_credits_referring_agent ON referral_credits(referring_agent_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_status ON referral_credits(status);

-- Disable RLS for system tables
ALTER TABLE referral_credits DISABLE ROW LEVEL SECURITY;

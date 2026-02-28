-- ============================================================
-- REFERRAL SYSTEM SCHEMA
-- ============================================================

-- 1. REFERRAL LINKS TABLE - stores unique referral codes per agent
CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(255) NOT NULL UNIQUE,
  agent_name VARCHAR(255) NOT NULL,
  referral_code VARCHAR(50) NOT NULL UNIQUE,
  referral_url TEXT NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_links_public_read" ON referral_links
  FOR SELECT USING (status = 'active');

CREATE POLICY "referral_links_agent_read" ON referral_links
  FOR SELECT USING (true);

CREATE POLICY "referral_links_insert" ON referral_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "referral_links_update" ON referral_links
  FOR UPDATE USING (true);

-- 2. REFERRAL TRACKING TABLE - tracks individual referred users
CREATE TABLE IF NOT EXISTS referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  referrer_agent_id VARCHAR(255) NOT NULL,
  referred_agent_id VARCHAR(255),
  referred_email VARCHAR(255),
  referred_phone VARCHAR(255),
  referral_code VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, rejected
  referral_earnings DECIMAL(12, 2) DEFAULT 0,
  referral_percentage DECIMAL(5, 2) DEFAULT 5, -- 5% default referral bonus
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_tracking_public_read" ON referral_tracking
  FOR SELECT USING (true);

CREATE POLICY "referral_tracking_insert" ON referral_tracking
  FOR INSERT WITH CHECK (true);

CREATE POLICY "referral_tracking_update" ON referral_tracking
  FOR UPDATE USING (true);

-- 3. REFERRAL REWARDS TABLE - tracks payout opportunities
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(255) NOT NULL,
  tracking_id UUID NOT NULL REFERENCES referral_tracking(id) ON DELETE CASCADE,
  reward_amount DECIMAL(12, 2) NOT NULL,
  reward_type VARCHAR(50) DEFAULT 'commission', -- commission, bonus, incentive
  source_type VARCHAR(50), -- signup, purchase, service_completion
  source_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid, rejected
  paid_at TIMESTAMP,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_rewards_read" ON referral_rewards
  FOR SELECT USING (true);

CREATE POLICY "referral_rewards_insert" ON referral_rewards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "referral_rewards_update" ON referral_rewards
  FOR UPDATE USING (true);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_referral_links_agent_id ON referral_links(agent_id);
CREATE INDEX idx_referral_links_code ON referral_links(referral_code);
CREATE INDEX idx_referral_tracking_referrer ON referral_tracking(referrer_agent_id);
CREATE INDEX idx_referral_tracking_code ON referral_tracking(referral_code);
CREATE INDEX idx_referral_tracking_status ON referral_tracking(status);
CREATE INDEX idx_referral_tracking_confirmed_at ON referral_tracking(confirmed_at);
CREATE INDEX idx_referral_rewards_agent_id ON referral_rewards(agent_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX idx_referral_rewards_source ON referral_rewards(source_type, source_id);

-- ============================================================
-- DONE - Referral system schema is ready to use
-- ============================================================

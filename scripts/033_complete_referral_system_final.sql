-- ====================================================================
-- COMPREHENSIVE REFERRAL SYSTEM MIGRATION - FINAL VERSION
-- Fixes all referral-related tables and structures
-- ====================================================================

-- ====================================================================
-- 1. ADD COLUMNS TO AGENTS TABLE (if not already present)
-- ====================================================================
ALTER TABLE agents ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS referral_credit_earned DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS agent_name VARCHAR(255);

-- ====================================================================
-- 2. CREATE REFERRAL_LINKS TABLE (for agent referral programs)
-- ====================================================================
DROP TABLE IF EXISTS referral_links CASCADE;

CREATE TABLE referral_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  agent_name VARCHAR(255) NOT NULL,
  referral_code VARCHAR(100) UNIQUE NOT NULL,
  referral_url TEXT NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_agent_referral UNIQUE(agent_id)
);

-- ====================================================================
-- 3. CREATE REFERRAL_TRACKING TABLE (for tracking clicks and conversions)
-- ====================================================================
DROP TABLE IF EXISTS referral_tracking CASCADE;

CREATE TABLE referral_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  referral_code VARCHAR(100) NOT NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  visitor_ip VARCHAR(45),
  visitor_agent TEXT,
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP,
  new_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  CONSTRAINT unique_tracking UNIQUE(referral_link_id, new_agent_id)
);

-- ====================================================================
-- 4. CREATE REFERRAL_CREDITS TABLE (for commission tracking)
-- ====================================================================
DROP TABLE IF EXISTS referral_credits CASCADE;

CREATE TABLE referral_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referring_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  referred_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  credit_amount DECIMAL(10, 2) DEFAULT 15.00,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, credited, paid_out
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  credited_at TIMESTAMP,
  paid_out_at TIMESTAMP,
  notes TEXT,
  CONSTRAINT unique_referral_credit UNIQUE(referring_agent_id, referred_agent_id)
);

-- ====================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_referral_links_agent_id ON referral_links(agent_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_links_status ON referral_links(status);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_link_id ON referral_tracking(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_code ON referral_tracking(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_converted ON referral_tracking(converted);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_agent_id ON referral_tracking(new_agent_id);

CREATE INDEX IF NOT EXISTS idx_referral_credits_referring_agent ON referral_credits(referring_agent_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_referred_agent ON referral_credits(referred_agent_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_status ON referral_credits(status);

-- ====================================================================
-- 6. DISABLE ROW LEVEL SECURITY FOR SYSTEM TABLES
-- ====================================================================
ALTER TABLE referral_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_credits DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 7. CREATE FUNCTIONS FOR AUTOMATIC UPDATES
-- ====================================================================

-- Function to update referral_links stats when tracking happens
CREATE OR REPLACE FUNCTION update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_links
  SET total_clicks = total_clicks + 1,
      updated_at = NOW()
  WHERE id = NEW.referral_link_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_referral_stats ON referral_tracking;
CREATE TRIGGER trigger_update_referral_stats
AFTER INSERT ON referral_tracking
FOR EACH ROW
EXECUTE FUNCTION update_referral_stats();

-- Function to update conversion status
CREATE OR REPLACE FUNCTION update_referral_conversion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.converted = TRUE AND OLD.converted = FALSE THEN
    UPDATE referral_links
    SET total_referrals = total_referrals + 1,
        updated_at = NOW()
    WHERE id = NEW.referral_link_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_referral_conversion ON referral_tracking;
CREATE TRIGGER trigger_update_referral_conversion
AFTER UPDATE ON referral_tracking
FOR EACH ROW
EXECUTE FUNCTION update_referral_conversion();

-- ====================================================================
-- 8. CREATE VIEWS FOR EASY REPORTING
-- ====================================================================

-- View for agent referral performance
DROP VIEW IF EXISTS agent_referral_stats CASCADE;
CREATE VIEW agent_referral_stats AS
SELECT 
  a.id,
  a.full_name,
  a.phone_number,
  rl.referral_code,
  rl.total_clicks,
  rl.total_referrals,
  COUNT(rc.id) as credits_earned,
  COALESCE(SUM(rc.credit_amount), 0) as total_credits,
  COUNT(CASE WHEN rc.status = 'credited' THEN 1 END) as credited_count,
  COUNT(CASE WHEN rc.status = 'pending' THEN 1 END) as pending_count,
  rl.created_at
FROM agents a
LEFT JOIN referral_links rl ON a.id = rl.agent_id
LEFT JOIN referral_credits rc ON a.id = rc.referring_agent_id
GROUP BY a.id, a.full_name, a.phone_number, rl.referral_code, rl.total_clicks, rl.total_referrals, rl.created_at;

-- View for recent referral activity
DROP VIEW IF EXISTS recent_referral_activity CASCADE;
CREATE VIEW recent_referral_activity AS
SELECT 
  rc.id,
  a1.full_name as referring_agent,
  a2.full_name as referred_agent,
  rc.credit_amount,
  rc.status,
  rc.created_at,
  rc.credited_at
FROM referral_credits rc
JOIN agents a1 ON rc.referring_agent_id = a1.id
JOIN agents a2 ON rc.referred_agent_id = a2.id
ORDER BY rc.created_at DESC;

-- ====================================================================
-- 9. MIGRATION NOTES
-- ====================================================================
-- This script creates the complete referral system with:
-- - referral_links: Tracks agent referral programs
-- - referral_tracking: Tracks clicks and conversions
-- - referral_credits: Tracks earned commissions
-- - Automatic functions to update stats
-- - Performance indexes for fast queries
-- - Views for reporting

-- After running this script:
-- 1. Test generating referral links via /api/agent/referral/generate-link
-- 2. Verify stats loading via /api/agent/referral/stats
-- 3. Test referral registration flow via /agent/register?ref=CODE

-- DEFINITIVE SAFE FIX: Commission Withdrawal System
-- Adds missing columns, handles table/view conflicts, creates triggers and views safely
-- Uses information_schema and IF NOT EXISTS checks to prevent errors

BEGIN;

-- STEP 0: Ensure missing columns exist in agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'Standard';

-- STEP 1: Safely check and handle agent_commission_sources object type
-- Only drop if it's actually a VIEW
DO $$
DECLARE
  obj_type TEXT;
BEGIN
  SELECT table_type INTO obj_type
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'agent_commission_sources';
  
  IF obj_type = 'VIEW' THEN
    EXECUTE 'DROP VIEW IF EXISTS agent_commission_sources CASCADE';
  END IF;
END
$$;

-- Create agent_commission_sources as a TABLE if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_commission_sources (
  id BIGSERIAL PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  commission_source VARCHAR(50) NOT NULL,
  source_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  commission_withdrawn BOOLEAN DEFAULT FALSE,
  withdrawal_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agent_id, commission_source, source_id)
);

-- STEP 2: Add missing columns to commissions table
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'earned',
ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS withdrawal_id VARCHAR(255);

-- STEP 3: Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_agent_commission_sources_agent_id 
ON agent_commission_sources(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commission_sources_withdrawn 
ON agent_commission_sources(commission_withdrawn);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_agent_id ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_withdrawal_id ON commissions(withdrawal_id);

-- STEP 4: Function to mark commissions as withdrawn
CREATE OR REPLACE FUNCTION mark_commissions_as_withdrawn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Update commissions table
    UPDATE commissions
    SET status = 'withdrawn', withdrawn_at = NOW(), withdrawal_id = NEW.id
    WHERE agent_id = NEW.agent_id 
      AND status = 'earned'
      AND withdrawal_id IS NULL;

    -- Update agent_commission_sources table
    UPDATE agent_commission_sources
    SET commission_withdrawn = TRUE, withdrawal_id = NEW.id
    WHERE agent_id = NEW.agent_id 
      AND commission_withdrawn = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger safely
DROP TRIGGER IF EXISTS commission_withdrawal_trigger ON withdrawals;
CREATE TRIGGER commission_withdrawal_trigger
AFTER UPDATE ON withdrawals
FOR EACH ROW
EXECUTE FUNCTION mark_commissions_as_withdrawn();

-- STEP 5: Function to revert commissions when withdrawal is cancelled/rejected
CREATE OR REPLACE FUNCTION revert_commissions_on_withdrawal_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('rejected', 'cancelled') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    -- Revert commissions back to earned
    UPDATE commissions
    SET status = 'earned', withdrawn_at = NULL, withdrawal_id = NULL
    WHERE withdrawal_id = NEW.id;

    -- Revert agent_commission_sources
    UPDATE agent_commission_sources
    SET commission_withdrawn = FALSE, withdrawal_id = NULL
    WHERE withdrawal_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate revert trigger
DROP TRIGGER IF EXISTS commission_withdrawal_revert_trigger ON withdrawals;
CREATE TRIGGER commission_withdrawal_revert_trigger
AFTER UPDATE ON withdrawals
FOR EACH ROW
EXECUTE FUNCTION revert_commissions_on_withdrawal_cancel();

-- STEP 6: Recreate agent_commission_balances view
DROP VIEW IF EXISTS agent_commission_balances CASCADE;
CREATE VIEW agent_commission_balances AS
SELECT 
  a.id as agent_id,
  a.full_name,
  a.phone_number,
  COALESCE(SUM(CASE WHEN c.status = 'earned' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as earned_commission,
  COALESCE(SUM(CASE WHEN c.status = 'withdrawn' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as withdrawn_commission,
  COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as pending_commission,
  COALESCE(SUM(CASE WHEN c.status = 'earned' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as available_balance,
  COALESCE(SUM(c.amount), 0)::DECIMAL(12,2) as total_commission
FROM agents a
LEFT JOIN commissions c ON a.id = c.agent_id
GROUP BY a.id, a.full_name, a.phone_number;

-- STEP 7: Recreate agent_commission_dashboard view
DROP VIEW IF EXISTS agent_commission_dashboard CASCADE;
CREATE VIEW agent_commission_dashboard AS
SELECT 
  a.id,
  a.full_name,
  a.phone_number,
  a.tier,
  COALESCE(SUM(CASE WHEN c.status = 'earned' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as available_commission,
  COALESCE(SUM(CASE WHEN c.status = 'withdrawn' THEN c.amount ELSE 0 END), 0)::DECIMAL(12,2) as withdrawn_commission,
  COALESCE(SUM(c.amount), 0)::DECIMAL(12,2) as total_commission,
  (SELECT COUNT(*) FROM referrals r WHERE r.agent_id = a.id AND r.status = 'completed') as referrals_count,
  (SELECT COUNT(*) FROM data_orders doo WHERE doo.agent_id = a.id AND doo.status = 'completed') as data_orders_count,
  (SELECT COUNT(*) FROM wholesale_orders wo WHERE wo.agent_id = a.id AND wo.status = 'completed') as wholesale_orders_count,
  a.created_at,
  a.is_active,
  CASE 
    WHEN a.is_active = FALSE THEN 'Inactive'
    WHEN COALESCE(SUM(CASE WHEN c.status = 'earned' THEN c.amount ELSE 0 END), 0) > 1000 THEN 'High Earner'
    WHEN COALESCE(SUM(CASE WHEN c.status = 'earned' THEN c.amount ELSE 0 END), 0) > 500 THEN 'Active'
    ELSE 'New'
  END as agent_status
FROM agents a
LEFT JOIN commissions c ON a.id = c.agent_id
GROUP BY a.id, a.full_name, a.phone_number, a.tier, a.created_at, a.is_active;

COMMIT;

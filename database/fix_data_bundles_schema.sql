-- =============================================================================
-- CRITICAL DATABASE SCHEMA FIXES (PostgreSQL-safe)
-- =============================================================================

-- 1. Add missing validity_days column to data_bundles table
ALTER TABLE data_bundles 
ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 30;

-- 2. Update existing records to have proper validity_days based on validity_months
UPDATE data_bundles 
SET validity_days = validity_months * 30 
WHERE validity_days IS NULL OR validity_days = 0;

-- 3. Ensure data_orders table has proper structure
ALTER TABLE data_orders 
ADD COLUMN IF NOT EXISTS bundle_id UUID REFERENCES data_bundles(id);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_orders_agent_id ON data_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_data_orders_bundle_id ON data_orders(bundle_id);
CREATE INDEX IF NOT EXISTS idx_data_orders_status ON data_orders(status);
CREATE INDEX IF NOT EXISTS idx_data_orders_created_at ON data_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_data_bundles_provider ON data_bundles(provider);
CREATE INDEX IF NOT EXISTS idx_data_bundles_active ON data_bundles(is_active);

-- 5. Add constraints safely
DO $$
BEGIN
    -- Ensure validity_days is positive
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='data_bundles' AND column_name='validity_days'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname='chk_validity_days_positive'
    ) THEN
        ALTER TABLE data_bundles
        ADD CONSTRAINT chk_validity_days_positive CHECK (validity_days > 0);
    END IF;

    -- Ensure price is positive
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname='chk_price_positive'
    ) THEN
        ALTER TABLE data_bundles
        ADD CONSTRAINT chk_price_positive CHECK (price > 0);
    END IF;

    -- Ensure commission_rate is valid
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname='chk_commission_rate_valid'
    ) THEN
        ALTER TABLE data_bundles
        ADD CONSTRAINT chk_commission_rate_valid CHECK (commission_rate >= 0 AND commission_rate <= 1);
    END IF;
END $$;

-- 6. Create a view for easy order-bundle joins (avoid 'do' alias conflict)
CREATE OR REPLACE VIEW data_orders_with_bundles AS
SELECT 
    o.*,
    db.name AS bundle_name,
    db.provider AS bundle_provider,
    db.size_gb AS bundle_size_gb,
    db.price AS bundle_price,
    db.validity_days AS bundle_validity_days,
    db.commission_rate AS bundle_commission_rate,
    db.is_active AS bundle_is_active
FROM data_orders AS o
LEFT JOIN data_bundles AS db ON o.bundle_id = db.id;

-- 7. Grant necessary permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON data_orders_with_bundles TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON data_bundles TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON data_orders TO authenticated;

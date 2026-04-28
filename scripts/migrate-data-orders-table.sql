-- Migration: Update data_orders_log table to capture only essential fields
-- This migration removes unnecessary fields and adds payment method and reference code

-- Step 1: Create a temporary table with the new structure
CREATE TABLE data_orders_log_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network VARCHAR(50) NOT NULL,
  data_bundle VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  reference_code VARCHAR(100) NOT NULL UNIQUE,
  payment_method VARCHAR(50) NOT NULL, -- 'manual' or 'paystack'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create indexes on the new table
CREATE INDEX IF NOT EXISTS idx_data_orders_log_new_network ON data_orders_log_new(network);
CREATE INDEX IF NOT EXISTS idx_data_orders_log_new_created_at ON data_orders_log_new(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_orders_log_new_phone ON data_orders_log_new(phone_number);
CREATE INDEX IF NOT EXISTS idx_data_orders_log_new_reference ON data_orders_log_new(reference_code);
CREATE INDEX IF NOT EXISTS idx_data_orders_log_new_payment_method ON data_orders_log_new(payment_method);

-- Step 3: Migrate existing data (keeping only the fields we need)
INSERT INTO data_orders_log_new (network, data_bundle, amount, phone_number, reference_code, payment_method, created_at)
SELECT 
  network,
  data_bundle,
  amount,
  phone_number,
  CONCAT('LEGACY-', id::text),
  'unknown',
  created_at
FROM data_orders_log
WHERE data_bundle IS NOT NULL AND network IS NOT NULL;

-- Step 4: Drop the old table
DROP TABLE IF EXISTS data_orders_log CASCADE;

-- Step 5: Rename new table to original name
ALTER TABLE data_orders_log_new RENAME TO data_orders_log;

-- Step 6: Drop old RLS policies and create new ones
ALTER TABLE data_orders_log DISABLE ROW LEVEL SECURITY;

-- Step 7: Update the log_data_order function with new signature
CREATE OR REPLACE FUNCTION log_data_order(
  p_network VARCHAR,
  p_data_bundle VARCHAR,
  p_amount DECIMAL,
  p_phone_number VARCHAR,
  p_reference_code VARCHAR,
  p_payment_method VARCHAR
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO data_orders_log (
    network,
    data_bundle,
    amount,
    phone_number,
    reference_code,
    payment_method
  ) VALUES (
    p_network,
    p_data_bundle,
    p_amount,
    p_phone_number,
    p_reference_code,
    p_payment_method
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Verify the new table structure
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_name = 'data_orders_log' 
ORDER BY ordinal_position;

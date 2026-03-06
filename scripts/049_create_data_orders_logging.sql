-- Create data_orders_log table for tracking no-registration data bundle orders
CREATE TABLE IF NOT EXISTS data_orders_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paying_pin VARCHAR(100),
  beneficiary_number VARCHAR(100),
  data_bundle VARCHAR(255),
  network VARCHAR(50),
  quantity INTEGER,
  amount DECIMAL(10, 2),
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_data_orders_log_network ON data_orders_log(network);
CREATE INDEX IF NOT EXISTS idx_data_orders_log_created_at ON data_orders_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_orders_log_phone ON data_orders_log(phone_number);

-- Disable RLS for this table (admin access only)
ALTER TABLE data_orders_log DISABLE ROW LEVEL SECURITY;

-- Add payment verification fields to mtnafa_registrations table
ALTER TABLE mtnafa_registrations
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by UUID,
ADD COLUMN IF NOT EXISTS payment_code_sent BOOLEAN DEFAULT false;

-- Add payment verification fields to bulk_orders table
ALTER TABLE bulk_orders
ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by UUID;

-- Create indexes for payment verification queries
CREATE INDEX IF NOT EXISTS idx_mtnafa_payment_verified ON mtnafa_registrations(payment_verified);
CREATE INDEX IF NOT EXISTS idx_mtnafa_verified_by ON mtnafa_registrations(verified_by);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_payment_verified ON bulk_orders(payment_verified);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_verified_by ON bulk_orders(verified_by);

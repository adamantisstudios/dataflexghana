-- Add network field to bulk_order_items table
ALTER TABLE bulk_order_items ADD COLUMN IF NOT EXISTS network VARCHAR(50) DEFAULT 'Unknown';

-- Add index for faster network-based queries
CREATE INDEX IF NOT EXISTS idx_bulk_order_items_network ON bulk_order_items(network);

-- Add comment for documentation
COMMENT ON COLUMN bulk_order_items.network IS 'Network type: MTN, AirtelTigo, or Telecel - can be different from phone prefix if number was ported';

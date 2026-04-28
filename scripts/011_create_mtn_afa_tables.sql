-- Create MTN AFA Registrations table
CREATE TABLE IF NOT EXISTS mtnafa_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  ghana_card VARCHAR(20) NOT NULL UNIQUE,
  location VARCHAR(255) NOT NULL,
  occupation VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending_admin_review',
  payment_required BOOLEAN DEFAULT true,
  payment_instructions TEXT,
  admin_processed_by UUID,
  admin_processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Bulk Orders table
CREATE TABLE IF NOT EXISTS bulk_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  source VARCHAR(20) DEFAULT 'csv',
  row_count INTEGER NOT NULL,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending_admin_review',
  payment_required BOOLEAN DEFAULT true,
  payment_instructions TEXT,
  admin_processed_by UUID,
  admin_processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Bulk Order Items table
CREATE TABLE IF NOT EXISTS bulk_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulk_order_id UUID NOT NULL REFERENCES bulk_orders(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  capacity_gb DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Admin Notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  agent_id UUID NOT NULL,
  submission_id UUID,
  preview TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mtnafa_agent_id ON mtnafa_registrations(agent_id);
CREATE INDEX IF NOT EXISTS idx_mtnafa_status ON mtnafa_registrations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_agent_id ON bulk_orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_status ON bulk_orders(status);
CREATE INDEX IF NOT EXISTS idx_bulk_order_items_bulk_id ON bulk_order_items(bulk_order_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);

-- Add RLS policies
ALTER TABLE mtnafa_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

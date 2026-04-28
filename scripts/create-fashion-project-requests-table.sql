-- Create fashion_project_requests table for tracking customer project inquiries
CREATE TABLE IF NOT EXISTS fashion_project_requests (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES fashion_products(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  client_location TEXT,
  timeline_preference TEXT,
  measurements TEXT,
  additional_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'in-progress', 'completed', 'cancelled')),
  whatsapp_message_sent BOOLEAN DEFAULT FALSE,
  whatsapp_message_id TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_whatsapp CHECK (client_whatsapp ~ '^\+?[0-9]{10,}$')
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_fashion_project_requests_product_id ON fashion_project_requests(product_id);
CREATE INDEX IF NOT EXISTS idx_fashion_project_requests_status ON fashion_project_requests(status);
CREATE INDEX IF NOT EXISTS idx_fashion_project_requests_created_at ON fashion_project_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fashion_project_requests_whatsapp ON fashion_project_requests(client_whatsapp);

-- Enable RLS (Row Level Security)
ALTER TABLE fashion_project_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage requests
CREATE POLICY "Admins can manage project requests"
  ON fashion_project_requests
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

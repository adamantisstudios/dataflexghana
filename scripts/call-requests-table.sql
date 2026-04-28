-- Create call_requests table for property call back requests
CREATE TABLE IF NOT EXISTS call_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  agent_name VARCHAR(255) NOT NULL,
  agent_email VARCHAR(255),
  agent_phone VARCHAR(50),
  property_title VARCHAR(500) NOT NULL,
  property_price DECIMAL(15,2),
  property_currency VARCHAR(10),
  request_message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_call_requests_property_id ON call_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_call_requests_status ON call_requests(status);
CREATE INDEX IF NOT EXISTS idx_call_requests_created_at ON call_requests(created_at DESC);

-- Add RLS policies
ALTER TABLE call_requests ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admin access)
CREATE POLICY "Allow all operations for authenticated users" ON call_requests
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow insert for anonymous users (agents can submit requests)
CREATE POLICY "Allow insert for anonymous users" ON call_requests
  FOR INSERT WITH CHECK (true);

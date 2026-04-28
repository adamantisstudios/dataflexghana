-- Add submitted_by_agent_id column to wholesale_products table
-- This tracks which agent submitted each product for admin filtering

ALTER TABLE wholesale_products
ADD COLUMN submitted_by_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

-- Create an index on submitted_by_agent_id for faster filtering
CREATE INDEX idx_wholesale_products_submitted_by_agent_id 
ON wholesale_products(submitted_by_agent_id);

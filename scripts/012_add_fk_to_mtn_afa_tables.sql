-- Add foreign key constraints to mtnafa_registrations and bulk_orders tables
-- This script adds missing FK relationships that allow proper joins to the agents table

-- Add FK to mtnafa_registrations if it doesn't exist
ALTER TABLE mtnafa_registrations
ADD CONSTRAINT fk_mtnafa_agent_id 
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- Add FK to bulk_orders if it doesn't exist
ALTER TABLE bulk_orders
ADD CONSTRAINT fk_bulk_orders_agent_id 
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- Verify the constraints were added
-- SELECT constraint_name FROM information_schema.table_constraints 
-- WHERE table_name = 'mtnafa_registrations' AND constraint_type = 'FOREIGN KEY';

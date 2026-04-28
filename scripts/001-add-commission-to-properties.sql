-- Add commission column to properties table
-- This allows agents and admins to set commission amounts for properties
-- Commission values are stored as absolute amounts (e.g., 1000), not percentages

ALTER TABLE properties ADD COLUMN IF NOT EXISTS commission DECIMAL(15, 2) DEFAULT NULL;

-- Create index on commission for faster filtering/sorting
CREATE INDEX IF NOT EXISTS idx_properties_commission ON properties(commission);

-- Update existing properties to have a default commission of 0
UPDATE properties SET commission = 0 WHERE commission IS NULL;

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'commission';

-- Test query to show properties with commission
SELECT id, title, price, currency, commission FROM properties LIMIT 10;

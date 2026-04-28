-- Enhance fashion_referrals table with complete tracking information
-- First, add missing columns if they don't exist
ALTER TABLE fashion_referrals
ADD COLUMN IF NOT EXISTS referrer_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS referrer_location TEXT,
ADD COLUMN IF NOT EXISTS product_code TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_message_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Drop existing check constraint if it exists and recreate with new values
ALTER TABLE fashion_referrals DROP CONSTRAINT IF EXISTS fashion_referrals_status_check;
ALTER TABLE fashion_referrals ADD CONSTRAINT fashion_referrals_status_check CHECK (status IN ('pending', 'contacted', 'earned', 'paid', 'cancelled'));

-- Create indexes for referrals
CREATE INDEX IF NOT EXISTS idx_fashion_referrals_status ON fashion_referrals(status);
CREATE INDEX IF NOT EXISTS idx_fashion_referrals_product_id ON fashion_referrals(product_id);
CREATE INDEX IF NOT EXISTS idx_fashion_referrals_created_at ON fashion_referrals(created_at DESC);

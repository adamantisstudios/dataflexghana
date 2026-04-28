-- Add company details columns to services table for admin-only tracking
-- These fields are only visible to admin users, not to agents

ALTER TABLE services ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS contact_person_name TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS alternative_number TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS main_business_location TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS email_address TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS website TEXT;

-- Add comments to explain these are admin-only fields
COMMENT ON COLUMN services.company_name IS 'Admin-only: Company name for tracking purposes';
COMMENT ON COLUMN services.contact_person_name IS 'Admin-only: Contact person name at the company';
COMMENT ON COLUMN services.contact_number IS 'Admin-only: Primary contact number';
COMMENT ON COLUMN services.alternative_number IS 'Admin-only: Alternative contact number';
COMMENT ON COLUMN services.main_business_location IS 'Admin-only: Main business location/address';
COMMENT ON COLUMN services.email_address IS 'Admin-only: Company email address';
COMMENT ON COLUMN services.website IS 'Admin-only: Company website';

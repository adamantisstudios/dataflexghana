-- =====================================================
-- BANK ACCOUNT FORM REGISTRATION - FIXED
-- =====================================================
-- This script fixes the failed Bank Account form registration.
-- The original error occurred because it tried to insert into a non-existent
-- 'compliance_forms' table. This corrected version:
-- 1) Creates the forms registry table if it doesn't exist
-- 2) Registers the Bank Account form with proper metadata
-- 3) Provides example JSON structure for form submissions
-- 4) Includes commented examples for image storage in form_images table
-- =====================================================

-- =====================================================
-- 1. CREATE FORMS REGISTRY TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name TEXT NOT NULL,
  form_type TEXT NOT NULL UNIQUE,
  form_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  cost_ghs DECIMAL(10, 2),
  duration_days INTEGER,
  delivery_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on form_type for fast lookups
CREATE INDEX IF NOT EXISTS idx_forms_form_type ON forms(form_type);
CREATE INDEX IF NOT EXISTS idx_forms_is_active ON forms(is_active);

-- Disable RLS (application handles security)
ALTER TABLE forms DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. REGISTER BANK ACCOUNT FORM
-- =====================================================

INSERT INTO forms (
  form_name,
  form_type,
  form_description,
  is_active,
  cost_ghs,
  duration_days,
  delivery_method,
  created_at,
  updated_at
)
VALUES (
  'Bank Account',
  'bank-account',
  'Open a bank account with complete account information delivered within 1 working day',
  true,
  0.00,
  1,
  'Email/WhatsApp',
  NOW(),
  NOW()
)
ON CONFLICT (form_type) DO UPDATE SET
  form_name = 'Bank Account',
  form_description = 'Open a bank account with complete account information delivered within 1 working day',
  is_active = true,
  cost_ghs = 0.00,
  duration_days = 1,
  delivery_method = 'Email/WhatsApp',
  updated_at = NOW();

-- =====================================================
-- 3. EXAMPLE BANK ACCOUNT FORM DATA STRUCTURE
-- =====================================================
-- This JSON structure represents the form_data stored in form_submissions table
-- for a Bank Account form submission. Use this as reference for frontend integration.

/*
EXAMPLE form_data JSON for Bank Account submission:
{
  "step1_account_information": {
    "applicant_type": "Individual",
    "account_type": "Savings",
    "currency": "GHS",
    "account_purpose": "Personal savings"
  },
  "step2_business_details": {
    "business_name": "John's Trading",
    "business_registration_number": "CS/2024/001234",
    "business_address": "123 Main Street, Accra",
    "business_sector": "Retail Trade"
  },
  "step3_owner_details": {
    "title": "Mr",
    "first_name": "John",
    "middle_name": "Kwame",
    "last_name": "Doe",
    "gender": "Male",
    "date_of_birth": "1990-05-15",
    "nationality": "Ghanaian",
    "ghana_card_number": "GHA-123456789-0",
    "tin_number": "P0012345678",
    "occupation": "Trader"
  },
  "step4_ubo_kyc": {
    "ubo_declaration": true,
    "ubo_same_as_owner": true,
    "risk_profile": "Low",
    "pep_status": false,
    "sanctions_check": false
  },
  "step5_services_mandate": {
    "card_delivery": "Physical Card",
    "internet_banking": true,
    "mobile_banking": true,
    "sms_alerts": true,
    "cheque_book": false
  },
  "step6_signatory_details": {
    "signatory_name": "John Kwame Doe",
    "signatory_title": "Account Owner",
    "signatory_phone": "0501234567",
    "signatory_email": "john@example.com"
  },
  "step7_reference_information": {
    "referee_name": "Jane Smith",
    "referee_phone": "0509876543",
    "referee_relationship": "Business Associate",
    "referee_years_known": 5
  },
  "step8_documents": {
    "signature_captured": true,
    "ghana_card_front_uploaded": true,
    "ghana_card_back_uploaded": true,
    "submission_date": "2024-10-28T10:30:00Z"
  }
}
*/

-- =====================================================
-- 4. EXAMPLE FORM IMAGES ENTRIES
-- =====================================================
-- These are commented examples showing how images are stored in form_images table
-- after a Bank Account form submission. The image_url values would be actual
-- public URLs from the compliance-images storage bucket.

/*
-- Example: Insert signature image for a Bank Account submission
INSERT INTO form_images (
  submission_id,
  image_type,
  image_url,
  uploaded_at
)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- actual submission_id UUID
  'signature',
  'https://your-supabase-url.supabase.co/storage/v1/object/public/compliance-images/bank-account/signature_12345.png',
  NOW()
);

-- Example: Insert Ghana Card front image
INSERT INTO form_images (
  submission_id,
  image_type,
  image_url,
  uploaded_at
)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- actual submission_id UUID
  'ghana_card_front',
  'https://your-supabase-url.supabase.co/storage/v1/object/public/compliance-images/bank-account/ghana_card_front_12345.png',
  NOW()
);

-- Example: Insert Ghana Card back image
INSERT INTO form_images (
  submission_id,
  image_type,
  image_url,
  uploaded_at
)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- actual submission_id UUID
  'ghana_card_back',
  'https://your-supabase-url.supabase.co/storage/v1/object/public/compliance-images/bank-account/ghana_card_back_12345.png',
  NOW()
);
*/

-- =====================================================
-- 5. VERIFY FORM REGISTRATION
-- =====================================================

-- Check that Bank Account form was registered successfully
SELECT 
  id,
  form_name,
  form_type,
  form_description,
  is_active,
  cost_ghs,
  duration_days,
  delivery_method,
  created_at,
  updated_at
FROM forms
WHERE form_type = 'bank-account';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The Bank Account form is now registered and ready for submissions.
-- Agents can submit form data to /api/submit-form with form_id = 'bank-account'
-- and form_data matching the JSON structure provided above.

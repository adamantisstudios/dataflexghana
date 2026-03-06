-- Register Partnership Registration form in the forms table
-- This script registers the partnership form type and provides the JSON schema structure

INSERT INTO forms (form_name, form_description, form_type, is_active, created_at, updated_at)
VALUES (
  'Partnership Registration',
  'Register an incorporated private partnership in Ghana with partner details, business information, and required documentation',
  'partnership-registration',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (form_type) DO UPDATE SET
  form_name = 'Partnership Registration',
  form_description = 'Register an incorporated private partnership in Ghana with partner details, business information, and required documentation',
  is_active = true,
  updated_at = NOW();

-- Example JSON schema for partnership form_data in form_submissions table
-- This shows the structure agents will submit when completing the partnership form:
/*
{
  "step1_partnership_details": {
    "business_name": "string",
    "business_description": "string",
    "nature_of_business": "string",
    "business_sectors": ["string"],
    "isic_code": "string",
    "registration_date": "date"
  },
  "step2_addresses": {
    "principal_office_address": "string",
    "principal_office_city": "string",
    "principal_office_region": "string",
    "registered_office_address": "string",
    "registered_office_city": "string",
    "registered_office_region": "string"
  },
  "step3_contact_info": {
    "phone_number": "string",
    "email": "string",
    "postal_address": "string",
    "postal_code": "string"
  },
  "step4_partners": [
    {
      "partner_index": 1,
      "full_name": "string",
      "ghana_card_number": "string",
      "date_of_birth": "date",
      "nationality": "string",
      "residential_address": "string",
      "phone": "string",
      "email": "string",
      "signature_captured": true,
      "ghana_card_front_uploaded": true,
      "ghana_card_back_uploaded": true
    },
    {
      "partner_index": 2,
      "full_name": "string",
      "ghana_card_number": "string",
      "date_of_birth": "date",
      "nationality": "string",
      "residential_address": "string",
      "phone": "string",
      "email": "string",
      "signature_captured": true,
      "ghana_card_front_uploaded": true,
      "ghana_card_back_uploaded": true
    }
  ],
  "step5_additional_info": {
    "employment_size": "string",
    "annual_revenue": "string",
    "bop_request": boolean,
    "msme_classification": "string"
  },
  "step6_declaration": {
    "declaration_accepted": true,
    "declaration_date": "date"
  }
}
*/

-- Images for this form are stored in form_images table with image_type values:
-- - "partner_1_signature"
-- - "partner_1_ghana_card_front"
-- - "partner_1_ghana_card_back"
-- - "partner_2_signature"
-- - "partner_2_ghana_card_front"
-- - "partner_2_ghana_card_back"
-- - (and so on for additional partners)

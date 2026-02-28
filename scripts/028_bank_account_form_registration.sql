-- Register Bank Account Opening form in the forms table
-- This script registers the bank account form type and provides the JSON schema structure

INSERT INTO forms (form_name, form_description, form_type, is_active, created_at, updated_at)
VALUES (
  'Bank Account Opening',
  'Open a bank account with complete account information delivered within 1 working day',
  'bank-account',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (form_type) DO UPDATE SET
  form_name = 'Bank Account Opening',
  form_description = 'Open a bank account with complete account information delivered within 1 working day',
  is_active = true,
  updated_at = NOW();

-- Example JSON schema for bank account form_data in form_submissions table
-- This shows the structure agents will submit when completing the bank account form:
/*
{
  "step1_account_information": {
    "applicant_type": "string",
    "account_type": "string",
    "currency": "string",
    "purpose_of_account": "string",
    "branch": "string"
  },
  "step2_business_details": {
    "company_name": "string",
    "registration_number": "string",
    "jurisdiction": "string",
    "incorporation_date": "date",
    "source_of_funds": "string",
    "business_type": "string",
    "sector": "string",
    "business_address": "string",
    "business_email": "string",
    "business_phone1": "string",
    "business_phone2": "string",
    "tin": "string",
    "annual_turnover": "string"
  },
  "step3_owner_individual_details": {
    "surname": "string",
    "other_names": "string",
    "date_of_birth": "date",
    "gender": "string",
    "nationality": "string",
    "residence_permit": "string",
    "id_type": "string",
    "id_number": "string",
    "id_issue_date": "date",
    "id_expiry_date": "date",
    "id_place_issue": "string",
    "us_citizen": "string",
    "us_address": "string",
    "residential_address": "string",
    "landmark": "string",
    "city": "string",
    "region": "string",
    "phone1": "string",
    "phone2": "string"
  },
  "step4_ubo_kyc": {
    "ubo_company_name": "string",
    "credit_disclosure": boolean,
    "general_declaration": boolean,
    "risk_profile": "string",
    "pep": "string",
    "pep_details": []
  },
  "step5_services_mandate": {
    "card_pickup": "string",
    "card_delivery_address": "string",
    "card_preferences": ["string"],
    "internet_banking": "string",
    "preferred_username": "string",
    "cheque_book": "string",
    "email_statement": "string",
    "statement_frequency": "string",
    "sms_alert": "string",
    "email_alert_frequency": "string",
    "mandate_account_name": "string",
    "mandate_authorization": "string",
    "signatory_specification": "string",
    "cheque_confirm": "string",
    "confirmation_threshold": "string"
  },
  "step6_signatory_details": {
    "signatory_surname": "string",
    "signatory_firstname": "string",
    "signatory_othername": "string",
    "signatory_class": "string",
    "signatory_id_type": "string",
    "signatory_id_number": "string",
    "signatory_phone": "string",
    "signatory_address": "string"
  },
  "step7_reference": {
    "referee_name": "string",
    "referee_address": "string",
    "reference_applicant_name": "string",
    "referee_bank": "string",
    "referee_account": "string",
    "referee_branch": "string"
  }
}
*/

-- Images for this form are stored in form_images table with image_type values:
-- - "signature"
-- - "ghana_card_front"

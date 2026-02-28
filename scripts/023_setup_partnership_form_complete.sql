-- Partnership Registration Form Setup
-- This script creates all necessary form field definitions for the partnership registration form

-- Insert partnership form metadata into compliance_forms table
INSERT INTO compliance_forms (form_name, form_description, form_type, is_active, created_at, updated_at)
VALUES (
  'Partnership Registration',
  'Register your incorporated private partnership business',
  'partnership-registration',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (form_type) DO UPDATE SET
  form_name = 'Partnership Registration',
  form_description = 'Register your incorporated private partnership business',
  is_active = true,
  updated_at = NOW();

-- Insert form field definitions for partnership form
-- These define the structure and validation rules for each field

-- Step 1: Partnership & Business Details
INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'partnershipName',
  'text',
  'Partnership Name',
  true,
  1,
  '{"minLength": 3, "maxLength": 255}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'sectors',
  'multiselect',
  'Nature of Business/Sector(s)',
  true,
  2,
  '{"options": ["Legal", "Estate/Housing", "Media", "Transport/Aerospace", "Utilities", "Education", "Shipping & Port", "Fashion/Beautification", "Tourism", "Quarry/Mining", "Hospitality", "Refinery of Minerals", "Insurance", "Entertainment", "Healthcare", "Securities/Brokers", "Agriculture", "Food Industry", "Commerce/Trading", "Banking/Finance", "Oil/Gas", "Manufacturing", "Pharmaceutical", "Telecom/ICT", "Construction", "Security", "Sanitation", "Other"]}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'isicCodes',
  'array',
  'ISIC Codes',
  false,
  3,
  '{"maxItems": 5}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'businessDescription',
  'textarea',
  'Business Description',
  false,
  4,
  '{"maxLength": 1000}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

-- Step 2: Address Information
INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'digitalAddress',
  'text',
  'Digital Address (Ghana Post GPS)',
  true,
  5,
  '{"pattern": "^[A-Z]{2}-[0-9]{3}-[0-9]{4}$"}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'houseNumber',
  'text',
  'House/Building/Flat',
  true,
  6,
  '{"minLength": 1, "maxLength": 100}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'streetName',
  'text',
  'Street Name',
  true,
  7,
  '{"minLength": 1, "maxLength": 100}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'city',
  'text',
  'City',
  true,
  8,
  '{"minLength": 1, "maxLength": 100}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'district',
  'text',
  'District',
  true,
  9,
  '{"minLength": 1, "maxLength": 100}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'region',
  'select',
  'Region',
  true,
  10,
  '{"options": ["Greater Accra Region", "Ashanti Region", "Western Region", "Eastern Region", "Volta Region", "Northern Region", "Upper East Region", "Upper West Region", "Central Region", "Bono Region", "Bono East Region", "Ahafo Region", "Savannah Region", "North East Region", "Oti Region", "Western North Region"]}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'registeredDigitalAddress',
  'text',
  'Registered Office Digital Address',
  false,
  11,
  '{"pattern": "^[A-Z]{2}-[0-9]{3}-[0-9]{4}$"}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'registeredHouseNumber',
  'text',
  'Registered Office House/Building/Flat',
  false,
  12,
  '{"minLength": 1, "maxLength": 100}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'registeredStreetName',
  'text',
  'Registered Office Street Name',
  false,
  13,
  '{"minLength": 1, "maxLength": 100}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'registeredCity',
  'text',
  'Registered Office City',
  false,
  14,
  '{"minLength": 1, "maxLength": 100}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'registeredDistrict',
  'text',
  'Registered Office District',
  false,
  15,
  '{"minLength": 1, "maxLength": 100}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'registeredRegion',
  'select',
  'Registered Office Region',
  false,
  16,
  '{"options": ["Greater Accra Region", "Ashanti Region", "Western Region", "Eastern Region", "Volta Region", "Northern Region", "Upper East Region", "Upper West Region", "Central Region", "Bono Region", "Bono East Region", "Ahafo Region", "Savannah Region", "North East Region", "Oti Region", "Western North Region"]}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

-- Step 3: Contact & Postal Details
INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'postalType',
  'select',
  'Postal Type',
  false,
  17,
  '{"options": ["P.O. Box", "Private Bag"]}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'postalNumber',
  'text',
  'Postal Number',
  false,
  18,
  '{"maxLength": 50}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'postalTown',
  'text',
  'Postal Town',
  false,
  19,
  '{"maxLength": 100}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'postalRegion',
  'text',
  'Postal Region',
  false,
  20,
  '{"maxLength": 100}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'phoneNo1',
  'tel',
  'Phone Number 1',
  false,
  21,
  '{"pattern": "^[0-9]{10}$"}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'mobileNo1',
  'tel',
  'Mobile Number 1',
  true,
  22,
  '{"pattern": "^[0-9]{10}$"}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'email',
  'email',
  'Email Address',
  true,
  23,
  '{"pattern": "^[^@]+@[^@]+\\.[^@]+$"}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'website',
  'url',
  'Website',
  false,
  24,
  '{"pattern": "^https?://"}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

-- Step 4: Partners Information (Dynamic - stored in form_data JSON)
INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'partners',
  'array',
  'Partnership Members',
  true,
  25,
  '{"minItems": 2, "itemSchema": {"tin": "string", "ghanaCard": "string", "title": "string", "firstName": "string", "lastName": "string", "gender": "string", "dateOfBirth": "date", "nationality": "string", "occupation": "string", "city": "string", "district": "string", "region": "string", "mobileNo1": "tel", "email": "email", "signatureDataUrl": "string", "ghanaCardFile": "file"}}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

-- Step 5: Additional Information
INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'employmentSize',
  'select',
  'Employment Size',
  true,
  26,
  '{"options": ["1-5", "6-29", "30-99", "100+"]}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'revenueEnvisaged',
  'select',
  'Revenue Envisaged (GHS)',
  true,
  27,
  '{"options": ["Below 500,000", "500,000 - 2,000,000", "2,000,001 - 10,000,000", "Above 10,000,000"]}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'partnershipCategory',
  'select',
  'Partnership Category',
  true,
  28,
  '{"options": ["Micro", "Small", "Medium", "Large"]}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'bopRequest',
  'radio',
  'Request Business Operating Permit (BOP)',
  true,
  29,
  '{"options": ["Yes", "No"]}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'bopReferenceNo',
  'text',
  'BOP Reference Number',
  false,
  30,
  '{"maxLength": 50}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'assetDescription',
  'textarea',
  'Description of Asset Subject to Charge',
  false,
  31,
  '{"maxLength": 1000}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

-- Signature and Ghana Card fields (handled via form_images table)
INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'signatures',
  'file',
  'Partner Signatures',
  true,
  32,
  '{"fileType": "image", "maxSize": 5242880, "description": "Signature for each partner"}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

INSERT INTO form_fields (form_id, field_name, field_type, field_label, is_required, field_order, validation_rules, created_at)
SELECT 
  id,
  'ghanaCards',
  'file',
  'Partner Ghana Cards',
  true,
  33,
  '{"fileType": "image", "maxSize": 5242880, "description": "Ghana Card for each partner"}',
  NOW()
FROM compliance_forms WHERE form_type = 'partnership-registration'
ON CONFLICT (form_id, field_name) DO UPDATE SET updated_at = NOW();

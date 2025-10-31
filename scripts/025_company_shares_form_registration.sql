-- Register Company Limited by Shares form
INSERT INTO forms (form_name, form_description, form_type, is_active, created_at, updated_at)
VALUES (
  'Company Limited by Shares',
  'Register a company limited by shares with directors, secretary, and shareholders',
  'company-shares',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (form_type) DO UPDATE SET
  form_name = 'Company Limited by Shares',
  form_description = 'Register a company limited by shares with directors, secretary, and shareholders',
  is_active = true,
  updated_at = NOW();

-- Form data structure for reference:
-- {
--   "company_name": "string",
--   "presented_by": "string",
--   "nature_of_business": "string",
--   "objectives": "string",
--   "stated_capital": "string (GHS)",
--   "digital_address": "string",
--   "house_number": "string",
--   "street_name": "string",
--   "city_district": "string",
--   "contact_info": "string",
--   "employment_size": "string",
--   "revenue_envisaged": "string",
--   "bop_application": "string",
--   "bop_reference_number": "string",
--   "director1": {
--     "title": "string",
--     "first_name": "string",
--     "middle_name": "string",
--     "last_name": "string",
--     "gender": "string",
--     "date_of_birth": "string",
--     "nationality": "string",
--     "occupation": "string",
--     "tin_number": "string",
--     "ghana_card_number": "string",
--     "residential_digital_address": "string",
--     "residential_house_number": "string",
--     "residential_street_name": "string",
--     "residential_city": "string",
--     "residential_district": "string",
--     "residential_region": "string",
--     "residential_country": "string"
--   },
--   "director2": { ... same structure ... },
--   "secretary": { ... same structure ... },
--   "subscriber1": { ... same structure ... },
--   "subscriber2": { ... same structure ... }
-- }
--
-- Images stored in form_images table with person_index field:
-- - signature_director1, signature_director2, signature_secretary, signature_subscriber1, signature_subscriber2
-- - ghana_card_director1, ghana_card_director2, ghana_card_secretary, ghana_card_subscriber1, ghana_card_subscriber2

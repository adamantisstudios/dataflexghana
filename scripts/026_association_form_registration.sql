-- Register Association Registration form
INSERT INTO forms (form_name, form_type, form_description, is_active, created_at, updated_at)
VALUES (
  'Association Registration',
  'association-registration',
  'Register your association or non-profit organization in Ghana',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (form_type) DO UPDATE SET
  form_name = 'Association Registration',
  form_description = 'Register your association or non-profit organization in Ghana',
  is_active = true,
  updated_at = NOW();

-- Add form metadata comment
COMMENT ON TABLE forms IS 'Association Registration Form - Cost: 1,414 GHS, Duration: 14 Working Days, Delivery: Nationwide';

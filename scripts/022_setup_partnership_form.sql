-- Insert Partnership Registration form into compliance_forms table
-- This form is for registering incorporated private partnerships in Ghana

INSERT INTO compliance_forms (form_name, form_description, form_type, is_active, created_at, updated_at)
VALUES (
  'Partnership Registration',
  'Register an incorporated private partnership in Ghana',
  'partnership-registration',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (form_type) DO UPDATE SET
  form_name = 'Partnership Registration',
  form_description = 'Register an incorporated private partnership in Ghana',
  is_active = true,
  updated_at = NOW();

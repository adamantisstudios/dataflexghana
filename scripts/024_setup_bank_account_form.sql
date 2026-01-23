-- Insert Bank Account form into compliance_forms table
INSERT INTO compliance_forms (form_name, form_description, form_type, is_active, created_at, updated_at)
VALUES (
  'Bank Account',
  'Open a bank account with complete account information delivered within 1 working day',
  'bank-account',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (form_type) DO UPDATE SET
  form_name = 'Bank Account',
  form_description = 'Open a bank account with complete account information delivered within 1 working day',
  is_active = true,
  updated_at = NOW();

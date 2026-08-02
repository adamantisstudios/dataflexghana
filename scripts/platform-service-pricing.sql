-- =============================================================================
-- Platform service pricing (vouchers excluded — use e_products admin tab)
-- Agent REGISTRATION fees (₵47 / ₵50) are NOT stored here — they stay in code.
--
-- Run this entire script once in the Supabase SQL editor.
-- Safe to re-run: uses IF NOT EXISTS + ON CONFLICT DO NOTHING.
-- =============================================================================

CREATE TABLE IF NOT EXISTS platform_service_pricing (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  description TEXT,
  category TEXT NOT NULL DEFAULT 'compliance',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO platform_service_pricing (key, label, amount, description, category)
VALUES
  ('compliance_sole_proprietorship', 'Storefront fee (Sole Proprietorship)', 590, 'Customer Paystack fee on agent storefronts', 'compliance'),
  ('compliance_sole_proprietorship_commission', 'Storefront agent commission (Sole Proprietorship)', 50, 'Agent commission per storefront sole proprietorship payment', 'compliance'),
  ('compliance_agent_sole_proprietorship', 'Agent form fee (Sole Proprietorship)', 580, 'MoMo fee when agents submit sole proprietorship in compliance dashboard', 'compliance'),
  ('compliance_agent_sole_proprietorship_commission', 'Agent commission (Sole Proprietorship form)', 50, 'Commission on agent sole proprietorship form', 'compliance'),
  ('compliance_birth_certificate_express', 'Birth Certificate — Express (7 days)', 960, 'Birth certificate express tier', 'compliance'),
  ('compliance_birth_certificate_standard', 'Birth Certificate — Standard (14 days)', 660, 'Birth certificate standard tier', 'compliance'),
  ('compliance_birth_certificate_economy', 'Birth Certificate — Economy (1 month)', 500, 'Birth certificate economy tier', 'compliance'),
  ('compliance_birth_certificate_commission', 'Agent commission (Birth Certificate)', 50, 'Commission per birth certificate submission', 'compliance'),
  ('compliance_passport_premium', 'Passport — Premium (5 days)', 2600, 'Passport premium tier', 'compliance'),
  ('compliance_passport_express', 'Passport — Express (3 weeks)', 1700, 'Passport express tier', 'compliance'),
  ('compliance_passport_standard', 'Passport — Standard (6 weeks)', 1100, 'Passport standard tier', 'compliance'),
  ('compliance_passport_commission', 'Agent commission (Passport)', 100, 'Commission per passport submission', 'compliance'),
  ('compliance_tin_registration', 'TIN Registration fee', 150, 'TIN registration processing fee', 'compliance'),
  ('compliance_tin_registration_commission', 'Agent commission (TIN Registration)', 20, 'Commission per TIN registration', 'compliance'),
  ('compliance_partnership', 'Partnership Registration fee', 1440, 'Partnership registration processing fee', 'compliance'),
  ('compliance_partnership_commission', 'Agent commission (Partnership)', 50, 'Commission per partnership registration', 'compliance'),
  ('compliance_association', 'Association Registration fee', 1444, 'Association registration processing fee', 'compliance'),
  ('compliance_association_commission', 'Agent commission (Association)', 50, 'Commission per association registration', 'compliance'),
  ('compliance_company_shares', 'Company Limited By Shares fee', 1930, 'Company limited by shares processing fee', 'compliance'),
  ('compliance_company_shares_commission', 'Agent commission (Company Shares)', 70, 'Commission per company shares registration', 'compliance'),
  ('compliance_bank_account', 'Bank Account opening fee', 0, 'Set to 0 for free; agents see FREE when zero', 'compliance')
ON CONFLICT (key) DO NOTHING;

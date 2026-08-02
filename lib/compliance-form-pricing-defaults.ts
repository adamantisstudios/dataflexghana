import type { ServicePricingRow } from "@/lib/service-pricing-types"

/** Pricing keys — registration_* keys are intentionally excluded (not admin-editable). */
export const SERVICE_PRICING_KEYS = {
  COMPLIANCE_SOLE: "compliance_sole_proprietorship",
  COMPLIANCE_SOLE_COMMISSION: "compliance_sole_proprietorship_commission",
  COMPLIANCE_AGENT_SOLE: "compliance_agent_sole_proprietorship",
  COMPLIANCE_AGENT_SOLE_COMMISSION: "compliance_agent_sole_proprietorship_commission",
  COMPLIANCE_BIRTH_EXPRESS: "compliance_birth_certificate_express",
  COMPLIANCE_BIRTH_STANDARD: "compliance_birth_certificate_standard",
  COMPLIANCE_BIRTH_ECONOMY: "compliance_birth_certificate_economy",
  COMPLIANCE_BIRTH_COMMISSION: "compliance_birth_certificate_commission",
  COMPLIANCE_PASSPORT_PREMIUM: "compliance_passport_premium",
  COMPLIANCE_PASSPORT_EXPRESS: "compliance_passport_express",
  COMPLIANCE_PASSPORT_STANDARD: "compliance_passport_standard",
  COMPLIANCE_PASSPORT_COMMISSION: "compliance_passport_commission",
  COMPLIANCE_TIN: "compliance_tin_registration",
  COMPLIANCE_TIN_COMMISSION: "compliance_tin_registration_commission",
  COMPLIANCE_PARTNERSHIP: "compliance_partnership",
  COMPLIANCE_PARTNERSHIP_COMMISSION: "compliance_partnership_commission",
  COMPLIANCE_ASSOCIATION: "compliance_association",
  COMPLIANCE_ASSOCIATION_COMMISSION: "compliance_association_commission",
  COMPLIANCE_COMPANY_SHARES: "compliance_company_shares",
  COMPLIANCE_COMPANY_SHARES_COMMISSION: "compliance_company_shares_commission",
  COMPLIANCE_BANK_ACCOUNT: "compliance_bank_account",
} as const

export type CompliancePricingKey = (typeof SERVICE_PRICING_KEYS)[keyof typeof SERVICE_PRICING_KEYS]

export type ComplianceCostTierMeta = {
  id: string
  pricingKey: CompliancePricingKey
  days: string
  delivery: string
  description: string
  defaultAmount: number
}

export const BIRTH_CERTIFICATE_TIER_META: ComplianceCostTierMeta[] = [
  {
    id: "express",
    pricingKey: SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_EXPRESS,
    days: "7 Days",
    delivery: "Nationwide Delivery",
    description: "Express Processing",
    defaultAmount: 960,
  },
  {
    id: "standard",
    pricingKey: SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_STANDARD,
    days: "14 Days",
    delivery: "Nationwide Delivery",
    description: "Standard Processing",
    defaultAmount: 660,
  },
  {
    id: "economy",
    pricingKey: SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_ECONOMY,
    days: "1 Month",
    delivery: "Nationwide Delivery",
    description: "Economy Processing",
    defaultAmount: 500,
  },
]

export const PASSPORT_TIER_META: ComplianceCostTierMeta[] = [
  {
    id: "premium",
    pricingKey: SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_PREMIUM,
    days: "5 Days",
    delivery: "Express Nationwide Delivery",
    description: "Premium Processing",
    defaultAmount: 2600,
  },
  {
    id: "express",
    pricingKey: SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_EXPRESS,
    days: "3 Weeks",
    delivery: "Standard Nationwide Delivery",
    description: "Express Processing",
    defaultAmount: 1700,
  },
  {
    id: "standard",
    pricingKey: SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_STANDARD,
    days: "6 Weeks",
    delivery: "Standard Nationwide Delivery",
    description: "Standard Processing",
    defaultAmount: 1100,
  },
]

export const COMPLIANCE_PRICING_GROUPS: { title: string; keys: CompliancePricingKey[] }[] = [
  {
    title: "Storefront — Sole Proprietorship (customer Paystack)",
    keys: [SERVICE_PRICING_KEYS.COMPLIANCE_SOLE, SERVICE_PRICING_KEYS.COMPLIANCE_SOLE_COMMISSION],
  },
  {
    title: "Agent dashboard — Sole Proprietorship",
    keys: [SERVICE_PRICING_KEYS.COMPLIANCE_AGENT_SOLE, SERVICE_PRICING_KEYS.COMPLIANCE_AGENT_SOLE_COMMISSION],
  },
  {
    title: "Birth Certificate",
    keys: [
      SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_EXPRESS,
      SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_STANDARD,
      SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_ECONOMY,
      SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_COMMISSION,
    ],
  },
  {
    title: "Passport",
    keys: [
      SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_PREMIUM,
      SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_EXPRESS,
      SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_STANDARD,
      SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_COMMISSION,
    ],
  },
  {
    title: "TIN Registration",
    keys: [SERVICE_PRICING_KEYS.COMPLIANCE_TIN, SERVICE_PRICING_KEYS.COMPLIANCE_TIN_COMMISSION],
  },
  {
    title: "Partnership Registration",
    keys: [SERVICE_PRICING_KEYS.COMPLIANCE_PARTNERSHIP, SERVICE_PRICING_KEYS.COMPLIANCE_PARTNERSHIP_COMMISSION],
  },
  {
    title: "Association Registration",
    keys: [SERVICE_PRICING_KEYS.COMPLIANCE_ASSOCIATION, SERVICE_PRICING_KEYS.COMPLIANCE_ASSOCIATION_COMMISSION],
  },
  {
    title: "Company Limited By Shares",
    keys: [
      SERVICE_PRICING_KEYS.COMPLIANCE_COMPANY_SHARES,
      SERVICE_PRICING_KEYS.COMPLIANCE_COMPANY_SHARES_COMMISSION,
    ],
  },
  {
    title: "Bank Account",
    keys: [SERVICE_PRICING_KEYS.COMPLIANCE_BANK_ACCOUNT],
  },
]

export const DEFAULT_COMPLIANCE_PRICING_ROWS: ServicePricingRow[] = [
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_SOLE,
    label: "Storefront fee (Sole Proprietorship)",
    amount: 590,
    description: "Customer Paystack fee on agent storefronts",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_SOLE_COMMISSION,
    label: "Storefront agent commission (Sole Proprietorship)",
    amount: 50,
    description: "Agent commission per storefront sole proprietorship payment",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_AGENT_SOLE,
    label: "Agent form fee (Sole Proprietorship)",
    amount: 580,
    description: "MoMo fee shown when agents submit sole proprietorship in compliance dashboard",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_AGENT_SOLE_COMMISSION,
    label: "Agent commission (Sole Proprietorship form)",
    amount: 50,
    description: "Commission shown on agent sole proprietorship form",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_EXPRESS,
    label: "Birth Certificate — Express (7 days)",
    amount: 960,
    description: "Birth certificate express tier",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_STANDARD,
    label: "Birth Certificate — Standard (14 days)",
    amount: 660,
    description: "Birth certificate standard tier",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_ECONOMY,
    label: "Birth Certificate — Economy (1 month)",
    amount: 500,
    description: "Birth certificate economy tier",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_COMMISSION,
    label: "Agent commission (Birth Certificate)",
    amount: 50,
    description: "Commission per birth certificate submission",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_PREMIUM,
    label: "Passport — Premium (5 days)",
    amount: 2600,
    description: "Passport premium tier",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_EXPRESS,
    label: "Passport — Express (3 weeks)",
    amount: 1700,
    description: "Passport express tier",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_STANDARD,
    label: "Passport — Standard (6 weeks)",
    amount: 1100,
    description: "Passport standard tier",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_COMMISSION,
    label: "Agent commission (Passport)",
    amount: 100,
    description: "Commission per passport submission",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_TIN,
    label: "TIN Registration fee",
    amount: 150,
    description: "TIN registration processing fee",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_TIN_COMMISSION,
    label: "Agent commission (TIN Registration)",
    amount: 20,
    description: "Commission per TIN registration",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_PARTNERSHIP,
    label: "Partnership Registration fee",
    amount: 1440,
    description: "Partnership registration processing fee",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_PARTNERSHIP_COMMISSION,
    label: "Agent commission (Partnership)",
    amount: 50,
    description: "Commission per partnership registration",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_ASSOCIATION,
    label: "Association Registration fee",
    amount: 1444,
    description: "Association registration processing fee",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_ASSOCIATION_COMMISSION,
    label: "Agent commission (Association)",
    amount: 50,
    description: "Commission per association registration",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_COMPANY_SHARES,
    label: "Company Limited By Shares fee",
    amount: 1930,
    description: "Company limited by shares processing fee",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_COMPANY_SHARES_COMMISSION,
    label: "Agent commission (Company Shares)",
    amount: 70,
    description: "Commission per company shares registration",
    category: "compliance",
  },
  {
    key: SERVICE_PRICING_KEYS.COMPLIANCE_BANK_ACCOUNT,
    label: "Bank Account opening fee",
    amount: 0,
    description: "Set to 0 for free; agents see FREE when zero",
    category: "compliance",
  },
]

export function defaultAmountForKey(key: string): number | undefined {
  return DEFAULT_COMPLIANCE_PRICING_ROWS.find((r) => r.key === key)?.amount
}

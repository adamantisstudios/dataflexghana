import {
  BIRTH_CERTIFICATE_TIER_META,
  PASSPORT_TIER_META,
  SERVICE_PRICING_KEYS,
} from "@/lib/compliance-form-pricing-defaults"
import { fetchServicePricingRows } from "@/lib/service-pricing-server"

export type ComplianceFieldType =
  | "text"
  | "phone"
  | "email"
  | "date"
  | "select"
  | "textarea"
  | "tier"
  | "number"

export type ComplianceFieldDef = {
  key: string
  label: string
  type: ComplianceFieldType
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
}

export type ComplianceStepDef = {
  title: string
  description?: string
  fields: ComplianceFieldDef[]
}

export type ComplianceImageDef = {
  key: string
  label: string
  required?: boolean
}

export type ComplianceFormSchema = {
  id: string
  form_type: string
  form_name: string
  form_description: string
  steps: ComplianceStepDef[]
  required_images: ComplianceImageDef[]
  pricing: {
    fee_label: string
    commission_label?: string
    tiers?: Array<{
      id: string
      label: string
      description: string
      days: string
      pricing_key: string
      default_amount: number
    }>
    fee_pricing_key?: string
    commission_pricing_key?: string
    default_fee?: number
    default_commission?: number
  }
}

const GENDER_OPTS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
]

const REGION_OPTS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Oti",
  "Western North",
].map((r) => ({ value: r, label: r }))

export const COMPLIANCE_MOBILE_SCHEMAS: ComplianceFormSchema[] = [
  {
    id: "tin-registration",
    form_type: "tin-registration",
    form_name: "TIN Registration",
    form_description: "Tax Identification Number registration",
    pricing: {
      fee_label: "TIN Registration fee",
      commission_label: "Your commission",
      fee_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_TIN,
      commission_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_TIN_COMMISSION,
      default_fee: 150,
      default_commission: 20,
    },
    steps: [
      {
        title: "Personal information",
        fields: [
          { key: "fullName", label: "Full name", type: "text", required: true },
          { key: "dateOfBirth", label: "Date of birth", type: "date", required: true },
          { key: "gender", label: "Gender", type: "select", required: true, options: GENDER_OPTS },
          { key: "nationality", label: "Nationality", type: "text", required: true },
          { key: "ghanaCardNumber", label: "Ghana Card number", type: "text", required: true },
          { key: "phoneNumber", label: "Phone number", type: "phone", required: true },
          { key: "email", label: "Email", type: "email" },
        ],
      },
      {
        title: "Address",
        fields: [
          { key: "residentialAddress", label: "Residential address", type: "textarea", required: true },
          { key: "digitalAddress", label: "Digital address (GPS)", type: "text" },
          { key: "city", label: "City / Town", type: "text", required: true },
          { key: "region", label: "Region", type: "select", required: true, options: REGION_OPTS },
          { key: "postalAddress", label: "Postal address", type: "text" },
        ],
      },
      {
        title: "Employment / business",
        fields: [
          {
            key: "employmentStatus",
            label: "Employment status",
            type: "select",
            required: true,
            options: [
              { value: "Employed", label: "Employed" },
              { value: "Self-employed", label: "Self-employed" },
              { value: "Unemployed", label: "Unemployed" },
              { value: "Student", label: "Student" },
            ],
          },
          { key: "employerName", label: "Employer name", type: "text" },
          { key: "employerAddress", label: "Employer address", type: "textarea" },
          { key: "occupation", label: "Occupation", type: "text", required: true },
          { key: "businessName", label: "Business name", type: "text" },
          { key: "businessAddress", label: "Business address", type: "textarea" },
          { key: "businessType", label: "Business type", type: "text" },
        ],
      },
      {
        title: "Additional details",
        fields: [
          { key: "previousTIN", label: "Previous TIN (if any)", type: "text" },
          { key: "reasonForRegistration", label: "Reason for registration", type: "textarea", required: true },
        ],
      },
    ],
    required_images: [
      { key: "signature", label: "Signature", required: true },
      { key: "ghana_card_front", label: "Ghana Card (front)", required: true },
      { key: "ghana_card_back", label: "Ghana Card (back)", required: true },
    ],
  },
  {
    id: "sole-proprietorship",
    form_type: "sole-proprietorship",
    form_name: "Sole Proprietorship",
    form_description: "One man business registration",
    pricing: {
      fee_label: "Registration fee",
      commission_label: "Your commission",
      fee_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_AGENT_SOLE,
      commission_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_AGENT_SOLE_COMMISSION,
      default_fee: 580,
      default_commission: 50,
    },
    steps: [
      {
        title: "Business details",
        fields: [
          { key: "business_name", label: "Business name", type: "text", required: true },
          { key: "business_name_alt1", label: "Alternate name 1", type: "text" },
          { key: "nature_of_business", label: "Nature of business", type: "text", required: true },
          { key: "business_description", label: "Business description", type: "textarea", required: true },
          { key: "date_of_commencement", label: "Date of commencement", type: "date", required: true },
        ],
      },
      {
        title: "Business address",
        fields: [
          { key: "registered_digital_address", label: "Digital address", type: "text", required: true },
          { key: "registered_street", label: "Street", type: "text", required: true },
          { key: "registered_city", label: "City", type: "text", required: true },
          { key: "registered_region", label: "Region", type: "select", required: true, options: REGION_OPTS },
          { key: "business_email", label: "Business email", type: "email" },
          { key: "mobile", label: "Business mobile", type: "phone", required: true },
        ],
      },
      {
        title: "Proprietor details",
        fields: [
          { key: "first_name", label: "First name", type: "text", required: true },
          { key: "middle_name", label: "Middle name", type: "text" },
          { key: "last_name", label: "Last name", type: "text", required: true },
          { key: "gender", label: "Gender", type: "select", required: true, options: GENDER_OPTS },
          { key: "date_of_birth", label: "Date of birth", type: "date", required: true },
          { key: "nationality", label: "Nationality", type: "text", required: true },
          { key: "ghana_card_number", label: "Ghana Card number", type: "text", required: true },
          { key: "tin_number", label: "TIN number", type: "text" },
          { key: "residential_address", label: "Residential address", type: "textarea", required: true },
        ],
      },
    ],
    required_images: [
      { key: "signature", label: "Signature", required: true },
      { key: "ghana_card_front", label: "Ghana Card (front)", required: true },
      { key: "ghana_card_back", label: "Ghana Card (back)", required: true },
    ],
  },
  {
    id: "birth-certificate",
    form_type: "birth-certificate",
    form_name: "Birth Certificate",
    form_description: "Apply for a birth certificate",
    pricing: {
      fee_label: "Processing fee (select tier on form)",
      commission_label: "Your commission",
      commission_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_BIRTH_COMMISSION,
      default_commission: 50,
      tiers: BIRTH_CERTIFICATE_TIER_META.map((t) => ({
        id: t.id,
        label: t.description,
        description: t.delivery,
        days: t.days,
        pricing_key: t.pricingKey,
        default_amount: t.defaultAmount,
      })),
    },
    steps: [
      {
        title: "Processing tier",
        fields: [
          {
            key: "selected_cost_tier",
            label: "Select processing speed",
            type: "tier",
            required: true,
          },
        ],
      },
      {
        title: "Child details",
        fields: [
          { key: "child_first_name", label: "Child first name", type: "text", required: true },
          { key: "child_middle_name", label: "Child middle name", type: "text" },
          { key: "child_surname", label: "Child surname", type: "text", required: true },
          { key: "sex", label: "Sex", type: "select", required: true, options: GENDER_OPTS },
          { key: "date_of_birth", label: "Date of birth", type: "date", required: true },
          { key: "place_of_delivery", label: "Place of delivery", type: "text", required: true },
          { key: "region", label: "Region", type: "select", required: true, options: REGION_OPTS },
        ],
      },
      {
        title: "Mother details",
        fields: [
          { key: "mother_first_name", label: "Mother first name", type: "text", required: true },
          { key: "mother_surname", label: "Mother surname", type: "text", required: true },
          { key: "mother_phone", label: "Mother phone", type: "phone", required: true },
          { key: "mother_nid", label: "Mother Ghana Card / NID", type: "text", required: true },
        ],
      },
      {
        title: "Father details",
        fields: [
          { key: "father_first_name", label: "Father first name", type: "text", required: true },
          { key: "father_surname", label: "Father surname", type: "text", required: true },
          { key: "father_phone", label: "Father phone", type: "phone" },
          { key: "father_nid", label: "Father Ghana Card / NID", type: "text" },
        ],
      },
    ],
    required_images: [
      { key: "mother_id_front", label: "Mother ID (front)", required: true },
      { key: "mother_id_back", label: "Mother ID (back)", required: true },
      { key: "father_id_front", label: "Father ID (front)" },
      { key: "father_id_back", label: "Father ID (back)" },
    ],
  },
  {
    id: "passport",
    form_type: "passport",
    form_name: "Passport",
    form_description: "Passport application support",
    pricing: {
      fee_label: "Processing fee (select tier on form)",
      commission_label: "Your commission",
      commission_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_PASSPORT_COMMISSION,
      default_commission: 100,
      tiers: PASSPORT_TIER_META.map((t) => ({
        id: t.id,
        label: t.description,
        description: t.delivery,
        days: t.days,
        pricing_key: t.pricingKey,
        default_amount: t.defaultAmount,
      })),
    },
    steps: [
      {
        title: "Processing tier",
        fields: [{ key: "selected_cost_tier", label: "Select processing speed", type: "tier", required: true }],
      },
      {
        title: "Personal information",
        fields: [
          { key: "full_name", label: "Full name", type: "text", required: true },
          { key: "date_of_birth", label: "Date of birth", type: "date", required: true },
          { key: "place_of_birth", label: "Place of birth", type: "text", required: true },
          { key: "gender", label: "Gender", type: "select", required: true, options: GENDER_OPTS },
          { key: "nationality", label: "Nationality", type: "text", required: true },
          { key: "ghana_card_number", label: "Ghana Card number", type: "text", required: true },
          { key: "phone_number", label: "Phone number", type: "phone", required: true },
          { key: "email", label: "Email", type: "email" },
        ],
      },
      {
        title: "Address & employment",
        fields: [
          { key: "current_residential_address", label: "Current address", type: "textarea", required: true },
          { key: "current_city", label: "City", type: "text", required: true },
          { key: "current_region", label: "Region", type: "select", required: true, options: REGION_OPTS },
          { key: "occupation", label: "Occupation", type: "text", required: true },
          { key: "employer_name", label: "Employer name", type: "text" },
        ],
      },
      {
        title: "Emergency contact",
        fields: [
          { key: "emergency_contact_name", label: "Contact name", type: "text", required: true },
          { key: "emergency_contact_phone", label: "Contact phone", type: "phone", required: true },
          { key: "emergency_contact_relationship", label: "Relationship", type: "text", required: true },
        ],
      },
    ],
    required_images: [
      { key: "passport_photo", label: "Passport photo", required: true },
      { key: "id_front", label: "Ghana Card (front)", required: true },
      { key: "id_back", label: "Ghana Card (back)", required: true },
    ],
  },
  {
    id: "partnership",
    form_type: "partnership",
    form_name: "Partnership Registration",
    form_description: "Partnership business registration",
    pricing: {
      fee_label: "Registration fee",
      commission_label: "Your commission",
      fee_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_PARTNERSHIP,
      commission_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_PARTNERSHIP_COMMISSION,
      default_fee: 1440,
      default_commission: 50,
    },
    steps: [
      {
        title: "Partnership details",
        fields: [
          { key: "partnershipName", label: "Partnership name", type: "text", required: true },
          { key: "businessDescription", label: "Business description", type: "textarea", required: true },
          { key: "digitalAddress", label: "Digital address", type: "text", required: true },
          { key: "streetName", label: "Street", type: "text", required: true },
          { key: "city", label: "City", type: "text", required: true },
          { key: "region", label: "Region", type: "select", required: true, options: REGION_OPTS },
          { key: "email", label: "Business email", type: "email" },
          { key: "mobileNo1", label: "Business phone", type: "phone", required: true },
        ],
      },
      {
        title: "Partner 1",
        fields: [
          { key: "partner1_firstName", label: "First name", type: "text", required: true },
          { key: "partner1_lastName", label: "Last name", type: "text", required: true },
          { key: "partner1_ghanaCard", label: "Ghana Card number", type: "text", required: true },
          { key: "partner1_mobileNo1", label: "Mobile", type: "phone", required: true },
          { key: "partner1_email", label: "Email", type: "email" },
        ],
      },
      {
        title: "Partner 2",
        fields: [
          { key: "partner2_firstName", label: "First name", type: "text", required: true },
          { key: "partner2_lastName", label: "Last name", type: "text", required: true },
          { key: "partner2_ghanaCard", label: "Ghana Card number", type: "text", required: true },
          { key: "partner2_mobileNo1", label: "Mobile", type: "phone", required: true },
          { key: "partner2_email", label: "Email", type: "email" },
        ],
      },
    ],
    required_images: [
      { key: "partner1_signature", label: "Partner 1 signature", required: true },
      { key: "partner1_ghana_card_front", label: "Partner 1 Ghana Card (front)", required: true },
      { key: "partner1_ghana_card_back", label: "Partner 1 Ghana Card (back)", required: true },
      { key: "partner2_signature", label: "Partner 2 signature", required: true },
      { key: "partner2_ghana_card_front", label: "Partner 2 Ghana Card (front)", required: true },
      { key: "partner2_ghana_card_back", label: "Partner 2 Ghana Card (back)", required: true },
    ],
  },
  {
    id: "association",
    form_type: "association",
    form_name: "Association Registration",
    form_description: "Association / NGO registration",
    pricing: {
      fee_label: "Registration fee",
      commission_label: "Your commission",
      fee_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_ASSOCIATION,
      commission_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_ASSOCIATION_COMMISSION,
      default_fee: 1444,
      default_commission: 50,
    },
    steps: [
      {
        title: "Association details",
        fields: [
          { key: "associationName", label: "Association name", type: "text", required: true },
          { key: "associationType", label: "Association type", type: "text", required: true },
          { key: "objectives", label: "Objectives", type: "textarea", required: true },
          { key: "digitalAddress", label: "Digital address", type: "text", required: true },
          { key: "cityDistrict", label: "City / District", type: "text", required: true },
          { key: "region", label: "Region", type: "select", required: true, options: REGION_OPTS },
          { key: "contactInfo", label: "Contact phone / email", type: "text", required: true },
        ],
      },
      {
        title: "Leadership",
        fields: [
          { key: "chairperson_fullName", label: "Chairperson full name", type: "text", required: true },
          { key: "chairperson_mobileNumber", label: "Chairperson mobile", type: "phone", required: true },
          { key: "secretary_fullName", label: "Secretary full name", type: "text", required: true },
          { key: "secretary_mobileNumber", label: "Secretary mobile", type: "phone", required: true },
        ],
      },
    ],
    required_images: [
      { key: "chairperson_signature", label: "Chairperson signature", required: true },
      { key: "chairperson_ghana_card_front", label: "Chairperson Ghana Card (front)", required: true },
      { key: "chairperson_ghana_card_back", label: "Chairperson Ghana Card (back)", required: true },
      { key: "secretary_signature", label: "Secretary signature", required: true },
      { key: "secretary_ghana_card_front", label: "Secretary Ghana Card (front)", required: true },
      { key: "secretary_ghana_card_back", label: "Secretary Ghana Card (back)", required: true },
    ],
  },
  {
    id: "company-shares",
    form_type: "company-shares",
    form_name: "Company Limited By Shares",
    form_description: "Limited company registration",
    pricing: {
      fee_label: "Registration fee",
      commission_label: "Your commission",
      fee_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_COMPANY_SHARES,
      commission_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_COMPANY_SHARES_COMMISSION,
      default_fee: 1930,
      default_commission: 70,
    },
    steps: [
      {
        title: "Company details",
        fields: [
          { key: "company_name", label: "Company name", type: "text", required: true },
          { key: "nature_of_business", label: "Nature of business", type: "text", required: true },
          { key: "objectives", label: "Objectives", type: "textarea", required: true },
          { key: "stated_capital", label: "Stated capital (GHS)", type: "number", required: true },
          { key: "digital_address", label: "Digital address", type: "text", required: true },
          { key: "city_district", label: "City / District", type: "text", required: true },
          { key: "contact_info", label: "Contact info", type: "text", required: true },
        ],
      },
      {
        title: "Director 1",
        fields: [
          { key: "director1_first_name", label: "First name", type: "text", required: true },
          { key: "director1_last_name", label: "Last name", type: "text", required: true },
          { key: "director1_ghana_card_number", label: "Ghana Card number", type: "text", required: true },
          { key: "director1_tin_number", label: "TIN number", type: "text" },
        ],
      },
      {
        title: "Director 2 & secretary",
        fields: [
          { key: "director2_first_name", label: "Director 2 first name", type: "text", required: true },
          { key: "director2_last_name", label: "Director 2 last name", type: "text", required: true },
          { key: "secretary_first_name", label: "Secretary first name", type: "text", required: true },
          { key: "secretary_last_name", label: "Secretary last name", type: "text", required: true },
        ],
      },
    ],
    required_images: [
      { key: "director1_signature", label: "Director 1 signature", required: true },
      { key: "director1_ghana_card_front", label: "Director 1 Ghana Card (front)", required: true },
      { key: "director1_ghana_card_back", label: "Director 1 Ghana Card (back)", required: true },
      { key: "director2_signature", label: "Director 2 signature", required: true },
      { key: "director2_ghana_card_front", label: "Director 2 Ghana Card (front)", required: true },
      { key: "director2_ghana_card_back", label: "Director 2 Ghana Card (back)", required: true },
      { key: "secretary_signature", label: "Secretary signature", required: true },
      { key: "secretary_ghana_card_front", label: "Secretary Ghana Card (front)", required: true },
      { key: "secretary_ghana_card_back", label: "Secretary Ghana Card (back)", required: true },
    ],
  },
  {
    id: "bank-account",
    form_type: "bank-account",
    form_name: "Bank Account",
    form_description: "Business bank account setup",
    pricing: {
      fee_label: "Service fee",
      fee_pricing_key: SERVICE_PRICING_KEYS.COMPLIANCE_BANK_ACCOUNT,
      default_fee: 0,
    },
    steps: [
      {
        title: "Account details",
        fields: [
          {
            key: "bank_name",
            label: "Bank name",
            type: "select",
            required: true,
            options: [
              { value: "GCB", label: "GCB Bank" },
              { value: "Ecobank", label: "Ecobank" },
              { value: "Stanbic", label: "Stanbic Bank" },
              { value: "Fidelity", label: "Fidelity Bank" },
              { value: "Other", label: "Other" },
            ],
          },
          {
            key: "account_type",
            label: "Account type",
            type: "select",
            required: true,
            options: [
              { value: "Savings", label: "Savings" },
              { value: "Current", label: "Current" },
            ],
          },
          { key: "purpose_of_account", label: "Purpose of account", type: "textarea", required: true },
          { key: "branch", label: "Preferred branch", type: "text", required: true },
        ],
      },
      {
        title: "Applicant details",
        fields: [
          { key: "surname", label: "Surname", type: "text", required: true },
          { key: "other_names", label: "Other names", type: "text", required: true },
          { key: "date_of_birth", label: "Date of birth", type: "date", required: true },
          { key: "gender", label: "Gender", type: "select", required: true, options: GENDER_OPTS },
          { key: "nationality", label: "Nationality", type: "text", required: true },
          { key: "id_number", label: "ID number", type: "text", required: true },
          { key: "phone1", label: "Phone number", type: "phone", required: true },
          { key: "residential_address", label: "Residential address", type: "textarea", required: true },
          { key: "city", label: "City", type: "text", required: true },
          { key: "region", label: "Region", type: "select", required: true, options: REGION_OPTS },
        ],
      },
      {
        title: "Business (if applicable)",
        fields: [
          { key: "company_name", label: "Company name", type: "text" },
          { key: "registration_number", label: "Registration number", type: "text" },
          { key: "business_type", label: "Business type", type: "text" },
          { key: "tin", label: "TIN", type: "text" },
        ],
      },
    ],
    required_images: [
      { key: "signature", label: "Signature", required: true },
      { key: "ghana_card_front", label: "Ghana Card (front)", required: true },
      { key: "ghana_card_back", label: "Ghana Card (back)", required: true },
    ],
  },
]

export function getComplianceMobileSchema(formId: string): ComplianceFormSchema | undefined {
  return COMPLIANCE_MOBILE_SCHEMAS.find((s) => s.id === formId || s.form_type === formId)
}

export async function enrichComplianceSchemasWithPricing(
  schemas: ComplianceFormSchema[],
): Promise<ComplianceFormSchema[]> {
  const rows = await fetchServicePricingRows()
  const amount = (key?: string, fallback?: number) => {
    if (!key) return fallback ?? 0
    const row = rows.find((r) => r.key === key)
    return row?.amount ?? fallback ?? 0
  }

  return schemas.map((schema) => {
    const pricing = { ...schema.pricing }
    if (pricing.fee_pricing_key) {
      pricing.default_fee = amount(pricing.fee_pricing_key, pricing.default_fee)
    }
    if (pricing.commission_pricing_key) {
      pricing.default_commission = amount(pricing.commission_pricing_key, pricing.default_commission)
    }
    if (pricing.tiers?.length) {
      pricing.tiers = pricing.tiers.map((t) => ({
        ...t,
        default_amount: amount(t.pricing_key, t.default_amount),
      }))
    }
    return { ...schema, pricing }
  })
}

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

const opts = (values: string[]) => values.map((value) => ({ value, label: value }))

const GENDER_OPTS = opts(["Male", "Female"])
const GENDER_OPTS_WITH_OTHER = opts(["Male", "Female", "Other"])
const YES_NO_OPTS = opts(["Yes", "No"])

const REGION_OPTS = opts([
  "Greater Accra Region",
  "Ashanti Region",
  "Western Region",
  "Central Region",
  "Eastern Region",
  "Volta Region",
  "Northern Region",
  "Upper East Region",
  "Upper West Region",
  "Bono Region",
  "Bono East Region",
  "Ahafo Region",
  "Savannah Region",
  "North East Region",
  "Oti Region",
  "Western North Region",
])

const ASSOCIATION_REGION_OPTS = opts([
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Brong Ahafo",
])

const BUSINESS_SECTORS_SOLE = opts([
  "Agriculture and Agribusiness",
  "Mining and Quarrying",
  "Oil and Gas",
  "ICT",
  "Financial Services",
  "Manufacturing",
  "Tourism and Hospitality",
  "Real Estate and Construction",
  "Transportation and Logistics",
  "Education and Training",
  "Healthcare and Pharmaceuticals",
  "Retail and Wholesale Trade",
  "Media and Entertainment",
  "Renewable Energy",
  "Textiles and Apparel",
  "Fisheries and Aquaculture",
  "Waste Management and Recycling",
  "Cosmetics and Personal Care",
  "Legal and Consultancy Services",
  "Food and Beverage Industry",
  "Other",
])

const BUSINESS_SECTORS_PARTNERSHIP = opts([
  "Legal",
  "Estate/Housing",
  "Media",
  "Transport/Aerospace",
  "Utilities",
  "Education",
  "Shipping & Port",
  "Fashion/Beautification",
  "Tourism",
  "Quarry/Mining",
  "Hospitality",
  "Refinery of Minerals",
  "Insurance",
  "Entertainment",
  "Healthcare",
  "Securities/Brokers",
  "Agriculture",
  "Food Industry",
  "Commerce/Trading",
  "Banking/Finance",
  "Oil/Gas",
  "Manufacturing",
  "Pharmaceutical",
  "Telecom/ICT",
  "Construction",
  "Security",
  "Sanitation",
  "Other",
])

const TITLES_SOLE = opts(["Mr.", "Mrs.", "Miss", "Ms.", "Dr."])
const TITLES_FULL = opts([
  "Mr.",
  "Mrs.",
  "Ms.",
  "Miss",
  "Dr.",
  "Prof.",
  "Rev.",
  "Pastor",
  "Imam",
  "Chief",
  "Hon.",
  "Nana",
])

const OWNERSHIP_TYPES = opts([
  "Owned",
  "Rented",
  "Family Property",
  "Company Property",
  "Government Property",
])

const POSTAL_TYPES = opts(["P.O. Box", "Private Bag", "LMB (Large Mail Box)", "PMB (Private Mail Bag)"])

const EMPLOYMENT_SIZES = opts([
  "1-5 employees",
  "6-10 employees",
  "11-20 employees",
  "21-50 employees",
  "51-100 employees",
  "101-250 employees",
  "251-500 employees",
  "Above 500 employees",
])

const EMPLOYMENT_SIZES_PARTNERSHIP = opts([
  "1-5",
  "6-29",
  "30-99",
  "100+",
])

const REVENUE_RANGES = opts([
  "Below GHS 50,000",
  "GHS 50,000 - 100,000",
  "GHS 100,001 - 250,000",
  "GHS 250,001 - 500,000",
  "GHS 500,001 - 1,000,000",
  "GHS 1,000,001 - 2,500,000",
  "GHS 2,500,001 - 5,000,000",
  "GHS 5,000,001 - 10,000,000",
  "Above GHS 10,000,000",
])

const REVENUE_RANGES_PARTNERSHIP = opts([
  "Below 500,000",
  "500,000 - 2,000,000",
  "2,000,001 - 10,000,000",
  "Above 10,000,000",
])

const BOP_OPTIONS = opts([
  "Apply for BOP Now",
  "Apply for BOP Later",
  "Already have a BOP",
  "Not Required for my business",
])

const BIRTH_TYPES = opts(["Single", "Twin", "Triplet", "Multiple Birth"])
const PLACE_OF_DELIVERY = opts(["Hospital", "Clinic", "Mat Home", "House", "Other"])
const ATTENDANT_AT_BIRTH = opts(["Doctor", "Registered Midwife", "TBA", "Other"])
const EDUCATION_LEVELS = opts([
  "None",
  "Primary",
  "Middle/JHS",
  "Secondary/SHS/Tech Vocational",
  "Tertiary (Teacher Training/Poly/University)",
])
const MARITAL_STATUS = opts(["Married", "Single", "Divorced", "Widowed"])
const RELATIONSHIP_TO_CHILD = opts([
  "Mother",
  "Father",
  "Guardian",
  "Grandparent",
  "Other Relative",
  "Hospital Staff",
  "Other",
])

const BANK_NAMES = opts([
  "GCB Bank PLC",
  "Ecobank Ghana PLC",
  "Absa Bank Ghana",
  "Access Bank Ghana PLC",
  "Fidelity Bank Ghana",
  "Standard Chartered Bank Ghana",
  "Stanbic Bank Ghana",
  "Zenith Bank Ghana",
  "CAL Bank Limited",
  "Republic Bank Ghana",
  "National Investment Bank (NIB)",
  "Prudential Bank Limited",
  "First Atlantic Bank",
  "United Bank for Africa (UBA) Ghana",
])

const ACCOUNT_TYPES = opts(["Current Account", "Savings Account", "Fixed Deposit Account"])
const APPLICANT_TYPES = opts(["Individual", "Sole Proprietor", "Company"])
const CURRENCIES = opts(["GHS - Ghanaian Cedi", "USD - US Dollar", "EUR - Euro", "GBP - British Pound"])
const ID_TYPES = opts(["Passport", "Driver's License", "National ID Card", "Voter's ID"])
const CARD_PREFERENCES = opts([
  "Master Card",
  "Master Card Platinum",
  "Visa Gold",
  "Visa Card",
  "Mobile Banking",
])

const ASSOCIATION_TYPES = opts([
  "Religious Organization",
  "Social Club",
  "Sports Club",
  "Professional Association",
  "Community Group",
  "Cultural Association",
  "Youth Group",
  "Women's Group",
  "Cooperative Society",
  "Other",
])

const MEMBERSHIP_TYPES = opts(["Open Membership", "Restricted Membership", "Invitation Only"])
const GOVERNING_DOCS = opts([
  "Constitution",
  "Articles of Association",
  "Bylaws",
  "Rules and Regulations",
])
const REGISTRATION_PURPOSES = opts([
  "Legal Recognition",
  "Bank Account Opening",
  "Grant Applications",
  "Tax Exemption",
  "Property Acquisition",
  "Other",
])

function companyPersonFields(prefix: string, required = true): ComplianceFieldDef[] {
  return [
    { key: `${prefix}.title`, label: "Title", type: "select", required, options: TITLES_FULL },
    { key: `${prefix}.first_name`, label: "First name", type: "text", required },
    { key: `${prefix}.middle_name`, label: "Middle name", type: "text" },
    { key: `${prefix}.last_name`, label: "Last name", type: "text", required },
    { key: `${prefix}.gender`, label: "Gender", type: "select", required, options: GENDER_OPTS },
    { key: `${prefix}.date_of_birth`, label: "Date of birth", type: "date", required },
    { key: `${prefix}.nationality`, label: "Nationality", type: "text", required },
    { key: `${prefix}.occupation`, label: "Occupation", type: "text", required },
    { key: `${prefix}.tin_number`, label: "TIN number", type: "text" },
    { key: `${prefix}.ghana_card_number`, label: "Ghana Card number", type: "text", required },
    { key: `${prefix}.residential_digital_address`, label: "Residential digital address", type: "text", required },
    { key: `${prefix}.residential_house_number`, label: "Residential house number", type: "text", required },
    { key: `${prefix}.residential_street_name`, label: "Residential street name", type: "text", required },
    { key: `${prefix}.residential_city`, label: "Residential city", type: "text", required },
    { key: `${prefix}.residential_district`, label: "Residential district", type: "text", required },
    {
      key: `${prefix}.residential_region`,
      label: "Residential region",
      type: "select",
      required,
      options: REGION_OPTS,
    },
    { key: `${prefix}.residential_country`, label: "Residential country", type: "text", required },
  ]
}

function associationPersonFields(prefix: string, required = true): ComplianceFieldDef[] {
  return [
    { key: `${prefix}.fullName`, label: "Full name", type: "text", required },
    { key: `${prefix}.dateOfBirth`, label: "Date of birth", type: "date", required },
    { key: `${prefix}.placeOfBirth`, label: "Place of birth", type: "text", required },
    { key: `${prefix}.occupation`, label: "Occupation", type: "text", required },
    { key: `${prefix}.mobileNumber`, label: "Mobile number", type: "phone", required },
    { key: `${prefix}.email`, label: "Email", type: "email" },
    { key: `${prefix}.tinNumber`, label: "TIN number", type: "text" },
    { key: `${prefix}.residentialAddress.houseNumber`, label: "Residential house number", type: "text", required },
    { key: `${prefix}.residentialAddress.streetName`, label: "Residential street name", type: "text", required },
    { key: `${prefix}.residentialAddress.cityDistrict`, label: "Residential city / district", type: "text", required },
    { key: `${prefix}.occupationalAddress.houseNumber`, label: "Occupational house number", type: "text" },
    { key: `${prefix}.occupationalAddress.streetName`, label: "Occupational street name", type: "text" },
    { key: `${prefix}.occupationalAddress.cityDistrict`, label: "Occupational city / district", type: "text" },
  ]
}

function partnerFields(index: number, required = true): ComplianceFieldDef[] {
  const prefix = `partners.${index}`
  return [
    { key: `${prefix}.tin`, label: "TIN", type: "text" },
    { key: `${prefix}.ghanaCard`, label: "Ghana Card number", type: "text", required },
    { key: `${prefix}.title`, label: "Title", type: "select", required, options: TITLES_FULL },
    { key: `${prefix}.firstName`, label: "First name", type: "text", required },
    { key: `${prefix}.middleName`, label: "Middle name", type: "text" },
    { key: `${prefix}.lastName`, label: "Last name", type: "text", required },
    { key: `${prefix}.formerName`, label: "Former name", type: "text" },
    { key: `${prefix}.gender`, label: "Gender", type: "select", required, options: GENDER_OPTS },
    { key: `${prefix}.dateOfBirth`, label: "Date of birth", type: "date", required },
    { key: `${prefix}.nationality`, label: "Nationality", type: "text", required },
    { key: `${prefix}.occupation`, label: "Occupation", type: "text", required },
    { key: `${prefix}.houseNumber`, label: "House number", type: "text", required },
    { key: `${prefix}.streetName`, label: "Street name", type: "text", required },
    { key: `${prefix}.city`, label: "City", type: "text", required },
    { key: `${prefix}.district`, label: "District", type: "text", required },
    { key: `${prefix}.region`, label: "Region", type: "select", required, options: REGION_OPTS },
    { key: `${prefix}.mobileNo1`, label: "Mobile 1", type: "phone", required },
    { key: `${prefix}.mobileNo2`, label: "Mobile 2", type: "phone" },
    { key: `${prefix}.email`, label: "Email", type: "email" },
  ]
}

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
          {
            key: "gender",
            label: "Gender",
            type: "select",
            required: true,
            options: [
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ],
          },
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
          { key: "region", label: "Region", type: "text", required: true },
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
              { value: "employed", label: "Employed" },
              { value: "self-employed", label: "Self-Employed" },
              { value: "business-owner", label: "Business Owner" },
              { value: "unemployed", label: "Unemployed" },
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
          {
            key: "reasonForRegistration",
            label: "Reason for registration",
            type: "select",
            required: true,
            options: [
              { value: "new-employment", label: "New Employment" },
              { value: "business-registration", label: "Business Registration" },
              { value: "tax-compliance", label: "Tax Compliance" },
              { value: "bank-requirement", label: "Bank Requirement" },
              { value: "other", label: "Other" },
            ],
          },
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
        title: "Business information",
        fields: [
          { key: "business_name", label: "Business name", type: "text", required: true },
          { key: "business_name_alt_1", label: "Alternative business name 1", type: "text" },
          { key: "business_name_alt_2", label: "Alternative business name 2", type: "text" },
          { key: "business_name_alt_3", label: "Alternative business name 3", type: "text" },
          { key: "date_of_commencement", label: "Date of commencement", type: "date", required: true },
          {
            key: "nature_of_business",
            label: "Nature of business / sector",
            type: "select",
            required: true,
            options: BUSINESS_SECTORS_SOLE,
          },
          { key: "isic_code_1", label: "ISIC code 1", type: "text" },
          { key: "isic_code_2", label: "ISIC code 2", type: "text" },
          { key: "isic_code_3", label: "ISIC code 3", type: "text" },
          { key: "isic_code_4", label: "ISIC code 4", type: "text" },
          { key: "isic_code_5", label: "ISIC code 5", type: "text" },
          {
            key: "business_description",
            label: "Business description (if ISIC unknown)",
            type: "textarea",
          },
        ],
      },
      {
        title: "Registered address",
        fields: [
          { key: "registered_digital_address", label: "Digital address (GPS)", type: "text", required: true },
          { key: "registered_house_number", label: "House number / building", type: "text", required: true },
          { key: "registered_house_number_2", label: "Building / flat line 2", type: "text" },
          { key: "registered_street_name", label: "Street name", type: "text", required: true },
          { key: "registered_city", label: "City / Town", type: "text", required: true },
          { key: "registered_district", label: "District", type: "text", required: true },
          {
            key: "registered_region",
            label: "Region",
            type: "select",
            required: true,
            options: REGION_OPTS,
          },
          {
            key: "ownership_type",
            label: "Ownership type",
            type: "select",
            required: true,
            options: OWNERSHIP_TYPES,
          },
          { key: "landlord_name", label: "Landlord full name", type: "text" },
        ],
      },
      {
        title: "Principal & other address",
        fields: [
          {
            key: "same_as_registered",
            label: "Principal address same as registered?",
            type: "select",
            options: YES_NO_OPTS,
          },
          { key: "principal_digital_address", label: "Principal digital address", type: "text" },
          { key: "principal_house_number", label: "Principal house number", type: "text" },
          { key: "principal_house_number_2", label: "Principal house number line 2", type: "text" },
          { key: "principal_street_name", label: "Principal street name", type: "text" },
          { key: "principal_street_name_2", label: "Principal street name line 2", type: "text" },
          { key: "principal_city", label: "Principal city", type: "text" },
          { key: "principal_district", label: "Principal district", type: "text" },
          { key: "principal_region", label: "Principal region", type: "select", options: REGION_OPTS },
          { key: "other_digital_address", label: "Other digital address", type: "text" },
          { key: "other_house_number", label: "Other house number", type: "text" },
          { key: "other_house_number_2", label: "Other house number line 2", type: "text" },
          { key: "other_street_name", label: "Other street name", type: "text" },
          { key: "other_street_name_2", label: "Other street name line 2", type: "text" },
          { key: "other_city", label: "Other city", type: "text" },
          { key: "other_district", label: "Other district", type: "text" },
          { key: "other_region", label: "Other region", type: "select", options: REGION_OPTS },
        ],
      },
      {
        title: "Contact information",
        fields: [
          { key: "postal_care_of_1", label: "Postal care of / line 1", type: "text" },
          { key: "postal_care_of_2", label: "Postal address line 2", type: "text" },
          { key: "postal_care_of_3", label: "Postal address line 3", type: "text" },
          { key: "postal_type", label: "Postal type", type: "select", options: POSTAL_TYPES },
          { key: "postal_prefix", label: "Postal prefix", type: "text" },
          { key: "postal_number", label: "Postal number", type: "text" },
          { key: "box_region", label: "Box region", type: "text" },
          { key: "box_town", label: "Box town", type: "text" },
          { key: "box_location", label: "Box location / area", type: "text" },
          { key: "primary_phone", label: "Primary phone", type: "phone", required: true },
          { key: "secondary_phone", label: "Secondary phone", type: "phone" },
          { key: "primary_mobile", label: "Primary mobile", type: "phone", required: true },
          { key: "secondary_mobile", label: "Secondary mobile", type: "phone" },
          { key: "fax_number", label: "Fax number", type: "text" },
          { key: "business_email", label: "Business email", type: "email", required: true },
          { key: "business_website", label: "Business website", type: "text" },
        ],
      },
      {
        title: "Proprietor details",
        fields: [
          { key: "title", label: "Title", type: "select", required: true, options: TITLES_SOLE },
          { key: "first_name", label: "First name", type: "text", required: true },
          { key: "middle_name", label: "Middle name", type: "text" },
          { key: "last_name", label: "Last name / surname", type: "text", required: true },
          { key: "former_name", label: "Former name", type: "text" },
          { key: "gender", label: "Gender", type: "select", required: true, options: GENDER_OPTS },
          { key: "date_of_birth", label: "Date of birth", type: "date", required: true },
          { key: "nationality", label: "Nationality", type: "text", required: true },
          { key: "occupation", label: "Occupation", type: "text", required: true },
          { key: "tin_number", label: "TIN number", type: "text" },
          { key: "ghana_card_number", label: "Ghana Card number", type: "text", required: true },
          {
            key: "residential_digital_address",
            label: "Residential digital address",
            type: "text",
            required: true,
          },
          {
            key: "residential_house_number",
            label: "Residential house number",
            type: "text",
            required: true,
          },
          {
            key: "residential_street_name",
            label: "Residential street name",
            type: "text",
            required: true,
          },
          { key: "residential_city", label: "Residential city", type: "text", required: true },
          { key: "residential_district", label: "Residential district", type: "text", required: true },
          {
            key: "residential_region",
            label: "Residential region",
            type: "select",
            required: true,
            options: REGION_OPTS,
          },
          { key: "residential_country", label: "Residential country", type: "text", required: true },
        ],
      },
      {
        title: "Additional information",
        fields: [
          {
            key: "employment_size",
            label: "Employment size",
            type: "select",
            required: true,
            options: EMPLOYMENT_SIZES,
          },
          {
            key: "revenue_envisaged",
            label: "Revenue envisaged (GHS)",
            type: "select",
            required: true,
            options: REVENUE_RANGES,
          },
          {
            key: "bop_application",
            label: "BOP application",
            type: "select",
            required: true,
            options: BOP_OPTIONS,
          },
          { key: "bop_reference_number", label: "BOP reference number", type: "text" },
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
          { key: "registry_code", label: "Registry code", type: "text" },
          { key: "serial_number", label: "Serial number", type: "text" },
          { key: "child_first_name", label: "Child first name", type: "text", required: true },
          { key: "child_middle_name", label: "Child middle name", type: "text" },
          { key: "child_surname", label: "Child surname", type: "text", required: true },
          { key: "sex", label: "Sex", type: "select", required: true, options: GENDER_OPTS },
          { key: "date_of_birth", label: "Date of birth", type: "date", required: true },
          { key: "nid_number", label: "NID number (if applicable)", type: "text" },
          { key: "type_of_birth", label: "Type of birth", type: "select", options: BIRTH_TYPES },
          {
            key: "place_of_delivery",
            label: "Place of delivery",
            type: "select",
            required: true,
            options: PLACE_OF_DELIVERY,
          },
          { key: "place_of_delivery_other", label: "Place of delivery (other)", type: "text" },
          {
            key: "attendant_at_birth",
            label: "Attendant at birth",
            type: "select",
            options: ATTENDANT_AT_BIRTH,
          },
          { key: "attendant_at_birth_other", label: "Attendant (other)", type: "text" },
        ],
      },
      {
        title: "Place of birth address",
        fields: [
          { key: "hospital_name", label: "Hospital / facility name", type: "text" },
          { key: "house_number", label: "House number", type: "text" },
          { key: "street_name", label: "Street name", type: "text" },
          { key: "town", label: "Town", type: "text", required: true },
          { key: "district", label: "District", type: "text", required: true },
          { key: "region", label: "Region", type: "select", required: true, options: REGION_OPTS },
        ],
      },
      {
        title: "Mother details",
        fields: [
          { key: "mother_first_name", label: "Mother first name", type: "text", required: true },
          { key: "mother_middle_name", label: "Mother middle name", type: "text" },
          { key: "mother_surname", label: "Mother surname", type: "text", required: true },
          { key: "mother_age", label: "Mother age", type: "number" },
          { key: "mother_nationality", label: "Mother nationality", type: "text", required: true },
          { key: "mother_nid", label: "Mother Ghana Card / NID", type: "text", required: true },
          { key: "mother_house_no", label: "Mother house number", type: "text" },
          { key: "mother_street_name", label: "Mother street name", type: "text" },
          { key: "mother_town", label: "Mother town", type: "text" },
          { key: "mother_district", label: "Mother district", type: "text" },
          { key: "mother_region", label: "Mother region", type: "select", options: REGION_OPTS },
          {
            key: "mother_education",
            label: "Mother education",
            type: "select",
            options: EDUCATION_LEVELS,
          },
          {
            key: "mother_marital_status",
            label: "Mother marital status",
            type: "select",
            options: MARITAL_STATUS,
          },
          { key: "mother_occupation", label: "Mother occupation", type: "text" },
          { key: "mother_religion", label: "Mother religion", type: "text" },
          {
            key: "mother_residential_address",
            label: "Mother residential address",
            type: "textarea",
          },
        ],
      },
      {
        title: "Father details",
        fields: [
          { key: "father_first_name", label: "Father first name", type: "text" },
          { key: "father_middle_name", label: "Father middle name", type: "text" },
          { key: "father_surname", label: "Father surname", type: "text" },
          { key: "father_age", label: "Father age", type: "number" },
          { key: "father_nationality", label: "Father nationality", type: "text" },
          { key: "father_nid", label: "Father Ghana Card / NID", type: "text" },
          { key: "father_occupation", label: "Father occupation", type: "text" },
          {
            key: "father_residential_address",
            label: "Father residential address",
            type: "textarea",
          },
        ],
      },
      {
        title: "Informant & notes",
        fields: [
          {
            key: "urgent_processing",
            label: "Urgent processing",
            type: "select",
            options: YES_NO_OPTS,
          },
          { key: "urgency_reason", label: "Urgency reason", type: "textarea" },
          { key: "additional_notes", label: "Additional notes", type: "textarea" },
          { key: "informant_full_name", label: "Informant full name", type: "text", required: true },
          {
            key: "informant_relationship",
            label: "Relationship to child",
            type: "select",
            required: true,
            options: RELATIONSHIP_TO_CHILD,
          },
          { key: "informant_phone", label: "Informant phone", type: "phone", required: true },
          { key: "informant_date", label: "Informant date", type: "date", required: true },
          { key: "informant_address", label: "Informant address", type: "textarea", required: true },
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
          {
            key: "gender",
            label: "Gender",
            type: "select",
            required: true,
            options: GENDER_OPTS_WITH_OTHER,
          },
          { key: "nationality", label: "Nationality", type: "text", required: true },
          { key: "ghana_card_number", label: "Ghana Card number", type: "text", required: true },
          { key: "nid_number", label: "NID number", type: "text" },
          { key: "phone_number", label: "Phone number", type: "phone", required: true },
          { key: "email", label: "Email", type: "email" },
        ],
      },
      {
        title: "Current address",
        fields: [
          {
            key: "current_residential_address",
            label: "Current residential address",
            type: "textarea",
            required: true,
          },
          { key: "current_digital_address", label: "Current digital address", type: "text" },
          { key: "current_city", label: "Current city", type: "text", required: true },
          {
            key: "current_region",
            label: "Current region",
            type: "select",
            required: true,
            options: REGION_OPTS,
          },
          { key: "current_postal_address", label: "Current postal address", type: "text" },
        ],
      },
      {
        title: "Permanent address",
        fields: [
          {
            key: "permanent_residential_address",
            label: "Permanent residential address",
            type: "textarea",
          },
          { key: "permanent_digital_address", label: "Permanent digital address", type: "text" },
          { key: "permanent_city", label: "Permanent city", type: "text" },
          {
            key: "permanent_region",
            label: "Permanent region",
            type: "select",
            options: REGION_OPTS,
          },
          { key: "permanent_postal_address", label: "Permanent postal address", type: "text" },
        ],
      },
      {
        title: "Occupation & emergency",
        fields: [
          { key: "occupation", label: "Occupation", type: "text", required: true },
          { key: "employer_name", label: "Employer name", type: "text" },
          { key: "employer_address", label: "Employer address", type: "textarea" },
          {
            key: "emergency_contact_name",
            label: "Emergency contact name",
            type: "text",
            required: true,
          },
          {
            key: "emergency_contact_relationship",
            label: "Emergency contact relationship",
            type: "text",
            required: true,
          },
          {
            key: "emergency_contact_phone",
            label: "Emergency contact phone",
            type: "phone",
            required: true,
          },
          {
            key: "emergency_contact_address",
            label: "Emergency contact address",
            type: "textarea",
          },
        ],
      },
      {
        title: "Passport details",
        fields: [
          {
            key: "passport_type",
            label: "Passport type",
            type: "select",
            required: true,
            options: opts(["Regular", "Official", "Diplomatic"]),
          },
          { key: "intended_use", label: "Intended use", type: "text" },
          { key: "travel_countries", label: "Travel countries", type: "textarea" },
          { key: "signature_date", label: "Signature date", type: "date" },
          { key: "additional_notes", label: "Additional notes", type: "textarea" },
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
          {
            key: "sectors",
            label: "Business sector (primary)",
            type: "select",
            required: true,
            options: BUSINESS_SECTORS_PARTNERSHIP,
          },
          { key: "otherSector", label: "Other sector (if Other)", type: "text" },
          { key: "isicCodes.0", label: "ISIC code 1", type: "text" },
          { key: "isicCodes.1", label: "ISIC code 2", type: "text" },
          { key: "isicCodes.2", label: "ISIC code 3", type: "text" },
          { key: "isicCodes.3", label: "ISIC code 4", type: "text" },
          { key: "isicCodes.4", label: "ISIC code 5", type: "text" },
          {
            key: "businessDescription",
            label: "Business description",
            type: "textarea",
            required: true,
          },
        ],
      },
      {
        title: "Business address",
        fields: [
          { key: "digitalAddress", label: "Digital address", type: "text", required: true },
          { key: "houseNumber", label: "House number", type: "text", required: true },
          { key: "streetName", label: "Street name", type: "text", required: true },
          { key: "city", label: "City", type: "text", required: true },
          { key: "district", label: "District", type: "text", required: true },
          { key: "region", label: "Region", type: "select", required: true, options: REGION_OPTS },
          {
            key: "sameAsBusinessAddress",
            label: "Registered address same as business?",
            type: "select",
            options: YES_NO_OPTS,
          },
          { key: "registeredDigitalAddress", label: "Registered digital address", type: "text" },
          { key: "registeredHouseNumber", label: "Registered house number", type: "text" },
          { key: "registeredStreetName", label: "Registered street name", type: "text" },
          { key: "registeredCity", label: "Registered city", type: "text" },
          { key: "registeredDistrict", label: "Registered district", type: "text" },
          {
            key: "registeredRegion",
            label: "Registered region",
            type: "select",
            options: REGION_OPTS,
          },
          { key: "otherDigitalAddress", label: "Other digital address", type: "text" },
          { key: "otherStreetName", label: "Other street name", type: "text" },
          { key: "otherCity", label: "Other city", type: "text" },
          { key: "otherDistrict", label: "Other district", type: "text" },
          { key: "otherRegion", label: "Other region", type: "select", options: REGION_OPTS },
        ],
      },
      {
        title: "Contact & postal",
        fields: [
          {
            key: "postalType",
            label: "Postal type",
            type: "select",
            options: opts(["P.O. Box", "Private Bag"]),
          },
          { key: "postalNumber", label: "Postal number", type: "text" },
          { key: "postalTown", label: "Postal town", type: "text" },
          { key: "postalRegion", label: "Postal region", type: "select", options: REGION_OPTS },
          { key: "phoneNo1", label: "Phone number", type: "phone" },
          { key: "mobileNo1", label: "Mobile number", type: "phone", required: true },
          { key: "email", label: "Business email", type: "email" },
          { key: "website", label: "Website", type: "text" },
        ],
      },
      {
        title: "Partner 1",
        fields: partnerFields(0, true),
      },
      {
        title: "Partner 2",
        fields: partnerFields(1, true),
      },
      {
        title: "Charges & BOP",
        fields: [
          { key: "assetDescription", label: "Asset description", type: "textarea" },
          { key: "chargeCreationDate", label: "Charge creation date", type: "date" },
          { key: "chargeAmount", label: "Charge amount", type: "text" },
          {
            key: "employmentSize",
            label: "Employment size",
            type: "select",
            required: true,
            options: EMPLOYMENT_SIZES_PARTNERSHIP,
          },
          {
            key: "revenueEnvisaged",
            label: "Revenue envisaged (GHS)",
            type: "select",
            required: true,
            options: REVENUE_RANGES_PARTNERSHIP,
          },
          {
            key: "partnershipCategory",
            label: "Partnership category",
            type: "select",
            required: true,
            options: opts(["Micro", "Small", "Medium", "Large"]),
          },
          {
            key: "bopRequest",
            label: "Request BOP?",
            type: "select",
            required: true,
            options: YES_NO_OPTS,
          },
          { key: "bopReferenceNo", label: "BOP reference number", type: "text" },
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
          {
            key: "association.associationName",
            label: "Association name",
            type: "text",
            required: true,
          },
          {
            key: "association.associationType",
            label: "Association type",
            type: "select",
            required: true,
            options: ASSOCIATION_TYPES,
          },
          { key: "association.otherType", label: "Other type (if Other)", type: "text" },
          { key: "association.presentedBy", label: "Presented by", type: "text", required: true },
          {
            key: "association.objectives",
            label: "Objectives",
            type: "textarea",
            required: true,
          },
          { key: "association.activities", label: "Activities", type: "textarea", required: true },
          {
            key: "association.digitalAddress",
            label: "Digital address",
            type: "text",
            required: true,
          },
          { key: "association.houseNumber", label: "House number", type: "text", required: true },
          { key: "association.streetName", label: "Street name", type: "text", required: true },
          {
            key: "association.cityDistrict",
            label: "City / District",
            type: "text",
            required: true,
          },
          {
            key: "association.region",
            label: "Region",
            type: "select",
            required: true,
            options: ASSOCIATION_REGION_OPTS,
          },
          {
            key: "association.contactInfo",
            label: "Contact phone / email",
            type: "text",
            required: true,
          },
          {
            key: "association.membershipType",
            label: "Membership type",
            type: "select",
            required: true,
            options: MEMBERSHIP_TYPES,
          },
          {
            key: "association.initialMembers",
            label: "Initial members count",
            type: "text",
            required: true,
          },
          {
            key: "association.governingDocument",
            label: "Governing document",
            type: "select",
            required: true,
            options: GOVERNING_DOCS,
          },
          {
            key: "association.registrationPurpose",
            label: "Registration purpose",
            type: "select",
            required: true,
            options: REGISTRATION_PURPOSES,
          },
          { key: "association.membershipFees", label: "Membership fees", type: "text" },
          { key: "association.fundingSources", label: "Funding sources", type: "textarea" },
          { key: "association.expectedBudget", label: "Expected budget", type: "text" },
        ],
      },
      { title: "Founder 1", fields: associationPersonFields("founder1", true) },
      { title: "Founder 2", fields: associationPersonFields("founder2", true) },
      { title: "Founder 3", fields: associationPersonFields("founder3", true) },
      { title: "Chairperson", fields: associationPersonFields("chairperson", true) },
      { title: "Secretary", fields: associationPersonFields("secretary", true) },
    ],
    required_images: [
      { key: "founder1_signature", label: "Founder 1 signature", required: true },
      { key: "founder1_ghana_card_front", label: "Founder 1 Ghana Card (front)", required: true },
      { key: "founder1_ghana_card_back", label: "Founder 1 Ghana Card (back)", required: true },
      { key: "founder2_signature", label: "Founder 2 signature", required: true },
      { key: "founder2_ghana_card_front", label: "Founder 2 Ghana Card (front)", required: true },
      { key: "founder2_ghana_card_back", label: "Founder 2 Ghana Card (back)", required: true },
      { key: "founder3_signature", label: "Founder 3 signature", required: true },
      { key: "founder3_ghana_card_front", label: "Founder 3 Ghana Card (front)", required: true },
      { key: "founder3_ghana_card_back", label: "Founder 3 Ghana Card (back)", required: true },
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
          { key: "presented_by", label: "Presented by", type: "text", required: true },
          {
            key: "nature_of_business",
            label: "Nature of business",
            type: "select",
            required: true,
            options: BUSINESS_SECTORS_SOLE,
          },
          { key: "objectives", label: "Objectives", type: "textarea", required: true },
          { key: "stated_capital", label: "Stated capital (GHS)", type: "number", required: true },
          { key: "digital_address", label: "Digital address", type: "text", required: true },
          { key: "house_number", label: "House number", type: "text", required: true },
          { key: "street_name", label: "Street name", type: "text", required: true },
          { key: "city_district", label: "City / District", type: "text", required: true },
          { key: "contact_info", label: "Contact info", type: "text", required: true },
          {
            key: "employment_size",
            label: "Employment size",
            type: "select",
            required: true,
            options: EMPLOYMENT_SIZES,
          },
          {
            key: "revenue_envisaged",
            label: "Revenue envisaged (GHS)",
            type: "select",
            required: true,
            options: REVENUE_RANGES,
          },
          {
            key: "bop_application",
            label: "BOP application",
            type: "select",
            required: true,
            options: BOP_OPTIONS,
          },
          { key: "bop_reference_number", label: "BOP reference number", type: "text" },
        ],
      },
      { title: "Director 1", fields: companyPersonFields("director1", true) },
      { title: "Director 2", fields: companyPersonFields("director2", true) },
      { title: "Secretary", fields: companyPersonFields("secretary", true) },
      { title: "Subscriber 1", fields: companyPersonFields("subscriber1", true) },
      { title: "Subscriber 2", fields: companyPersonFields("subscriber2", true) },
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
      { key: "subscriber1_signature", label: "Subscriber 1 signature", required: true },
      { key: "subscriber1_ghana_card_front", label: "Subscriber 1 Ghana Card (front)", required: true },
      { key: "subscriber1_ghana_card_back", label: "Subscriber 1 Ghana Card (back)", required: true },
      { key: "subscriber2_signature", label: "Subscriber 2 signature", required: true },
      { key: "subscriber2_ghana_card_front", label: "Subscriber 2 Ghana Card (front)", required: true },
      { key: "subscriber2_ghana_card_back", label: "Subscriber 2 Ghana Card (back)", required: true },
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
            options: BANK_NAMES,
          },
          {
            key: "applicant_type",
            label: "Applicant type",
            type: "select",
            required: true,
            options: APPLICANT_TYPES,
          },
          {
            key: "account_type",
            label: "Account type",
            type: "select",
            required: true,
            options: ACCOUNT_TYPES,
          },
          {
            key: "currency",
            label: "Currency",
            type: "select",
            required: true,
            options: CURRENCIES,
          },
          {
            key: "purpose_of_account",
            label: "Purpose of account",
            type: "textarea",
            required: true,
          },
          { key: "branch", label: "Preferred branch", type: "text", required: true },
        ],
      },
      {
        title: "Business details",
        fields: [
          { key: "company_name", label: "Company name", type: "text" },
          { key: "registration_number", label: "Registration number", type: "text" },
          { key: "jurisdiction", label: "Jurisdiction", type: "text" },
          { key: "incorporation_date", label: "Incorporation date", type: "date" },
          { key: "source_of_funds", label: "Source of funds", type: "text" },
          { key: "business_type", label: "Business type", type: "text" },
          { key: "sector", label: "Sector", type: "text" },
          { key: "business_address", label: "Business address", type: "textarea" },
          { key: "business_email", label: "Business email", type: "email" },
          { key: "business_phone1", label: "Business phone 1", type: "phone" },
          { key: "business_phone2", label: "Business phone 2", type: "phone" },
          { key: "tin", label: "TIN", type: "text" },
          { key: "annual_turnover", label: "Annual turnover", type: "text" },
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
          { key: "residence_permit", label: "Residence permit", type: "text" },
          {
            key: "id_type",
            label: "ID type",
            type: "select",
            required: true,
            options: ID_TYPES,
          },
          { key: "id_number", label: "ID number", type: "text", required: true },
          { key: "id_issue_date", label: "ID issue date", type: "date" },
          { key: "id_expiry_date", label: "ID expiry date", type: "date" },
          { key: "id_place_issue", label: "ID place of issue", type: "text" },
          {
            key: "us_citizen",
            label: "US citizen?",
            type: "select",
            options: YES_NO_OPTS,
          },
          { key: "us_address", label: "US address", type: "textarea" },
          {
            key: "residential_address",
            label: "Residential address",
            type: "textarea",
            required: true,
          },
          { key: "landmark", label: "Landmark", type: "text" },
          { key: "city", label: "City", type: "text", required: true },
          { key: "region", label: "Region", type: "text", required: true },
          { key: "phone1", label: "Phone 1", type: "phone", required: true },
          { key: "phone2", label: "Phone 2", type: "phone" },
        ],
      },
      {
        title: "Declarations & risk",
        fields: [
          { key: "ubo_company_name", label: "UBO company name", type: "text" },
          {
            key: "credit_disclosure",
            label: "Credit disclosure accepted?",
            type: "select",
            required: true,
            options: YES_NO_OPTS,
          },
          {
            key: "general_declaration",
            label: "General declaration accepted?",
            type: "select",
            required: true,
            options: YES_NO_OPTS,
          },
          {
            key: "risk_profile",
            label: "Risk profile",
            type: "select",
            options: opts(["Low", "Medium", "High"]),
          },
          { key: "pep", label: "Politically exposed person?", type: "select", options: YES_NO_OPTS },
          {
            key: "pep_details",
            label: "PEP details (name / position)",
            type: "textarea",
            placeholder: "Name and position if PEP",
          },
        ],
      },
      {
        title: "Cards & banking services",
        fields: [
          {
            key: "card_pickup",
            label: "Card pickup",
            type: "select",
            options: opts(["Pick up at Bank", "Delivery"]),
          },
          { key: "card_delivery_address", label: "Card delivery address", type: "textarea" },
          {
            key: "card_preferences",
            label: "Card preferences",
            type: "select",
            options: CARD_PREFERENCES,
          },
          {
            key: "internet_banking",
            label: "Internet banking?",
            type: "select",
            options: YES_NO_OPTS,
          },
          { key: "preferred_username", label: "Preferred username", type: "text" },
          { key: "cheque_book", label: "Cheque book?", type: "select", options: YES_NO_OPTS },
          {
            key: "email_statement",
            label: "Email statement?",
            type: "select",
            options: YES_NO_OPTS,
          },
          { key: "statement_frequency", label: "Statement frequency", type: "text" },
          { key: "sms_alert", label: "SMS alert?", type: "select", options: YES_NO_OPTS },
          { key: "email_alert_frequency", label: "Email alert frequency", type: "text" },
          { key: "mandate_account_name", label: "Mandate account name", type: "text" },
          { key: "mandate_authorization", label: "Mandate authorization", type: "textarea" },
          { key: "signatory_specification", label: "Signatory specification", type: "text" },
          { key: "cheque_confirm", label: "Cheque confirm", type: "text" },
          { key: "confirmation_threshold", label: "Confirmation threshold", type: "text" },
        ],
      },
      {
        title: "Signatory details",
        fields: [
          { key: "signatory_surname", label: "Signatory surname", type: "text", required: true },
          {
            key: "signatory_firstname",
            label: "Signatory first name",
            type: "text",
            required: true,
          },
          { key: "signatory_othername", label: "Signatory other name", type: "text" },
          { key: "signatory_class", label: "Class of signatory", type: "text" },
          {
            key: "signatory_id_type",
            label: "Signatory ID type",
            type: "select",
            options: ID_TYPES,
          },
          { key: "signatory_id_number", label: "Signatory ID number", type: "text" },
          { key: "signatory_phone", label: "Signatory phone", type: "phone" },
          { key: "signatory_address", label: "Signatory address", type: "textarea" },
        ],
      },
      {
        title: "Reference",
        fields: [
          { key: "referee_name", label: "Referee name", type: "text", required: true },
          { key: "referee_address", label: "Referee address", type: "textarea", required: true },
          {
            key: "reference_applicant_name",
            label: "Applicant name (as known to referee)",
            type: "text",
            required: true,
          },
          { key: "referee_bank", label: "Referee bank name", type: "text" },
          { key: "referee_account", label: "Referee account number", type: "text" },
          { key: "referee_branch", label: "Referee bank branch", type: "text" },
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

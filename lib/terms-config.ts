/** Shared constants and catalog for /terms — keep in sync with agent dashboard offerings */

export const TERMS_EFFECTIVE_DATE = "20 May 2026"
export const TERMS_LAST_UPDATED = "20 May 2026"
export const TERMS_VERSION = "4.0"

export const PLATFORM_ENTRY_FEE_MANUAL = 47
export const PLATFORM_ENTRY_FEE_PAYSTACK = 50
export const PLATFORM_WALLET_CREDIT = 5

export const SUPPORT = {
  whatsappTechnical: "+233 242 799 990",
  whatsappProfile: "+233 551 999 901",
  email: "sales.dataflex@gmail.com",
  hours: "6:00 AM – 9:30 PM (GMT, Accra), Monday – Sunday",
} as const

export const TERMS_NAV = [
  { id: "overview", label: "Platform Overview" },
  { id: "platform-fit", label: "Who Should Register" },
  { id: "fees", label: "Entry Fee (Non-Refundable)" },
  { id: "services", label: "Services & Add-Ons" },
  { id: "registration", label: "Agent Registration" },
  { id: "profile-service", label: "Free CV / Profile" },
  { id: "wallet", label: "Wallet & Withdrawals" },
  { id: "agent-rules", label: "Agent Rules" },
  { id: "commission", label: "Commissions" },
  { id: "data-delivery", label: "Data Delivery" },
  { id: "reporting", label: "Issue Reporting" },
  { id: "order-process", label: "How to Order" },
  { id: "data-policy", label: "Data Sales Policy" },
  { id: "payment-integration", label: "Payment Approach" },
  { id: "account-management", label: "Account & Security" },
  { id: "platform-responsibilities", label: "Platform Limits" },
  { id: "usage-rules", label: "Usage Rules" },
  { id: "dispute-resolution", label: "Disputes" },
  { id: "privacy-policy", label: "Privacy" },
  { id: "cookie-policy", label: "Cookies" },
  { id: "contact", label: "Contact" },
] as const

/** Agent dashboard + public add-on verticals — each title appears once */
export const PLATFORM_SERVICE_GROUPS = [
  {
    title: "Connectivity & data",
    items: [
      "Bulk data bundles (MTN, AirtelTigo, Telecel)",
      "Single and bulk data orders",
      "MTN AFA registration",
    ],
  },
  {
    title: "Referrals, storefront & earnings",
    items: [
      "Referral Hub (white-label storefront & QR)",
      "Referral Services (50+ service categories)",
      "Referral Program (invite agents & earn)",
      "Referral chat and order tracking",
      "Commissions and withdrawals",
    ],
  },
  {
    title: "Commerce & digital products",
    items: [
      "Wholesale marketplace",
      "Publish products for wholesale",
      "Vouchers, routers & digital products",
      "Fashion Avenue (projects & referrals)",
      "Agent subscriptions",
    ],
  },
  {
    title: "Property, savings & investment",
    items: [
      "Promote properties (earn commissions)",
      "Publish properties for sale or rent",
      "Savings plans and progress tracking",
    ],
  },
  {
    title: "Education & professional",
    items: [
      "Online courses",
      "Dataflex teaching channels",
      "Compliance & business registration forms",
      "Professional writing (CV, resume, profiles)",
      "Free executive profile / CV benefit for approved agents",
      "Job opportunities board",
    ],
  },
  {
    title: "Public add-on platforms (refer & earn)",
    items: [
      "Salon bookings & beauty services",
      "Apple Service Center inquiries",
      "Domestic workers placement",
      "Blogs & content",
      "Document & government services (ID, business, tax, property, banking, education categories via inquiry flows)",
    ],
  },
  {
    title: "Wallet & payments",
    items: [
      "Wallet top-ups and balance payments",
      "Wallet funding rewards (qualifying amounts)",
      "Manual Mobile Money and wallet checkout",
    ],
  },
] as const

export const NON_REFUNDABLE_STATEMENTS = [
  "The platform entry fee (GH₵47 manual / GH₵50 via Paystack) is strictly non-refundable under any circumstances.",
  "No refunds for account suspension due to terms violations.",
  "No refunds for voluntary account closure.",
  "No refunds of entry fees or outstanding commissions when promotion rules are violated.",
  "Failed data orders on ineligible SIM types (see Agent Rules) are not refundable.",
] as const

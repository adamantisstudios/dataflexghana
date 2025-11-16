// This file provides detailed logging for tracking agent menu benefits, performance, and platform interactions

/**
 * Detailed Agent Menu Items Configuration with Benefits Breakdown
 * Each menu item represents a distinct earning opportunity with comprehensive descriptions
 */
export const AGENT_MENU_ITEMS = [
  {
    id: "ges-books",
    title: "GES Approved Books & Educational Materials",
    icon: "Book",
    color: "from-blue-600 to-indigo-600",
    description: "Sell GES-certified textbooks, stationery, and educational materials",
    fullDescription: `
      Sell authentic GES-approved textbooks, school stationery, uniforms, and educational materials 
      to students and parents across Ghana. Access wholesale prices and earn high commissions per sale.
      This is a passive income opportunity as many parents actively seek reliable sources for school materials.
    `,
    benefits: [
      "Earn ₵50-₵500 per transaction",
      "Wholesale pricing for bulk purchases",
      "Nationwide doorstep delivery",
      "GES certification guarantee",
      "High-demand products",
      "Recurring customer base",
      "No inventory requirements",
      "Support materials provided",
    ],
    targetAudience: [
      "Parents seeking school supplies",
      "Students buying textbooks",
      "Schools ordering materials",
      "Educational institutions",
    ],
    monthlyPotential: "₵500-₵2000",
    requirements: ["None - free to join", "Access to WhatsApp/phone", "Basic product knowledge"],
  },
  {
    id: "verified-jobs",
    title: "Verified Job Opportunities & Employment Portal",
    icon: "Briefcase",
    color: "from-green-600 to-emerald-600",
    description: "Connect job seekers with verified employers - 100% FREE with zero agency fees",
    fullDescription: `
      Help friends, relatives, and colleagues find verified employment with credible employers across Ghana.
      100% FREE job search support with NO AGENCY FEES. Earn referral commissions when successful placements happen.
      Features remote jobs, corporate positions, casual labor, and domestic work from trusted companies.
      No salary deductions after landing job - completely transparent process.
    `,
    benefits: [
      "100% FREE job search support",
      "Zero agency fees (our unique advantage)",
      "Verified employers only",
      "Multiple job categories",
      "Remote work opportunities",
      "Referral commission earnings",
      "No salary deductions",
      "Interview preparation support",
      "Job matching algorithm",
      "24/7 customer support",
    ],
    targetAudience: [
      "Unemployed job seekers",
      "Students seeking part-time work",
      "Fresh graduates",
      "Career switchers",
      "Domestic workers",
      "Casual laborers",
    ],
    monthlyPotential: "₵200-₵1500",
    requirements: ["Passion for helping others find jobs", "Good communication skills", "Access to social media"],
  },
  {
    id: "business-registration",
    title: "Business Registration & Compliance Services",
    icon: "Building",
    color: "from-orange-600 to-red-600",
    description: "Help businesses legalize operations online - Earn ₵80-₵130 per registration",
    fullDescription: `
      Assist friends, relatives, colleagues, and businesses to register legally online without paperwork or queues.
      Earn ₵80-₵130 commission per successful registration. Services include sole proprietorship, partnership, 
      company registration, and business compliance. 100% secured government-approved process with nationwide delivery.
      Waiting period: 14 working days. This is highly profitable with minimal effort as many businesses need legalization.
    `,
    benefits: [
      "Earn ₵80-₵130 per registration",
      "100% online (no paperwork)",
      "No queues or office visits",
      "Free nationwide delivery",
      "Government approved process",
      "14-day turnaround",
      "100% secured transactions",
      "Multiple business types",
      "Professional support included",
      "Real-time tracking system",
    ],
    targetAudience: [
      "Entrepreneurs",
      "Small business owners",
      "Solo proprietors",
      "Partnership businesses",
      "Limited companies",
      "Associations",
      "NGOs",
    ],
    monthlyPotential: "₵400-₵2000+",
    requirements: [
      "Ability to explain registration process",
      "Basic knowledge of business types",
      "Access to phone/WhatsApp",
    ],
  },
  {
    id: "wholesale-shopping",
    title: "Wholesale Shopping & Dropshipping",
    icon: "ShoppingCart",
    color: "from-purple-600 to-pink-600",
    description: "Buy wholesale and resell for profit - Create your own e-commerce business",
    fullDescription: `
      Access wholesale products from verified suppliers across Ghana at drastically reduced prices.
      Buy in bulk and resell at retail prices to earn 30-50% profit margins. Features dropshipping capabilities,
      doorstep delivery nationwide, and flexible order quantities. Perfect for starting a side business with minimal capital.
      No inventory holding required - suppliers handle delivery directly to customers.
    `,
    benefits: [
      "Wholesale pricing (30-50% savings)",
      "Doorstep delivery nationwide",
      "Dropshipping available",
      "No inventory holding",
      "Verified suppliers",
      "Flexible quantities",
      "Fast delivery times",
      "Quality guarantee",
      "Multiple product categories",
      "Competitive pricing",
    ],
    targetAudience: [
      "Resellers",
      "Entrepreneurs",
      "E-commerce sellers",
      "Small business owners",
      "Shop owners",
      "Online traders",
    ],
    monthlyPotential: "₵300-₵3000+",
    requirements: ["Initial capital for purchases", "Basic customer service skills", "Access to delivery network"],
  },
  {
    id: "digital-vouchers",
    title: "Digital Vouchers & Educational Cards",
    icon: "Gift",
    color: "from-pink-600 to-rose-600",
    description: "Sell educational cards & vouchers - Earn high commissions (₵50-₵4000)",
    fullDescription: `
      Sell high-value digital educational vouchers, results checker cards (BECE, WASSCE, ABCE), 
      school forms, subscription services, and gift cards. Earn substantial commissions ranging from ₵50 to ₵4000 per sale.
      Instant digital delivery via email or WhatsApp - no physical inventory needed. Perfect for passive income
      as products are delivered automatically. Zero registration required from customers.
    `,
    benefits: [
      "Earn ₵50-₵4000 per transaction",
      "Instant digital delivery",
      "No physical inventory",
      "Multiple product types",
      "Email/WhatsApp delivery",
      "Passive income opportunity",
      "No customer registration needed",
      "Year-round demand",
      "High-value transactions",
      "Automated fulfillment",
    ],
    targetAudience: [
      "Students checking exam results",
      "School applicants",
      "Gift purchasers",
      "Educators",
      "Parents",
      "Businesses (bulk gift cards)",
    ],
    monthlyPotential: "₵500-₵2500",
    requirements: ["Digital delivery system access", "Customer communication skills", "Product knowledge"],
  },
  {
    id: "mentorship-channels",
    title: "Teacher Mentorship & Learning Channels",
    icon: "Users",
    color: "from-teal-600 to-cyan-600",
    description: "Connect learners with mentors - Build passive income through education",
    fullDescription: `
      Join teacher-led mentorship channels and professional learning communities. Connect students and professionals
      with experienced mentors, educators, and career coaches. Earn referral commissions when successful connections
      lead to paid mentorship relationships. This creates a sustainable passive income stream while helping people
      develop skills, advance careers, and achieve educational goals. Access to exclusive teaching channels platform.
    `,
    benefits: [
      "Referral commission earnings",
      "Passive income from mentorships",
      "Help people develop skills",
      "Build professional network",
      "Access to teaching channels",
      "Multiple mentor categories",
      "Long-term earning potential",
      "Flexible participation",
      "Professional development",
      "Community building",
    ],
    targetAudience: [
      "Students seeking tutors",
      "Career changers",
      "Professionals seeking coaches",
      "Skill learners",
      "Business consultees",
      "Personal development seekers",
    ],
    monthlyPotential: "₵200-₵1500",
    requirements: ["Network building skills", "Understanding of mentorship value", "Professional communication"],
  },
]

/**
 * Agent Menu Benefits Summary for SEO and Marketing
 */
export const AGENT_BENEFITS_SUMMARY = {
  earnings: {
    dailyPotential: "₵700+",
    monthlyRange: "₵2000-₵10000+",
    incomeStreams: 6,
    description: "Multiple income streams combining commissions, markups, and referrals",
  },
  flexibility: {
    hoursPerWeek: "Flexible (part-time to full-time)",
    location: "Work from anywhere in Ghana",
    requirements: "No experience needed",
    description: "Start immediately with zero downtime",
  },
  support: {
    availability: "24/7 WhatsApp & Phone Support",
    training: "Comprehensive onboarding included",
    community: "2500+ active agents nationwide",
    resources: "Marketing materials and guides provided",
  },
  services: [
    "GES Approved Books (₵50-₵500 per sale)",
    "Verified Jobs (Referral commissions)",
    "Business Registration (₵80-₵130 per registration)",
    "Wholesale Shopping (30-50% profit margins)",
    "Digital Vouchers (₵50-₵4000 per sale)",
    "Mentorship Channels (Referral earnings)",
  ],
}

/**
 * SEO-Optimized Menu Item Descriptions for Search Engine Ranking
 */
export const SEO_MENU_DESCRIPTIONS = {
  "ges-books":
    "Earn commissions selling GES-approved books in Ghana. Perfect side gig earning ₵50-₵500 per transaction. Help students access quality educational materials while building passive income.",
  "verified-jobs":
    "100% free job search support in Ghana with zero agency fees. Earn referral commissions connecting job seekers with verified employers. No hidden charges or salary deductions.",
  "business-registration":
    "Help businesses register online in Ghana and earn ₵80-₵130 commission per registration. 100% secured government process with 14-day delivery. No paperwork or queues needed.",
  "wholesale-shopping":
    "Buy wholesale products in Ghana and resell for 30-50% profit. Dropshipping available with doorstep delivery nationwide. Start e-commerce with minimal capital.",
  "digital-vouchers":
    "Sell educational cards and gift vouchers earning ₵50-₵4000 per transaction. Instant digital delivery with no inventory needed. Perfect passive income opportunity.",
  "mentorship-channels":
    "Connect learners with professional mentors and earn referral commissions. Build passive income while helping students and professionals achieve their goals.",
}

/**
 * Platform Channels Overview for SEO
 */
export const PLATFORM_CHANNELS = {
  educational: {
    name: "Educational Excellence Channel",
    description: "Learn from certified teachers, tutors, and educational mentors",
    benefits: ["Study tips", "Exam preparation", "Career guidance", "Subject tutoring"],
  },
  business: {
    name: "Business Growth Channel",
    description: "Connect with successful entrepreneurs and business mentors",
    benefits: ["Business strategies", "Startup guidance", "Marketing tips", "Financial advice"],
  },
  career: {
    name: "Career Development Channel",
    description: "Professional mentors sharing career advancement strategies",
    benefits: ["Career planning", "Interview skills", "Networking", "Job search support"],
  },
  skills: {
    name: "Skills Development Channel",
    description: "Learn in-demand skills from industry professionals",
    benefits: ["Technical skills", "Soft skills", "Certifications", "Practical training"],
  },
}

/**
 * Logging function for agent interactions and menu engagement
 */
export function logAgentMenuInteraction(
  agentId: string,
  menuItem: string,
  action: "view" | "click" | "engage" | "earn",
  metadata?: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    agentId,
    menuItem,
    action,
    metadata: {
      ...metadata,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      location: typeof window !== "undefined" ? window.location.pathname : "unknown",
    },
  }

  console.log("[DataFlex Agent Menu] ", JSON.stringify(logEntry, null, 2))

  // In production, this would send to analytics service
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", `agent_menu_${action}`, {
      agent_id: agentId,
      menu_item: menuItem,
      ...metadata,
    })
  }
}

/**
 * Get menu item details with full SEO-optimized descriptions
 */
export function getMenuItemWithDetails(menuItemId: string) {
  const item = AGENT_MENU_ITEMS.find((m) => m.id === menuItemId)
  if (!item) return null

  return {
    ...item,
    seoDescription: SEO_MENU_DESCRIPTIONS[menuItemId as keyof typeof SEO_MENU_DESCRIPTIONS],
    benefits: AGENT_MENU_ITEMS.find((m) => m.id === menuItemId)?.benefits || [],
  }
}

/**
 * Generate comprehensive platform overview for marketing
 */
export function generatePlatformOverview(): string {
  const itemsText = AGENT_MENU_ITEMS.map(
    (item) => `
${item.title}:
- Earn: ${item.monthlyPotential}/month
- Benefits: ${item.benefits.slice(0, 3).join(", ")}
- Target Audience: ${item.targetAudience.slice(0, 2).join(", ")}
  `,
  ).join("\n")

  return `
DataFlex Multi-Service Earning Platform - Complete Overview
=========================================================

Total Income Streams: ${AGENT_MENU_ITEMS.length}
Daily Earning Potential: ${AGENT_BENEFITS_SUMMARY.earnings.dailyPotential}
Monthly Range: ${AGENT_BENEFITS_SUMMARY.earnings.monthlyRange}

Menu Items:
${itemsText}

Platform Channels:
${Object.entries(PLATFORM_CHANNELS)
  .map(([, channel]) => `- ${channel.name}: ${channel.description}`)
  .join("\n")}

Features:
${AGENT_BENEFITS_SUMMARY.support.availability}
${AGENT_BENEFITS_SUMMARY.support.community} agents nationwide
${AGENT_BENEFITS_SUMMARY.support.training}
  `
}

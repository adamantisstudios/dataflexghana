import type { Metadata } from "next"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { DevConsoleDetector } from "@/components/dev-console-detector"
import { MenuScrollHandler } from "@/components/menu-scroll-handler"

// 🚀 EXTENDED SEO KEYWORDS – Now covering ALL business segments
const seoKeywords = [
  // ========== ORIGINAL KEYWORDS (TIER 1‑30) – KEPT INTACT ==========
  // Core Dataflex Ghana Brand Keywords (Tier 1)
  "Dataflex Ghana",
  "Dataflex Ghana affiliate program",
  "Dataflex Ghana remote jobs",
  "Dataflex Ghana online jobs",
  "Dataflex Ghana earn money",
  "Dataflex Ghana commissions",
  "Dataflex Ghana work from home",
  "Dataflex Ghana promoter program",
  "Dataflex Ghana student jobs",
  "Dataflex Ghana login",
  "Dataflex Ghana sign up",
  "Dataflex Ghana registration",
  "Dataflex Ghana income",
  "Dataflex Ghana opportunity",
  "Dataflex Ghana reviews",

  // Primary Money-Making Keywords (Tier 2)
  "Earn money online Ghana",
  "Make money online Ghana",
  "Earn daily online Ghana",
  "Daily income jobs Ghana",
  "Online work Ghana",
  "Online jobs Ghana",
  "Work from home Ghana",
  "Remote jobs Ghana",
  "Ghana commission jobs",
  "Ghana online earning",
  "Ghana affiliate marketing",
  "Ghana digital marketing jobs",
  "Ghana online business",
  "Ghana remote workers",
  "Ghana earn at home",

  // Youth & Student-Focused Keywords (Tier 3)
  "Ghana youth jobs online",
  "Ghana online hustle",
  "Ghana side hustle",
  "Ghana online money making",
  "Best online jobs Ghana",
  "Remote jobs no experience Ghana",
  "Remote youth jobs Ghana",
  "Student jobs online Ghana",
  "SHS graduate online jobs Ghana",
  "University student online jobs Ghana",
  "Earn money while studying Ghana",
  "Ghana online part-time jobs",
  "Ghana online gigs",
  "Online work for beginners Ghana",
  "Ghana online student jobs",
  "Ghana remote internship online",

  // Phone & Mobile-Based Work (Tier 4)
  "Work with your phone Ghana",
  "Smartphone jobs Ghana",
  "Phone-based work Ghana",
  "Ghana online tasks",
  "Ghana online micro jobs",
  "Ghana mobile job platform",
  "Ghana phone income jobs",
  "Earn daily Ghana with phone",
  "Ghana mobile earning systems",
  "Ghana smartphone earners",
  "Mobile promoters Ghana",
  "Promote with your phone Ghana",

  // High Income & Daily Earnings Keywords
  "Earn 700 cedis a day Ghana",
  "How to earn 700 cedis Ghana",
  "Ghana daily cashout online",
  "Ghana momo earnings",
  "Mobile money jobs Ghana",
  "Ghana daily momo jobs",
  "Ghana daily bank transfer jobs",
  "Ghana commission payout daily",
  "Ghana quick commission online",
  "Earn daily commissions Ghana",
  "Earn daily 700 cedis Ghana",
  "Ghana daily online earnings",
  "Ghana fast online income",
  "Ghana quick earning ideas",
  "Ghana easy online income",

  // Social Media-Based Earning (Tier 5)
  "Social media jobs Ghana",
  "Social media earning Ghana",
  "Facebook jobs Ghana",
  "WhatsApp jobs Ghana",
  "WhatsApp status promotions Ghana",
  "WhatsApp advertising Ghana",
  "TikTok promotion Ghana",
  "TikTok influencer Ghana",
  "Instagram promoter Ghana",
  "Ghana influencer jobs",
  "Digital influencer Ghana",
  "Online promoter Ghana",
  "Digital promoter Ghana",
  "Earn money with Facebook Ghana",
  "Earn money with WhatsApp Ghana",
  "Earn money on TikTok Ghana",
  "Social media assistant Ghana",
  "Social media operations Ghana",
  "Earn via social media Ghana",
  "Social media hustle Ghana",
  "Ghana online influencer programs",

  // Affiliate & Referral Marketing (Tier 6)
  "Online promoter Ghana",
  "Digital marketing Ghana",
  "Affiliate marketing Ghana",
  "Ghana affiliate programs",
  "Ghana high paying affiliate programs",
  "Ghana affiliate commissions",
  "Referral marketing Ghana",
  "Referral programs Ghana",
  "Ghana link sharing jobs",
  "Earn money sharing links Ghana",
  "Share and earn Ghana",
  "Promote services Ghana",
  "Promote businesses Ghana",
  "Online business promotion Ghana",
  "Service promotion jobs Ghana",
  "Commission promotion Ghana",
  "Paid promotions Ghana",
  "Affiliate referrals Ghana",
  "Affiliate marketing jobs Ghana",
  "Ghana affiliate partner earnings",
  "Ghana earning partner system",

  // Online Marketing & Promotion (Tier 7)
  "Online ad sharing Ghana",
  "Online ad posting Ghana",
  "Posting ads for money Ghana",
  "Ghana online ad sharing",
  "Ghana online ad posting",
  "Posting ads Ghana online",
  "Online advertising Ghana",
  "Digital advertising Ghana",
  "Ghana online advertising",
  "Online promoter Ghana",
  "Promote products and earn Ghana",
  "Earn through promotions Ghana",
  "Digital marketing affiliate Ghana",
  "Best affiliate sites Ghana",
  "Affiliate marketplace Ghana",

  // Link & Traffic Generation (Tier 8)
  "Ghana digital link promotion",
  "Online traffic generation Ghana",
  "Social media traffic jobs Ghana",
  "Ghana link clicks earning",
  "Earn per link click Ghana",
  "Earn per share Ghana",
  "Link posting jobs Ghana",
  "Ghana link promotion jobs",
  "Promote links Ghana",

  // Sales & E-commerce (Tier 9)
  "Digital sales Ghana",
  "Digital selling Ghana",
  "Online sales jobs Ghana",
  "Online sales promoter Ghana",
  "Virtual sales Ghana",
  "Sell online Ghana",
  "Sell services online Ghana",
  "Sell digital products Ghana",
  "Promote digital products Ghana",
  "Ghana online store promoter",
  "E-commerce promoter Ghana",
  "Online sales funnel Ghana",
  "Sales funnel affiliate Ghana",
  "Commission funnel Ghana",
  "Online sales strategy Ghana",
  "Ghana remote marketing strategy",
  "Ghana remote digital workplace",
  "Ghana digital online shops",

  // Business Promotion (Tier 10)
  "Promote Ghana services",
  "Promote local businesses Ghana",
  "Promote SME businesses Ghana",
  "Ghana SME promoters",
  "Ghana business promoters",
  "Ghana local service promoters",
  "Ghana online business agents",
  "Ghana online referral marketers",
  "Online marketing agents Ghana",
  "Ghana online business job",
  "Ghana business earning systems",
  "Ghana business promotions online",

  // Digital Agents & Representatives (Tier 11)
  "Ghana digital agents",
  "Digital agents wanted Ghana",
  "Ghana online agents",
  "Ghana sales agents online",
  "Promote websites for money Ghana",
  "Earn digital commissions Ghana",
  "Affiliate worker Ghana",
  "Referral earner Ghana",
  "Ghana online referral agents",
  "Ghana virtual agents",
  "Ghana digital contractors",
  "Ghana online brand promoters",
  "Virtual brand promoter Ghana",
  "Digital brand promoter Ghana",
  "Online brand ambassador Ghana",

  // Freelance & Remote Work (Tier 12)
  "Ghana freelance online jobs",
  "Ghana online freelancing",
  "Freelance promoter Ghana",
  "Freelance marketer Ghana",
  "Digital freelance Ghana",
  "Best remote work Ghana",
  "Remote work for students Ghana",
  "Ghana remote work seekers",
  "Work from home business Ghana",
  "Home freelancing Ghana",
  "Ghana home jobs online",
  "Stay at home jobs Ghana",
  "Earn money at home Ghana",
  "Earn from home Ghana",
  "Work without leaving home Ghana",

  // Influencer & Content Creator Jobs (Tier 13)
  "Online influencer work Ghana",
  "Micro influencer Ghana",
  "Paid influencer Ghana",
  "Ghana TikTok earning jobs",
  "Ghana Instagram earning jobs",
  "Ghana Facebook selling jobs",
  "Facebook affiliate Ghana",
  "WhatsApp affiliate Ghana",
  "WhatsApp earning Ghana",
  "Paid marketer Ghana",
  "Promote online courses Ghana",
  "Ghana e-learning promotions",
  "Digital training affiliate Ghana",
  "Ghana online digital coaching",
  "Ghana digital creator earnings",

  // Data & Information Sales (Tier 14)
  "Ghana online data jobs",
  "Online survey jobs Ghana",
  "Paid survey jobs Ghana",
  "Ghana social media research jobs",
  "Social monitoring jobs Ghana",
  "Online data entry Ghana",
  "Ghana online typing jobs",
  "Best typing jobs Ghana",
  "Ghana online tasks jobs",

  // Data Bundles & Mobile Services (Tier 15)
  "Data bundles Ghana",
  "Buy data Ghana",
  "Data airtime Ghana",
  "MTN data Ghana",
  "AirtelTigo data Ghana",
  "Telecel data Ghana",
  "Ghana data reseller",
  "Sell data Ghana",
  "Data distribution Ghana",
  "Ghana mobile data jobs",
  "Data sales Ghana",
  "Online data purchase Ghana",
  "Affordable data Ghana",
  "Data subscription Ghana",

  // Admin & Support Roles (Tier 16)
  "Ghana remote admin jobs",
  "Online moderator jobs Ghana",
  "Ghana community moderator",
  "Online assistant Ghana",
  "Virtual PA Ghana",
  "Customer support online Ghana",
  "Remote support Ghana",
  "Online customer service Ghana",
  "Ghana online admin",
  "Digital assistant Ghana",
  "Virtual support jobs Ghana",
  "Ghana online support jobs",

  // Education & Training (Tier 17)
  "Online education promoter Ghana",
  "Online coaching jobs Ghana",
  "Digital coach Ghana",
  "Online income trainer Ghana",
  "Online earning education Ghana",
  "Online learning platform Ghana",
  "Ghana online education jobs",
  "Ghana e-learning jobs",
  "Online digital training Ghana",

  // Event & Campaign Management (Tier 18)
  "Online events promoter Ghana",
  "Event marketing Ghana online",
  "Commission event promotion Ghana",
  "Ghana messenger marketing",
  "WhatsApp broadcast promotions Ghana",
  "Ghana broadcast list promotions",
  "Paid online campaigns Ghana",
  "Digital customer acquisition Ghana",
  "Ghana digital promoter network",

  // Gig Economy & Hustling (Tier 19)
  "Ghana gig economy online",
  "Digital hustler Ghana",
  "Ghana internet hustle",
  "Internet business ideas Ghana",
  "Online gig worker Ghana",
  "Best side jobs Ghana",
  "Ghana online gig jobs",
  "Ghana side gig online",
  "Ghana online opportunity seekers",

  // E-commerce & Wholesale (Tier 20)
  "Wholesale shopping Ghana",
  "Ghana wholesale online",
  "Wholesale prices Ghana",
  "Dropshipping Ghana",
  "Ghana dropship online",
  "Online marketplace jobs Ghana",
  "Ghana e-commerce assistant",
  "Ghana online product support",
  "Ghana online marketing support",
  "Social media selling Ghana",
  "Ghana social commerce jobs",
  "Digital expansion Ghana",

  // Business Registration & Services (Tier 21)
  "Business registration Ghana",
  "Register business Ghana",
  "Company registration Ghana online",
  "Ghana business formation",
  "Promote Ghana startups",
  "Promote Ghana SMEs",
  "Ghana business services",
  "Business compliance Ghana",
  "Ghana business solutions",
  "Ghana regulatory services",
  "Ghana business registration agent",
  "Business agent Ghana",

  // Payments & Wallets (Tier 22)
  "Ghana momo payments",
  "Mobile money Ghana",
  "Ghana digital payments",
  "Ghana payment platform",
  "Bank transfer Ghana",
  "Online payment Ghana",
  "Wallet topup Ghana",
  "Ghana digital wallet",
  "Electronic payment Ghana",

  // Passive Income & Investment (Tier 23)
  "Make passive income Ghana",
  "Passive income online Ghana",
  "Online passive income Ghana",
  "Ghana digital passive earnings",
  "Earn on autopilot Ghana",
  "Passive online business Ghana",
  "Online wealth building Ghana",
  "Earn consistently online Ghana",
  "Ghana online financial freedom",
  "Ghana earn without investment",
  "Online earning without investment Ghana",
  "No investment online earning Ghana",

  // Zero Capital & No Experience (Tier 24)
  "Ghana zero-capital jobs",
  "No investment online earning Ghana",
  "No experience online jobs Ghana",
  "Work at home no experience Ghana",
  "Ghana online opportunity hub",
  "Best Ghana earning method",

  // Leading Platforms & Marketplaces (Tier 25)
  "Best earning websites Ghana",
  "Ghana earning website review",
  "Earning platform Ghana",
  "Online earning platform Ghana",
  "Ghana online income site",
  "Ghana earning site",
  "Online paying platforms Ghana",
  "Ghana digital profit system",
  "Ghana digital marketplace",
  "Online digital expansion Ghana",
  "Ghana digital marketplace opportunities",
  "Best Ghana digital platforms",

  // Success Stories & Methods (Tier 26)
  "How to earn quick money Ghana",
  "Ghana extra income jobs",
  "Ghana digital career",
  "Ghana online income community",
  "Ghana earn by sharing",
  "How to make money in Ghana online",
  "Ghana 2025 online jobs",
  "High demand online jobs Ghana",
  "Ghana high income online",
  "Ghana earn with creativity",
  "Ghana digital-forward jobs",
  "Ghana online income revolution",

  // Promotional & Marketing Roles (Tier 27)
  "Promote affiliate links Ghana",
  "Ghana online link sharing",
  "Ghana commission group online",
  "Advertiser jobs online Ghana",
  "Ghana online digital salespeople",
  "Online outreach Ghana",
  "Ghana digital outreach jobs",
  "Online campaign promoter Ghana",
  "Campaign marketing Ghana",
  "Promote offers for pay Ghana",
  "Ghana online promoter network",
  "Ghana online promoter jobs",
  "Ghana online agents network",
  "Ghana digital work-from-home",
  "Ghana remote work Ghana",

  // Trust & Legitimacy (Tier 28)
  "Ghana legitimate online work",
  "Ghana no scam online jobs",
  "Ethical online work Ghana",
  "Legit online income Ghana",
  "Ghana make money legit",
  "Ghana verified earning jobs",
  "Trusted online earning Ghana",
  "Safe online earning Ghana",
  "Ghana secure online work",

  // Technology & Skills (Tier 29)
  "Ghana digital marketing skills",
  "Ghana online technical jobs",
  "Ghana coding jobs online",
  "Ghana web design jobs",
  "Ghana digital skills training",
  "Ghana online skill development",
  "Ghana remote tech jobs",
  "Ghana IT online jobs",
  "Ghana tech career Ghana",

  // Community & Networks (Tier 30)
  "Ghana online earning groups",
  "Ghana digital workers",
  "Ghana commission earners",
  "Ghana online seller community",
  "Ghana digital hustlers network",
  "Ghana earning partner system",
  "Digital remote seller Ghana",
  "Ghana online partnership programs",
  "Ghana online opportunity hub",

  // Additional Long-Tail & High-Intent Keywords (Tier 31+)
  "Dataflex Ghana agent signup",
  "Dataflex Ghana registration process",
  "Dataflex Ghana how to earn",
  "Dataflex Ghana commission structure",
  "Dataflex Ghana withdrawal process",
  "Dataflex Ghana customer support",
  "Ghana data bundle reseller",
  "Ghana best online earning opportunity",
  "Ghana fastest way to earn online",
  "Ghana legitimate work from home",
  "Ghana verified remote jobs",
  "Ghana online job search",
  "Ghana student earning opportunity",
  "Ghana youth employment online",
  "Ghana job portal",
  "Ghana careers online",
  "Ghana professional network",
  "Ghana business network",
  "Ghana start online business",
  "Ghana online entrepreneurship",
  "Ghana entrepreneurship opportunity",
  "Ghana digital economy",
  "Ghana online marketplace",
  "Ghana e-commerce platform",
  "Ghana shopping online",
  "Ghana online retail",
  "Ghana digital retail",
  "Ghana services marketplace",
  "Ghana online services",
  "Ghana digital services",
  "Ghana freelancer marketplace",
  "Ghana gig marketplace",
  "Ghana task marketplace",
  "Ghana promotion agency",
  "Ghana marketing agency online",
  "Ghana digital agency",
  "Ghana online advertising platform",
  "Ghana social media platform",
  "Ghana digital platform",
  "Ghana online community",
  "Ghana digital community",
  "Ghana online network",
  "Ghana professional community",
  "Ghana business community",
  "Ghana entrepreneur community",
  "Ghana wellness program",
  "Ghana income programs",
  "Ghana earning schemes",
  "Ghana referral scheme",
  "Ghana bonus program",
  "Ghana reward program",
  "Ghana incentive program",
  "Ghana commission scheme",
  "Ghana earning structure",
  "Ghana online payments Ghana",
  "Ghana digital finance",
  "Ghana financial services",
  "Ghana banking services",
  "Ghana mobile banking",
  "Ghana digital banking",
  "Ghana fintech",
  "Ghana financial technology",
  "Ghana money management",
  "Ghana personal finance",
  "Ghana money tips",
  "Ghana earning tips",
  "Ghana success stories",
  "Ghana testimonials",
  "Ghana case studies",
  "Ghana user reviews",
  "Ghana platform reviews",
  "Ghana service reviews",
  "Ghana trust and safety",
  "Ghana data security",
  "Ghana privacy policy",
  "Ghana terms and conditions",
  "Ghana legal compliance",
  "Ghana regulatory",
  "Ghana support team",
  "Ghana customer service",
  "Ghana help center",
  "Ghana FAQ",
  "Ghana guides",
  "Ghana tutorials",
  "Ghana training",
  "Ghana education",
  "Ghana learning resources",
  "Ghana mentorship",
  "Ghana coaching",
  "Ghana consulting",
  "Ghana advisory services",
  "Ghana business coaching",
  "Ghana career coaching",
  "Ghana personal development",
  "Ghana skill building",
  "Ghana professional growth",
  "Ghana career advancement",
  "Ghana income growth",
  "Ghana wealth creation",
  "Ghana financial independence",
  "Ghana early retirement",
  "Ghana financial freedom",
  "Ghana secure future",
  "Ghana family income",
  "Ghana household income",
  "Ghana alternative income",
  "Ghana supplementary income",
  "Ghana additional income",
  "Ghana main income",
  "Ghana primary income",
  "Ghana sole income",
  "Ghana full-time equivalent",
  "Ghana part-time work",
  "Ghana flexible work",
  "Ghana schedule flexibility",
  "Ghana time management",
  "Ghana work-life balance",
  "Ghana working hours",
  "Ghana shift work",
  "Ghana flexible schedule",
  "Ghana work remotely",
  "Ghana work from anywhere",
  "Ghana work from bed",
  "Ghana work from office",
  "Ghana work from cafe",
  "Ghana location independent",
  "Ghana geographic flexibility",
  "Ghana UK work",
  "Ghana USA work",
  "Ghana Canada work",
  "Ghana Australia work",
  "Ghana international work",
  "Ghana foreign work",
  "Ghana cross-border work",
  "Ghana global work",
  "Ghana worldwide opportunities",
  "Ghana multicultural",
  "Ghana diverse",
  "Ghana inclusive",
  "Ghana equal opportunity",
  "Ghana equal pay",
  "Ghana fair wages",
  "Ghana competitive rates",
  "Ghana market rates",

  // ========== 🚀 NEWLY ADDED KEYWORDS – Data Bundles & Services ==========
  // MTN Data Bundles specific
  "MTN data bundles Ghana",
  "MTN data bundle prices Ghana",
  "Buy MTN data cheap Ghana",
  "MTN data reseller Ghana",
  "MTN data agent Ghana",
  "MTN 1GB price Ghana",
  "MTN 2GB price Ghana",
  "MTN 3GB price Ghana",
  "MTN 5GB price Ghana",
  "MTN 10GB price Ghana",
  "MTN 20GB price Ghana",
  "MTN 100GB price Ghana",
  "MTN Ghana data deals",
  "MTN Ghana affordable data",
  "MTN Ghana internet bundles",
  "MTN Ghana data subscription",
  "Cheap MTN data Ghana 2025",

  // AirtelTigo Data Bundles
  "AirtelTigo data bundles Ghana",
  "AirtelTigo data prices Ghana",
  "AirtelTigo data reseller",
  "Buy AirtelTigo data Ghana",
  "AirtelTigo cheap data",
  "AirtelTigo data agent",
  "AirtelTigo internet bundle Ghana",

  // Telecel Data Bundles
  "Telecel data bundles Ghana",
  "Telecel data prices Ghana",
  "Telecel data reseller",
  "Buy Telecel data Ghana",
  "Telecel cheap data",
  "Telecel data agent",
  "Telecel data deals Ghana",

  // Agent data pricing
  "Agent data prices Ghana",
  "DataFlex agent data prices",
  "DataFlex agent MTN data",
  "DataFlex agent AirtelTigo data",
  "DataFlex agent Telecel data",
  "Agent only data bundles Ghana",
  "Cheapest agent data Ghana",
  "Wholesale data prices Ghana",
  "Data reseller platform Ghana",
  "DataFlex Ghana data bundles",
  "DataFlex MTN data agent price",
  "DataFlex AirtelTigo agent price",
  "DataFlex Telecel agent price",

  // Additional services from the new list
  "Business registration Ghana agent",
  "Business promotion and advertising Ghana",
  "Wholesale and dropshipping Ghana agent",
  "Job recruitment opportunities Ghana",
  "Educational products Ghana agent",
  "School forms Ghana agent",
  "GES approved books and stationery agent",
  "ECG digital payment services Ghana",
  "Gift cards and voucher services Ghana",
  "Apple device repairs Ghana agent",
  "Domestic worker recruitment Ghana agent",
  "Teacher and educational services agent",
  "Nationwide agent opportunities Ghana",
  "DataFlex Ghana agent services list",

  // Derived high‑intent keywords
  "Cheap data for agents Ghana",
  "Agents data price list Ghana",
  "Data bundle agent commission Ghana",
  "Make money selling data Ghana",
  "Sell MTN data and earn Ghana",
  "Sell AirtelTigo data and earn Ghana",
  "Sell Telecel data and earn Ghana",
  "Become data reseller Ghana",
  "Data distribution business Ghana",
  "Data sales business Ghana",
  "Data bundle dropshipping Ghana",
  "Mobile data wholesale Ghana",
  "Ghana data bundle supplier",
  "DataFlex data reseller program",
  "DataFlex wholesale data",
  "DataFlex Ghana data prices today",
  "DataFlex Ghana all services",
  "DataFlex Ghana business registration price",
  "DataFlex Ghana GES books price",
  "DataFlex Ghana Apple repair",
  "DataFlex Ghana domestic worker",
  "DataFlex Ghana teacher services",
  "DataFlex Ghana ECG payment",
  "DataFlex Ghana gift cards",
  "DataFlex Ghana voucher services",
  "DataFlex Ghana agent commission list",
  "DataFlex Ghana affiliate data",
  "DataFlex Ghana data bundle agent signup",

  // Extra location & “near me”
  "Data bundles Accra",
  "Data bundles Kumasi",
  "Data bundles Tamale",
  "Data bundles Takoradi",
  "Agent data near me Ghana",
  "Data reseller near me Ghana",
  "MTN data agent near me Ghana",
  "AirtelTigo data agent near me Ghana",
  "Telecel data agent near me Ghana",
  "Cheap data near me Ghana",
  "Buy data bundles online Ghana",
  "Instant data delivery Ghana",
  "Fast data delivery Ghana",
  "Data bundle website Ghana",
  "Data bundle app Ghana",

  // More commercial keywords
  "Best data bundle platform Ghana",
  "Data bundle comparison Ghana",
  "Data bundle price list Ghana 2025",
  "Data bundle promo Ghana",
  "Data bundle discount Ghana",
  "Data bundle loyalty program Ghana",
  "DataFlex Ghana daily data offer",
  "DataFlex Ghana bulk data",
  "DataFlex Ghana corporate data",
  "DataFlex Ghana SME data",
  "DataFlex Ghana family data plan",
  "DataFlex Ghana student data plan",
  "DataFlex Ghana unlimited data",
  "DataFlex Ghana 4G data",
  "DataFlex Ghana 5G data",
  "DataFlex Ghana data share",
  "DataFlex Ghana gift data",
  "DataFlex Ghana airtime reseller",
  "Airtime reseller Ghana",
  "Sell airtime Ghana",
  "Airtime and data agent Ghana",
  "Mobile money and data agent Ghana",
  "Momo and data agent Ghana",
  "Digital vouchers Ghana agent",
  "School forms and results checker Ghana",
  "BECE results checker agent",
  "WASSCE results checker agent",
  "ABCE results checker agent",
  "Results checker voucher Ghana",
  "Educational vouchers Ghana",
  "ECG bills payment agent Ghana",
  "Water bills payment agent Ghana",
  "Ghana digital payments agent",
  "Ghana Apple repair service agent",
  "Ghana iPhone repair agent",
  "Ghana iPad repair agent",
  "Ghana MacBook repair agent",
  "Domestic worker agency Ghana",
  "Domestic helper recruitment Ghana",
  "House help agent Ghana",
  "Nanny agent Ghana",
  "Garden boy agent Ghana",
  "Teacher recruitment Ghana agent",
  "Tutoring services agent Ghana",
  "GES books distribution agent",
  "School stationery agent Ghana",
  "Textbook agent Ghana",
  "Educational products reseller Ghana",

  // NEW high‑volume earn keywords
  "Earn 200 cedis daily Ghana",
  "Earn 300 cedis daily Ghana",
  "Earn 500 cedis daily Ghana",
  "Earn 800 cedis daily Ghana",
  "Earn 1000 cedis daily Ghana",
  "Earn 1500 cedis daily Ghana",
  "Daily income 200 cedis Ghana",
  "Daily income 300 cedis Ghana",
  "Daily income 500 cedis Ghana",
  "Daily income 800 cedis Ghana",
  "Make 200 cedis a day Ghana",
  "Make 500 cedis a day Ghana",
  "Make 700 cedis a day Ghana",
  "Make 1000 cedis a day Ghana",

  // More agent network & recruitment
  "DataFlex Ghana agent recruitment",
  "DataFlex Ghana agent login portal",
  "DataFlex Ghana agent dashboard",
  "DataFlex Ghana agent earnings",
  "DataFlex Ghana agent withdrawal",
  "DataFlex Ghana agent testimonial",
  "DataFlex Ghana agent success story",
  "DataFlex Ghana agent review",
  "DataFlex Ghana agent registration free",
  "DataFlex Ghana agent cost",
  "DataFlex Ghana agent training",
  "DataFlex Ghana agent support group",
  "DataFlex Ghana agent WhatsApp group",

  // Financial freedom & side hustle
  "Side hustle Ghana 2025",
  "Best side hustle Ghana 2025",
  "Online side hustle Ghana 2025",
  "Financial freedom Ghana",
  "Wealth creation Ghana online",
  "Multiple income streams Ghana",
  "Passive income ideas Ghana 2025",
  "Investment opportunity Ghana online",
  "No capital business Ghana online",

  // Trust & scam aware
  "Is DataFlex Ghana legit",
  "DataFlex Ghana scam or legit",
  "DataFlex Ghana review 2025",
  "DataFlex Ghana payment proof",
  "DataFlex Ghana payout proof",
  "DataFlex Ghana trustpilot",
  "DataFlex Ghana rating",
  "DataFlex Ghana complaints",
  "DataFlex Ghana customer service number",

  // Long‑tail combiners
  "DataFlex Ghana MTN data agent price 1GB",
  "DataFlex Ghana MTN data agent price 2GB",
  "DataFlex Ghana MTN data agent price 5GB",
  "DataFlex Ghana MTN data agent price 10GB",
  "DataFlex Ghana AirtelTigo data agent price",
  "DataFlex Ghana Telecel data agent price",
  "DataFlex Ghana business registration commission",
  "DataFlex Ghana GES book commission",
  "DataFlex Ghana Apple repair commission",
  "DataFlex Ghana domestic worker commission",
  "DataFlex Ghana teacher service commission",
  "DataFlex Ghana ECG payment commission",
  "DataFlex Ghana gift card commission",
  "DataFlex Ghana voucher commission",
  "DataFlex Ghana wholesale commission",
  "DataFlex Ghana job recruitment commission",
  "DataFlex Ghana all commissions list",

].join(", ")

// Export metadata with upgraded fields
export const metadata: Metadata = {
  title:
    "DataFlex Agents Ghana - Earn ₵700+ Daily | MTN/AirtelTigo/Telecel Data Bundles, GES Books, Business Registration & More Services",
  description:
    "Become a DataFlex agent in Ghana: access agent‑only MTN, AirtelTigo & Telecel data bundles (e.g., 1GB ₵3.70, 10GB ₵40.50). Earn commissions on data, GES‑approved books, verified job placements, business registration, wholesale/dropshipping, digital vouchers, Apple repairs, domestic worker recruitment, teacher services & more. ₵200‑₵800 daily potential. Zero agency fees. Join 200+ companies on the platform.",
  keywords: seoKeywords,
  authors: [{ name: "DataFlex Ghana - Adamantis Solutions" }],
  creator: "DataFlex Ghana",
  publisher: "DataFlex Agents Platform",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1, notranslate",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://dataflexghana.com",
    siteName: "DataFlex Agents Ghana - MTN, AirtelTigo, Telecel Data & Multiple Income Streams",
    title:
      "DataFlex Agents Ghana - Agent‑Only Data Prices | ₵700+ Daily Earnings | 6+ Services",
    description:
      "🇬🇭 Get agent‑only MTN, AirtelTigo & Telecel data prices (1GB from ₵3.70) on DataFlex. Also earn from GES books, business registration, wholesale, digital vouchers, jobs & more. Start your online business without capital. Join 200+ companies trusting our platform! 💰",
    images: [
      {
        url: "https://dataflexghana.com/images/social-previewone.jpg",
        width: 1200,
        height: 630,
        alt: "DataFlex Ghana – Agent‑Only Data Bundles & Multi‑Service Commissions",
        type: "image/jpeg",
      },
      {
        url: "https://dataflexghana.com/images/hero-main.jpg",
        width: 800,
        height: 600,
        alt: "DataFlex: MTN, AirtelTigo, Telecel data bundles + GES books, business registration, jobs, wholesale & more",
        type: "image/jpeg",
      },
      {
        url: "https://dataflexghana.com/images/agent-data-pricing.jpg",
        width: 1200,
        height: 630,
        alt: "Agent‑Only MTN Data Prices: 1GB ₵3.70, 2GB ₵8.80, 5GB ₵22.50, 10GB ₵40.50 on DataFlex Ghana",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DataFlexGhana",
    creator: "@DataFlexGhana",
    title:
      "🇬🇭 Agent‑Only MTN Data: 1GB ₵3.70 | Earn ₵700+ Daily | DataFlex Ghana (AirtelTigo, Telecel, GES Books, Business Reg)",
    description:
      "💰 DataFlex agent prices: MTN 1GB ₵3.70, 2GB ₵8.80, 5GB ₵22.50, 10GB ₵40.50. Also AirtelTigo, Telecel data. Earn commissions promoting GES books, business registration, wholesale, jobs & more! ✅ No scams, instant delivery. #DataFlexGhana #MTNData #CheapData",
    images: [
      {
        url: "https://dataflexghana.com/images/social-previewone.jpg",
        alt: "DataFlex Agent Data Bundles & Multi‑Service Earnings",
      },
    ],
  },
  alternates: {
    canonical: "https://dataflexghana.com",
  },
  other: {
    "geo.region": "GH",
    "geo.placename": "Ghana",
    "geo.position": "7.9465;-1.0232",
    ICBM: "7.9465, -1.0232",
    "apple-mobile-web-app-title": "DataFlex Agents",
    "application-name": "DataFlex Agents",
    "msapplication-TileColor": "#10b981",
    "msapplication-config": "/browserconfig.xml",
    "format-detection": "telephone=yes, email=yes, address=yes",
    // Additional meta for pricing/service pages
    "priceCurrency": "GHS",
    "product:price:amount": "3.70",
    "product:price:currency": "GHS",
    "og:price:amount": "3.70",
    "og:price:currency": "GHS",
  },
  generator: "Next.js",
  category: "Business & Finance | Employment | Education | Digital Economy | Telecommunications",
  classification:
    "Multi‑Service Platform | Data Reseller | Earning Platform | Job Portal | Business Registration | Educational Materials | Digital Vouchers | Apple Repair | Domestic Worker Recruitment | Teacher Services",
}

// Enhanced JSON-LD structured data
export const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DataFlex Agents Ghana",
  url: "https://dataflexghana.com",
  logo: "https://dataflexghana.com/images/dataflex-logo.png",
  description:
    "Multi-service earning platform in Ghana offering agent‑only data bundles (MTN, AirtelTigo, Telecel), GES‑approved books, business registration, wholesale/dropshipping, digital vouchers, and more.",
  sameAs: [
    "https://facebook.com/dataflexghana",
    "https://twitter.com/dataflexghana",
    "https://instagram.com/dataflexghana",
  ],
  address: {
    "@type": "PostalAddress",
    addressCountry: "GH",
    addressRegion: "Greater Accra",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    telephone: "+233-55-199-9901",
  },
}

// 🚀 AGENT DATA PRICING COMPONENT – SEO-friendly markup inserted directly
function AgentDataPricing() {
  return (
    <section
      aria-label="Agent Data Pricing"
      style={{
        display: "none", // visually hidden but accessible to search engines
      }}
    >
      <h2>🚀 DATAFLEX GHANA AGENT DATA PRICING 🚀</h2>
      <h3>🔥 AGENT ONLY PRICES</h3>
      <p>
        Get access to cheaper MTN, AirtelTigo &amp; Telecel bundles on the DataFlex Ghana
        platform.
      </p>
      <ul>
        <li>⚡ Fast &amp; Instant Delivery</li>
        <li>💰 Bigger Commissions Daily</li>
        <li>📈 Build Your Own Online Business</li>
        <li>🇬🇭 Trusted Nationwide Platform</li>
      </ul>
      <p>🔥 Over 200+ Companies are working with us on the platform.</p>
      <p>
        💸 Many hardworking and aggressive agents are making between GHS 200 to GHS 800
        DAILY promoting services through DataFlex Ghana.
      </p>
      <p>
        ⚠️ Don&apos;t make peanuts buying and selling only data bundles daily...
      </p>
      <p>
        💼 Make REAL MONEY by promoting useful services to friends, family, workers,
        students, churches, schools, businesses and people around you — and cash out BIG
        daily.
      </p>
      <h3>📶 MTN DATA BUNDLES</h3>
      <ul>
        <li>1GB — GHS 3.70</li>
        <li>2GB — GHS 8.80</li>
        <li>3GB — GHS 12.90</li>
        <li>4GB — GHS 16.90</li>
        <li>5GB — GHS 22.50</li>
        <li>6GB — GHS 25.90</li>
        <li>7GB — GHS 31.00</li>
        <li>8GB — GHS 34.20</li>
        <li>10GB — GHS 40.50</li>
        <li>15GB — GHS 59.00</li>
        <li>20GB — GHS 79.00</li>
        <li>25GB — GHS 99.00</li>
        <li>30GB — GHS 119.00</li>
        <li>40GB — GHS 157.90</li>
        <li>50GB — GHS 197.00</li>
        <li>100GB — GHS 399.00</li>
      </ul>
      <h3>💼 PROMOTE & EARN FROM THESE SERVICES ON DATAFLEX GHANA</h3>
		<ul>
		  <li>✅ Cheap Data Bundles — MTN, AirtelTigo &amp; Telecel</li>
		  <li>✅ Business Registration &amp; Compliance Services</li>
		  <li>✅ Business Promotion &amp; Advertising</li>
		  <li>✅ Wholesale &amp; Dropshipping Services</li>
		  <li>✅ Job Recruitment Opportunities</li>
		  <li>✅ School Forms &amp; Admission Processing</li>
		  <li>✅ GES Approved Books &amp; Stationery</li>
		  <li>✅ ECG &amp; Digital Payment Services</li>
		  <li>✅ Gift Cards &amp; Voucher Services</li>
		  <li>✅ Apple Device Repairs — iPhone, iPad, MacBook</li>
		  <li>✅ Domestic Worker Recruitment</li>
		  <li>✅ Teacher &amp; Educational Services</li>
		  <li>✅ Fashion &amp; Beauty Services</li>
		  <li>✅ Candidate Search Portal</li>
		  <li>✅ Salon &amp; Beauty Bookings</li>
		  <li>✅ Product Promotion &amp; Commissions</li>
		  <li>✅ Free Marketing Training</li>
		  <li>✅ Nationwide Agent Opportunities</li>
		</ul>
      <h3>🎯 Want to become an agent and start earning?</h3>
      <p>
        👉 Register Here:{" "}
        <a href="https://www.dataflexghana.com/agent/registration-payment">
          https://www.dataflexghana.com/agent/registration-payment
        </a>
      </p>
      <h3>🛒 Don’t want to register yet?</h3>
      <p>
        Order directly here:{" "}
        <a href="https://dataflexghana.com/no-registration">
          https://dataflexghana.com/no-registration
        </a>
      </p>
      <p>📞 Fast Support • Instant Delivery • Trusted Platform</p>
      <p>
        #DataFlexGhana #MTNData #CheapData #AgentBusiness #SideHustle #OnlineBusiness
        #MakeMoneyOnline
      </p>
    </section>
  )
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#10b981" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=yes, email=yes, address=yes" />

        {/* Additional SEO Meta Tags */}
        <meta name="author" content="DataFlex Ghana - Adamantis Solutions" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="referrer" content="origin-when-cross-origin" />

        {/* Enhanced Open Graph Tags */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:updated_time" content="2025-05-12T10:00:00Z" />

        {/* Additional Twitter Card Tags */}
        <meta name="twitter:domain" content="dataflexghana.com" />
        <meta name="twitter:url" content="https://dataflexghana.com" />
        <meta name="twitter:label1" content="Data Bundles" />
        <meta name="twitter:data1" content="MTN, AirtelTigo, Telecel" />
        <meta name="twitter:label2" content="Agent Price" />
        <meta name="twitter:data2" content="1GB ₵3.70" />

        {/* LinkedIn Specific Tags */}
        <meta property="og:see_also" content="https://agentwelcome.netlify.app/" />

        {/* Mobile App Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />

        {/* Favicon and Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/images/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/logo.png" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <link rel="shortcut icon" href="/images/logo.png" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
          }
          body.fonts-loaded {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
          }
        `}</style>

        {/* 🚀 UPGRADED Structured Data – now includes all services, data prices, FAQs */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://dataflexghana.com/#organization",
                  name: "DataFlex Agents Ghana",
                  alternateName: ["DataFlex", "Adamantis Solutions", "DataFlex Ghana Platform"],
                  url: "https://dataflexghana.com",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://dataflexghana.com/images/logo.png",
                    width: 200,
                    height: 200,
                  },
                  image: {
                    "@type": "ImageObject",
                    url: "https://dataflexghana.com/images/social-previewone.jpg",
                    width: 1200,
                    height: 630,
                  },
                  description:
                    "Ghana's premier multi-service platform enabling agents to earn ₵700+ daily through MTN, AirtelTigo & Telecel data bundles (agent‑only prices), GES‑approved educational services, verified job placements, business registration, wholesale shopping, digital vouchers, Apple repairs, domestic worker recruitment, and mentorship channels. Zero agency fees with transparent commission structures.",
                  slogan: "Ghana's Multi-Service Platform to Earn Money with Multiple Income Streams",
                  contactPoint: [
                    {
                      "@type": "ContactPoint",
                      telephone: "+233-55-199-9901",
                      contactType: "customer service",
                      areaServed: "GH",
                      availableLanguage: ["English", "Twi", "Akan"],
                      hoursAvailable: {
                        "@type": "OpeningHoursSpecification",
                        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        opens: "06:00",
                        closes: "23:00",
                      },
                    },
                    {
                      "@type": "ContactPoint",
                      contactType: "WhatsApp Support",
                      url: "https://wa.me/233242799990",
                      areaServed: "GH",
                    },
                  ],
                  address: {
                    "@type": "PostalAddress",
                    addressCountry: "GH",
                    addressRegion: "Greater Accra",
                    addressLocality: "Accra",
                  },
                  sameAs: [
                    "https://employers.nofeejobs.com/",
                  ],
                  foundingDate: "2023",
                  numberOfEmployees: "50-200",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://dataflexghana.com/#website",
                  url: "https://dataflexghana.com",
                  name: "DataFlex Agents Ghana - Agent‑Only Data Bundles & Multi-Service Earnings",
                  description:
                    "Join DataFlex: access agent‑only MTN, AirtelTigo & Telecel data prices (1GB from ₵3.70). Earn commissions on data, GES books, business registration, wholesale, jobs, digital vouchers, Apple repairs, domestic help & more. Perfect for side income. Start earning today!",
                  publisher: {
                    "@id": "https://dataflexghana.com/#organization",
                  },
                  inLanguage: "en-GH",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://dataflexghana.com/search?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
                // 🚀 NEW: MTN Data Bundle Service with OfferCatalog
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#mtn-data-agency",
                  name: "Agent‑Only MTN Data Bundles",
                  description:
                    "Exclusive MTN Ghana data bundle prices for registered agents. Fast, instant delivery. 1GB from ₵3.70, 2GB ₵8.80, 5GB ₵22.50, 10GB ₵40.50, up to 100GB ₵399.00. Agents earn commissions on every sale. No registration fees for customers.",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                  areaServed: { "@type": "Country", "name": "Ghana" },
                  offers: {
                    "@type": "OfferCatalog",
                    name: "MTN Data Bundle Prices (Agent Only)",
                    itemListElement: [
                      { "@type": "Offer", priceCurrency: "GHS", price: "3.70", name: "MTN 1GB", description: "Agent‑only MTN 1GB data bundle" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "8.80", name: "MTN 2GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "12.90", name: "MTN 3GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "16.90", name: "MTN 4GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "22.50", name: "MTN 5GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "25.90", name: "MTN 6GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "31.00", name: "MTN 7GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "34.20", name: "MTN 8GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "40.50", name: "MTN 10GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "59.00", name: "MTN 15GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "79.00", name: "MTN 20GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "99.00", name: "MTN 25GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "119.00", name: "MTN 30GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "157.90", name: "MTN 40GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "197.00", name: "MTN 50GB" },
                      { "@type": "Offer", priceCurrency: "GHS", price: "399.00", name: "MTN 100GB" },
                    ],
                  },
                },
                // AirtelTigo Data
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#airteltigo-data",
                  name: "Agent‑Only AirtelTigo Data Bundles",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                  areaServed: { "@type": "Country", "name": "Ghana" },
                },
                // Telecel Data
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#telecel-data",
                  name: "Agent‑Only Telecel Data Bundles",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                  areaServed: { "@type": "Country", "name": "Ghana" },
                },
                // Additional services from the list
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#business-registration",
                  name: "Online Business Registration & Compliance Services",
                  description:
                    "100% online business registration without paperwork or queues. Agents earn ₵80‑₵130 commission per registration.",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                  areaServed: { "@type": "Country", "name": "Ghana" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#wholesale-dropshipping",
                  name: "Wholesale Shopping & Dropshipping Platform",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#job-recruitment",
                  name: "Verified Job Placements & Employment Portal",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#educational-products",
                  name: "GES Approved Books, Stationery & School Forms",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#ecg-digital-payments",
                  name: "ECG & Digital Payment Services",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#gift-cards-vouchers",
                  name: "Gift Cards & Digital Voucher Services",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#apple-repairs",
                  name: "Apple Device Repairs (iPhone, iPad, MacBook)",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#domestic-worker",
                  name: "Domestic Worker Recruitment",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#teacher-services",
                  name: "Teacher & Educational Services",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                // Agent opportunity as JobPosting
                {
                  "@type": "JobPosting",
                  "@id": "https://dataflexghana.com/#agent-opportunity",
                  title: "DataFlex Agent – Earn ₵700+ Daily Promoting Multiple Services",
                  description:
                    "Become a DataFlex agent and earn daily income promoting MTN, AirtelTigo & Telecel data bundles, GES books, business registration, jobs, wholesale products, digital vouchers, Apple repairs, domestic help, and more. Work flexible hours from home. Thousands of agents already earning ₵200‑₵800 daily.",
                  jobBenefits: [
                    "Agent‑only cheap data prices",
                    "Multiple income streams",
                    "Instant commission payout",
                    "Work from anywhere in Ghana",
                    "No experience required",
                  ],
                  datePosted: "2025-01-01",
                  validThrough: "2026-12-31",
                  employmentType: ["PART_TIME", "CONTRACTOR", "OTHER"],
                  hiringOrganization: { "@id": "https://dataflexghana.com/#organization" },
                  jobLocation: {
                    "@type": "Place",
                    address: {
                      "@type": "PostalAddress",
                      addressCountry: "GH",
                      addressRegion: "Ghana",
                    },
                  },
                  baseSalary: {
                    "@type": "MonetaryAmount",
                    currency: "GHS",
                    value: {
                      "@type": "QuantitativeValue",
                      minValue: 200,
                      maxValue: 800,
                      unitText: "DAY",
                    },
                  },
                },
                // FAQPage enriched with data pricing questions
                {
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "What are the MTN data bundle prices for DataFlex agents?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Agent‑only MTN data prices: 1GB ₵3.70, 2GB ₵8.80, 5GB ₵22.50, 10GB ₵40.50, 20GB ₵79.00, 100GB ₵399.00. See the full price list on the DataFlex Ghana platform.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "How can I earn ₵700 daily with DataFlex?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Promote services – sell data bundles, GES books, business registration, wholesale items, digital vouchers, etc. – and earn commissions. Many agents make ₵200‑₵800 daily.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Do DataFlex agents get cheaper data for reselling?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes. Registered agents access wholesale prices on MTN, AirtelTigo and Telecel bundles not available to the public. Example: MTN 1GB costs just ₵3.70 for agents.",
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>
      <body className="font-inter">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          suppressHydrationWarning
        >
          <MenuScrollHandler />
          {children}
          {/* 🚀 Insert agent pricing content (visually hidden, but SEO crawlable) */}
          <AgentDataPricing />
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
          <DevConsoleDetector />
        </ThemeProvider>
      </body>
    </html>
  )
}
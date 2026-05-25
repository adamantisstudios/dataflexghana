import type { Metadata } from "next"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { DevConsoleDetector } from "@/components/dev-console-detector"
import { DisableGlobalLinkPrefetch } from "@/components/disable-global-link-prefetch"
import { MenuScrollHandler } from "@/components/menu-scroll-handler"
import { AnalyticsRoot } from "@/components/analytics/AnalyticsRoot"

// ==============================
// 🔥 FULL SEO KEYWORD ARRAY – covering every service + “gh” variants
// ==============================
const seoKeywords = [
  // ORIGINAL TIERS 1‑30 (all kept)
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
  "Ghana digital link promotion",
  "Online traffic generation Ghana",
  "Social media traffic jobs Ghana",
  "Ghana link clicks earning",
  "Earn per link click Ghana",
  "Earn per share Ghana",
  "Link posting jobs Ghana",
  "Ghana link promotion jobs",
  "Promote links Ghana",
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
  "Ghana online data jobs",
  "Online survey jobs Ghana",
  "Paid survey jobs Ghana",
  "Ghana social media research jobs",
  "Social monitoring jobs Ghana",
  "Online data entry Ghana",
  "Ghana online typing jobs",
  "Best typing jobs Ghana",
  "Ghana online tasks jobs",
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
  "Online education promoter Ghana",
  "Online coaching jobs Ghana",
  "Digital coach Ghana",
  "Online income trainer Ghana",
  "Online earning education Ghana",
  "Online learning platform Ghana",
  "Ghana online education jobs",
  "Ghana e-learning jobs",
  "Online digital training Ghana",
  "Online events promoter Ghana",
  "Event marketing Ghana online",
  "Commission event promotion Ghana",
  "Ghana messenger marketing",
  "WhatsApp broadcast promotions Ghana",
  "Ghana broadcast list promotions",
  "Paid online campaigns Ghana",
  "Digital customer acquisition Ghana",
  "Ghana digital promoter network",
  "Ghana gig economy online",
  "Digital hustler Ghana",
  "Ghana internet hustle",
  "Internet business ideas Ghana",
  "Online gig worker Ghana",
  "Best side jobs Ghana",
  "Ghana online gig jobs",
  "Ghana side gig online",
  "Ghana online opportunity seekers",
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
  "Ghana momo payments",
  "Mobile money Ghana",
  "Ghana digital payments",
  "Ghana payment platform",
  "Bank transfer Ghana",
  "Online payment Ghana",
  "Wallet topup Ghana",
  "Ghana digital wallet",
  "Electronic payment Ghana",
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
  "Ghana zero-capital jobs",
  "No investment online earning Ghana",
  "No experience online jobs Ghana",
  "Work at home no experience Ghana",
  "Ghana online opportunity hub",
  "Best Ghana earning method",
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
  "Ghana legitimate online work",
  "Ghana no scam online jobs",
  "Ethical online work Ghana",
  "Legit online income Ghana",
  "Ghana make money legit",
  "Ghana verified earning jobs",
  "Trusted online earning Ghana",
  "Safe online earning Ghana",
  "Ghana secure online work",
  "Ghana digital marketing skills",
  "Ghana online technical jobs",
  "Ghana coding jobs online",
  "Ghana web design jobs",
  "Ghana digital skills training",
  "Ghana online skill development",
  "Ghana remote tech jobs",
  "Ghana IT online jobs",
  "Ghana tech career Ghana",
  "Ghana online earning groups",
  "Ghana digital workers",
  "Ghana commission earners",
  "Ghana online seller community",
  "Ghana digital hustlers network",
  "Ghana earning partner system",
  "Digital remote seller Ghana",
  "Ghana online partnership programs",
  "Ghana online opportunity hub",
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

  // ========================
  // 🚀 NEW SERVICES & “gh” VARIANTS (massive expansion)
  // ========================

  // Core service keywords
  "Cheap Data Bundles Ghana",
  "Cheap data bundles gh",
  "Cheap MTN data Ghana",
  "Business Registration Ghana",
  "Register business Ghana online",
  "Business registration services gh",
  "Wholesale & Dropshipping Ghana",
  "Wholesale dropshipping services gh",
  "Ghana wholesale dropshipping",
  "Job Recruitment Ghana",
  "Job recruitment services gh",
  "Ghana job recruitment platform",
  "School Forms & Admission Ghana",
  "School forms admission gh",
  "Ghana school form sales",
  "GES Approved Books Ghana",
  "GES books gh",
  "Ghana GES books supplier",
  "ECG & Digital Payments Ghana",
  "ECG payment services gh",
  "Pay ECG bill online Ghana",
  "Gift Cards & Vouchers Ghana",
  "Gift cards vouchers gh",
  "Digital vouchers Ghana",
  "Apple Device Repairs Ghana",
  "Apple repairs gh",
  "iPhone repair Ghana",
  "MacBook repair Ghana",
  "Domestic Worker Recruitment Ghana",
  "Domestic worker recruitment gh",
  "Nanny recruitment Ghana",
  "House help agency Ghana",
  "Fashion & Beauty Services Ghana",
  "Fashion beauty services gh",
  "Salon booking Ghana",
  "Beauty services online Ghana",
  "Candidate Search Portal Ghana",
  "Candidate search portal gh",
  "Recruitment portal Ghana",
  "Salon & Beauty Bookings Ghana",
  "Salon beauty bookings gh",
  "Book salon appointment Ghana",
  "Product Promotion & Commissions Ghana",
  "Product promotion commissions gh",
  "Earn commission promoting products Ghana",
  "Free Marketing Training Ghana",
  "Free marketing training gh",
  "Digital marketing free course Ghana",
  "Order Without Registration Ghana",
  "Order without registration gh",
  "Buy data without registration Ghana",
  "No registration data purchase Ghana",

  // “Dataflex” + new services
  "Dataflex Ghana cheap data bundles",
  "Dataflex Ghana business registration",
  "Dataflex Ghana wholesale dropshipping",
  "Dataflex Ghana job recruitment",
  "Dataflex Ghana school forms",
  "Dataflex Ghana GES books",
  "Dataflex Ghana ECG payments",
  "Dataflex Ghana gift cards",
  "Dataflex Ghana voucher services",
  "Dataflex Ghana Apple repairs",
  "Dataflex Ghana domestic worker",
  "Dataflex Ghana fashion beauty",
  "Dataflex Ghana candidate search",
  "Dataflex Ghana salon bookings",
  "Dataflex Ghana product promotion",
  "Dataflex Ghana free marketing training",
  "Dataflex Ghana order without registration",
  "Dataflex agent cheap data",
  "Dataflex agent business reg",
  "Dataflex agent wholesale",

  // “gh” variants of existing high‑traffic keywords
  "Dataflex gh",
  "Dataflex gh agent",
  "Dataflex gh registration",
  "Dataflex gh login",
  "Dataflex gh earn money",
  "Earn money online gh",
  "Make money online gh",
  "Online jobs gh",
  "Work from home gh",
  "Remote jobs gh",
  "Side hustle gh",
  "Online business gh",
  "Affiliate marketing gh",
  "Digital marketing gh",
  "Data bundles gh",
  "MTN data gh",
  "AirtelTigo data gh",
  "Telecel data gh",
  "Buy data gh",
  "Sell data gh",
  "Business registration gh",
  "Wholesale shopping gh",
  "Dropshipping gh",
  "Job recruitment gh",
  "School forms gh",
  "GES books gh",
  "ECG payment gh",
  "Gift cards gh",
  "Apple repair gh",
  "Domestic worker gh",
  "Fashion beauty gh",
  "Salon booking gh",
  "Candidate search gh",
  "Product promotion gh",
  "Free marketing training gh",
  "Order without registration gh",
  "DataFlex Ghana agent data prices",
  "DataFlex agent MTN data price",
  "DataFlex agent AirtelTigo data price",
  "DataFlex agent Telecel data price",
  "DataFlex agent pricing gh",

  // High‑volume combos
  "DataFlex Ghana MTN 1GB agent price",
  "DataFlex Ghana MTN 10GB agent price",
  "DataFlex Ghana MTN 20GB agent price",
  "DataFlex Ghana MTN 100GB agent price",
  "DataFlex Ghana cheapest data agent",
  "DataFlex Ghana no registration data",
  "DataFlex Ghana fashion and beauty services",
  "DataFlex Ghana salon and beauty booking",
  "DataFlex Ghana candidate search portal",
  "DataFlex Ghana product promotion and commissions",
  "DataFlex Ghana free marketing training course",
  "DataFlex Ghana order data without registration",

  // Additional long‑tail that includes “Ghana” and “gh” together
  "Dataflex Ghana gh",
  "Earn money online Ghana gh",
  "Online jobs in Ghana gh",
  "Side hustle Ghana gh",
  "Data bundles Ghana gh",
  "MTN data Ghana gh",
  "AirtelTigo data Ghana gh",
  "Telecel data Ghana gh",
  "Business registration Ghana gh",
  "Wholesale and dropshipping Ghana gh",
  "Job recruitment Ghana gh",
  "School forms and admission Ghana gh",
  "GES approved books Ghana gh",
  "ECG and digital payments Ghana gh",
  "Gift cards and vouchers Ghana gh",
  "Apple device repairs Ghana gh",
  "Domestic worker recruitment Ghana gh",
  "Fashion and beauty services Ghana gh",
  "Candidate search portal Ghana gh",
  "Salon and beauty bookings Ghana gh",
  "Product promotion and commissions Ghana gh",
  "Free marketing training Ghana gh",
  "Order without registration Ghana gh",

  // Without “Ghana”, just “gh” appended
  "Dataflex gh agent",
  "Cheap data bundles gh",
  "Agent data prices gh",
  "MTN agent data price gh",
  "Data reseller gh",
  "Best online earning platform gh",
  "Commission jobs gh",
  "Earn daily gh",
  
].join(", ")

// ==============================
// UPGRADED METADATA – now reflects the full service list
// ==============================
export const metadata: Metadata = {
  title:
    "DataFlex Agents Ghana - Earn ₵700+ Daily | MTN/AirtelTigo/Telecel Data, Business Registration, Wholesale, Jobs, School Forms, GES Books, ECG, Gift Cards, Apple Repairs, Domestic Workers, Fashion & Beauty, Salon Bookings, Product Promotion & Free Training | Order Without Registration",
  description:
    "Join Ghana's #1 multi-service platform. Promote & earn from: Cheap Data Bundles (MTN 1GB ₵3.70), Business Registration, Wholesale & Dropshipping, Job Recruitment, School Forms & Admission, GES Approved Books, ECG & Digital Payments, Gift Cards & Vouchers, Apple Device Repairs, Domestic Worker Recruitment, Fashion & Beauty Services, Candidate Search Portal, Salon & Beauty Bookings, Product Promotion & Commissions, Free Marketing Training. Agent-only data prices. Instant delivery. Order without registration. ₵200-₵800 daily potential. Zero agency fees.",
  keywords: seoKeywords,
  authors: [{ name: "DataFlex Ghana - Adamantis Solutions" }],
  creator: "DataFlex Ghana",
  publisher: "DataFlex Agents Platform",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1, notranslate",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://dataflexghana.com",
    siteName: "DataFlex Agents Ghana - All Services, One Platform, Daily Earnings",
    title:
      "DataFlex Agents Ghana - Earn ₵700+ Daily | MTN/AirtelTigo/Telecel Data, Business Registration, Wholesale, Jobs, School Forms, GES Books, ECG, Gift Cards, Apple Repairs, Domestic Workers, Fashion & Beauty, Salon Bookings, Product Promotion & Free Training",
    description:
      "🇬🇭 Promote & Earn From: Cheap Data Bundles (MTN, AirtelTigo, Telecel), Business Registration, Wholesale & Dropshipping, Job Recruitment, School Forms & Admission, GES Approved Books, ECG & Digital Payments, Gift Cards & Vouchers, Apple Device Repairs, Domestic Worker Recruitment, Fashion & Beauty Services, Candidate Search Portal, Salon & Beauty Bookings, Product Promotion & Commissions, Free Marketing Training. Agent-only prices, instant delivery, order without registration. Start earning now!",
    images: [
      {
        url: "https://dataflexghana.com/images/social-previewone.jpg",
        width: 1200,
        height: 630,
        alt: "DataFlex Ghana – Full Service Earning Platform: Data, Business Registration, Wholesale, Jobs, School Forms, GES Books, ECG, Vouchers, Apple Repairs, Domestic Workers, Fashion, Salon, Candidate Search, Product Promotion & Free Training",
        type: "image/jpeg",
      },
      {
        url: "https://dataflexghana.com/images/hero-main.jpg",
        width: 800,
        height: 600,
        alt: "DataFlex agent opportunity – promote multiple services and earn daily",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DataFlexGhana",
    creator: "@DataFlexGhana",
    title:
      "🇬🇭 DataFlex: Earn ₵700+/Day | MTN Data, Business Registration, Wholesale, Jobs, School Forms, GES Books, ECG, Vouchers, Apple Repair, Domestic Help, Fashion, Salon Bookings & More",
    description:
      "💰 Promote & Earn From: Cheap Data (MTN, AirtelTigo, Telecel), Business Reg, Wholesale, Jobs, School Forms, GES Books, ECG & Digital Payments, Gift Cards, Apple Repairs, Domestic Workers, Fashion & Beauty, Salon Bookings, Product Promotion & Free Training. Order without registration. Instant delivery. #DataFlexGhana #CheapData #SideHustle",
    images: [
      {
        url: "https://dataflexghana.com/images/social-previewone.jpg",
        alt: "DataFlex Agents - Multi-Service Earning Platform",
      },
    ],
  },
  alternates: {
    canonical: "https://dataflexghana.com",
  },
  manifest: "/manifest.json",
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
    // Price meta (for rich results)
    "priceCurrency": "GHS",
    "product:price:amount": "3.70",
    "product:price:currency": "GHS",
    "og:price:amount": "3.70",
    "og:price:currency": "GHS",
  },
  generator: "Next.js",
  category:
    "Business & Finance | Employment | Education | Digital Economy | Telecommunications | Beauty & Wellness | Home Services",
  classification:
    "Multi-Service Platform | Earning Platform | Job Portal | Business Registration | Educational Materials | Digital Vouchers | Apple Repair | Domestic Worker Recruitment | Fashion & Beauty | Salon Bookings | Candidate Search | Product Promotion | Free Training | Data Reseller",
}

// ==============================
// Simple Organization JSON‑LD (unchanged)
// ==============================
export const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DataFlex Agents Ghana",
  url: "https://dataflexghana.com",
  logo: "https://dataflexghana.com/images/dataflex-logo.png",
  description:
    "Multi-service earning platform in Ghana offering agent-only data bundles (MTN, AirtelTigo, Telecel), GES-approved books, business registration, wholesale/dropshipping, digital vouchers, and more.",
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

// ==============================
// ORIGINAL LAYOUT – No DOM changes, safe
// ==============================
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noai, noimageai" />
        <meta name="theme-color" content="#059669" />
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
        <meta name="twitter:label1" content="Full Service List" />
        <meta name="twitter:data1" content="Data, Business Reg, Wholesale, Jobs, School Forms, GES Books, ECG, Vouchers, Apple Repair, Domestic, Fashion, Salon, Candidate Search, Product Promotion, Free Training" />
        <meta name="twitter:label2" content="Agent Price" />
        <meta name="twitter:data2" content="MTN 1GB ₵3.70" />

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

        {/* ========================
             🚀 MEGA STRUCTURED DATA – every service now included
             ======================== */}
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
                    "Ghana's premier multi-service platform enabling agents to earn ₵700+ daily through: Cheap Data Bundles (MTN, AirtelTigo, Telecel), Business Registration, Wholesale & Dropshipping, Job Recruitment, School Forms & Admission, GES Approved Books, ECG & Digital Payments, Gift Cards & Vouchers, Apple Device Repairs, Domestic Worker Recruitment, Fashion & Beauty Services, Candidate Search Portal, Salon & Beauty Bookings, Product Promotion & Commissions, Free Marketing Training. Order without registration. Instant delivery.",
                  slogan: "Promote & Earn From – Ghana's Multi-Service Earning Platform",
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
                      url: "https://wa.me/233246827049",
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
                  name: "DataFlex Agents Ghana - Promote & Earn From Multiple Services",
                  description:
                    "Join DataFlex and earn daily income promoting 15+ services: cheap data bundles, business registration, wholesale/dropshipping, jobs, school forms, GES books, ECG payments, gift cards, Apple repairs, domestic help, fashion & beauty, salon bookings, candidate search, product promotion & free marketing training. Order without registration.",
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
                // MTN Data OfferCatalog
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#mtn-data",
                  name: "Agent-Only MTN Data Bundles",
                  description:
                    "Exclusive MTN Ghana data bundle prices for registered agents: 1GB ₵3.70, 2GB ₵8.80, 5GB ₵22.50, 10GB ₵40.50, up to 100GB ₵399.00. Instant delivery. Also AirtelTigo & Telecel data available.",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                  areaServed: { "@type": "Country", "name": "Ghana" },
                  offers: {
                    "@type": "OfferCatalog",
                    name: "MTN Data Bundle Prices (Agent Only)",
                    itemListElement: [
                      { "@type": "Offer", priceCurrency: "GHS", price: "3.70", name: "MTN 1GB" },
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
                // All other services
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#business-registration",
                  name: "Online Business Registration & Compliance Services",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
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
                  "@id": "https://dataflexghana.com/#school-forms",
                  name: "School Forms & Admission Processing",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#ges-books",
                  name: "GES Approved Books & Stationery",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#ecg-payments",
                  name: "ECG & Digital Payment Services",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#gift-cards",
                  name: "Gift Cards & Voucher Services",
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
                  "@id": "https://dataflexghana.com/#fashion-beauty",
                  name: "Fashion & Beauty Services",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#candidate-search",
                  name: "Candidate Search Portal",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#salon-bookings",
                  name: "Salon & Beauty Bookings",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#product-promotion",
                  name: "Product Promotion & Commissions",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#free-training",
                  name: "Free Marketing Training",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#order-no-registration",
                  name: "Order Without Registration",
                  provider: { "@id": "https://dataflexghana.com/#organization" },
                },
                // JobPosting for agents
                {
                  "@type": "JobPosting",
                  "@id": "https://dataflexghana.com/#agent-opportunity",
                  title: "DataFlex Agent – Earn ₵700+ Daily Promoting Multiple Services",
                  description:
                    "Become a DataFlex agent and earn daily income promoting cheap data bundles, business registration, wholesale/dropshipping, jobs, school forms, GES books, ECG payments, gift cards, Apple repairs, domestic workers, fashion & beauty, salon bookings, candidate search, product promotion & free marketing training. Order without registration for customers. Flexible hours, work from home, zero agency fees.",
                  jobBenefits: [
                    "Agent-only cheap data prices",
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
                // FAQPage updated
                {
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "What services can I promote as a DataFlex agent?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "You can promote and earn from: Cheap Data Bundles (MTN, AirtelTigo, Telecel), Business Registration, Wholesale & Dropshipping, Job Recruitment, School Forms & Admission, GES Approved Books, ECG & Digital Payments, Gift Cards & Vouchers, Apple Device Repairs, Domestic Worker Recruitment, Fashion & Beauty Services, Candidate Search Portal, Salon & Beauty Bookings, Product Promotion & Commissions, Free Marketing Training. You can also let customers order without registration.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "What are the MTN data bundle prices for agents?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Agent‑only MTN data prices: 1GB ₵3.70, 2GB ₵8.80, 5GB ₵22.50, 10GB ₵40.50, 20GB ₵79.00, 100GB ₵399.00. Full price list on the DataFlex platform. Also available for AirtelTigo and Telecel.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Can I order data without registration?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes! DataFlex allows customers to order directly without registration. Use the ‘Order Without Registration’ link to get instant data.",
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
          <DisableGlobalLinkPrefetch />
          <MenuScrollHandler />
          <AnalyticsRoot />
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
          <DevConsoleDetector />
        </ThemeProvider>
      </body>
    </html>
  )
}

import "./globals.css"

/*
  =====================================================
  ✅ PROMOTE & EARN FROM – Updated UI list (safe to copy)
  =====================================================
  Paste this block into your page component to display
  the full list of services (no layout changes here).

  <section>
    <h3>💼 Promote & Earn From These Services on DataFlex Ghana</h3>
    <ul>
      <li>✅ Cheap Data Bundles — MTN, AirtelTigo & Telecel</li>
      <li>✅ Business Registration & Compliance Services</li>
      <li>✅ Wholesale & Dropshipping Services</li>
      <li>✅ Job Recruitment Opportunities</li>
      <li>✅ School Forms & Admission Processing</li>
      <li>✅ GES Approved Books & Stationery</li>
      <li>✅ ECG & Digital Payment Services</li>
      <li>✅ Gift Cards & Voucher Services</li>
      <li>✅ Apple Device Repairs — iPhone, iPad, MacBook</li>
      <li>✅ Domestic Worker Recruitment</li>
      <li>✅ Fashion & Beauty Services</li>
      <li>✅ Candidate Search Portal</li>
      <li>✅ Salon & Beauty Bookings</li>
      <li>✅ Product Promotion & Commissions</li>
      <li>✅ Free Marketing Training</li>
      <li>✅ Order Without Registration</li>
    </ul>
  </section>
*/
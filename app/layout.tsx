import type { Metadata } from "next"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { DevConsoleDetector } from "@/components/dev-console-detector"
import { MenuScrollHandler } from "@/components/menu-scroll-handler"

const seoKeywords = [
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
].join(", ")

export const metadata: Metadata = {
  title: "DataFlex Agents Ghana - Earn ₵700+ Daily | Multi-Service Platform with Commissions",
  description:
    "Join Ghana's #1 multi-service earning platform. Earn commissions up to ₵700+ daily as a DataFlex Agent. Access GES-approved books, verified jobs, business registration, wholesale shopping, digital vouchers & more. Perfect for students, job seekers & entrepreneurs seeking side income. Zero agency fees. 100% free job search support.",
  keywords: seoKeywords,
  authors: [{ name: "DataFlex Ghana - Adamantis Solutions" }],
  creator: "DataFlex Ghana",
  publisher: "DataFlex Agents Platform",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1, notranslate",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://dataflexghana.com",
    siteName: "DataFlex Agents Ghana - Earn Commissions & Build Multiple Income Streams",
    title: "DataFlex Agents Ghana - Earn ₵700+ Daily | Multi-Service Earning Platform",
    description:
      "🇬🇭 DataFlex: Ghana's #1 multi-service platform to earn money. Earn ₵700+ daily through commissions. GES-approved books, verified jobs, business registration, wholesale shopping, digital vouchers & mentorship channels. Perfect for students, parents, entrepreneurs & job seekers. Start earning today with zero agency fees!",
    images: [
      {
        url: "https://dataflexghana.com/images/social-previewone.jpg",
        width: 1200,
        height: 630,
        alt: "DataFlex Agents Ghana - Multi-Service Platform to Earn Money with Commissions",
        type: "image/jpeg",
      },
      {
        url: "https://dataflexghana.com/images/hero-main.jpg",
        width: 800,
        height: 600,
        alt: "DataFlex platform offering GES-approved books, jobs, business registration, wholesale shopping & mentorship",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DataFlexGhana",
    creator: "@DataFlexGhana",
    title: "🇬🇭 DataFlex: Earn ₵700+ Daily | Ghana's Multi-Service Earning Platform",
    description:
      "💰 Earn commissions through GES books, verified jobs, business registration, wholesale shopping & digital vouchers. Perfect side income! 📚 Educational services ✅ Verified employment ✅ Business tools ✅ Mentorship channels ✅ Start FREE today! #GhanaEarnings #SideHustle #GhanaJobs",
    images: [
      {
        url: "https://dataflexghana.com/images/social-previewone.jpg",
        alt: "DataFlex Agents - Earn Money on the Side in Ghana",
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
  },
  generator: "Next.js",
  category: "Business & Finance | Employment | Education | Digital Economy",
  classification:
    "Multi-Service Platform | Earning Platform | Job Portal | Investment Tools | Commission-Based Business | Gig Economy",
}

export const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DataFlex Agents Ghana",
  url: "https://dataflexghana.com",
  logo: "https://dataflexghana.com/images/dataflex-logo.png",
  description:
    "Multi-service earning platform in Ghana offering commissions on data bundles, jobs, business registration, wholesale shopping, and digital services",
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
    telephone: "+233-xxx-xxx-xxx",
  },
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
        <meta property="og:updated_time" content="2024-08-15T14:00:00Z" />

        {/* Additional Twitter Card Tags */}
        <meta name="twitter:domain" content="dataflexghana.com" />
        <meta name="twitter:url" content="https://dataflexghana.com" />
        <meta name="twitter:label1" content="Target Audience" />
        <meta name="twitter:data1" content="Students, Job Seekers, Investors, Parents, Entrepreneurs" />
        <meta name="twitter:label2" content="Location" />
        <meta name="twitter:data2" content="Ghana" />

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

        {/* Preload system fonts for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </noscript>

        {/* SEO Structured Data */}
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
                    "Ghana's premier multi-service platform enabling agents to earn ₵700+ daily through GES-approved educational services, verified job placements, business registration, wholesale shopping, digital vouchers, and mentorship channels. Zero agency fees with transparent commission structures.",
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
                    "https://www.dataflexagents.com",
                    "https://agentwelcome.netlify.app/",
                    "https://fasthiredterms.netlify.app/",
                    "https://bizcomplianceforms.netlify.app/",
                  ],
                  foundingDate: "2023",
                  numberOfEmployees: "50-200",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://dataflexghana.com/#website",
                  url: "https://dataflexghana.com",
                  name: "DataFlex Agents Ghana - Multi-Service Platform to Earn Money",
                  description:
                    "Join Ghana's #1 multi-service platform offering GES-approved educational materials, verified employment opportunities, business registration, wholesale shopping, digital vouchers, and mentorship channels. Earn commissions up to ₵700 daily. Perfect for students, parents, entrepreneurs, and job seekers seeking flexible side income.",
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
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#ges-books-service",
                  name: "GES Approved Educational Books & Stationery",
                  description:
                    "Access GES-certified textbooks, stationery, and educational materials for schools across Ghana. Agents earn commissions on every sale to students and parents. Wholesale prices with doorstep delivery nationwide. Perfect for parents wanting to save on school supplies.",
                  provider: {
                    "@id": "https://dataflexghana.com/#organization",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "Ghana",
                  },
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "GHS",
                    description: "Commission earnings from ₵50-₵500 per transaction",
                  },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#verified-jobs-service",
                  name: "Verified Job Placements & Employment Portal",
                  description:
                    "100% free job search support connecting job seekers with verified employers across Ghana. Zero agency fees. Agents earn referral commissions when helping friends find employment. Features include remote jobs, corporate positions, casual labor, and domestic work. No salary deductions after landing job.",
                  provider: {
                    "@id": "https://dataflexghana.com/#organization",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "Ghana",
                  },
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "GHS",
                    description: "Free job search support with commission earnings on successful placements",
                  },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#business-registration",
                  name: "Online Business Registration & Compliance Services",
                  description:
                    "100% online business registration without paperwork or queues. Agents earn ₵80-₵130 commission per registration. Services include sole proprietorship, partnership, company registration, and business legalization. Nationwide delivery within 14 working days. Completely secured process with government approval.",
                  provider: {
                    "@id": "https://dataflexghana.com/#organization",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "Ghana",
                  },
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "GHS",
                    price: "80-130",
                    description: "Commission per business registration for agents",
                  },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#wholesale-shopping",
                  name: "Wholesale Shopping & Dropshipping Platform",
                  description:
                    "Access wholesale products from verified suppliers across Ghana. Agents buy at wholesale prices and resell at retail prices earning significant margins. Features include doorstep delivery, dropshipping capabilities, and bulk purchase options. Perfect for starting a small business with low capital.",
                  provider: {
                    "@id": "https://dataflexghana.com/#organization",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "Ghana",
                  },
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "GHS",
                    description: "Variable margins based on product category and quantity",
                  },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#digital-vouchers",
                  name: "Digital Vouchers & Educational Cards",
                  description:
                    "Sell digital educational vouchers, results checker cards (BECE, WASSCE, ABCE), school forms, and subscription services. Agents earn high commissions (₵50-₵4000) promoting business projects and services. Instant delivery via email or WhatsApp. No registration required for customers.",
                  provider: {
                    "@id": "https://dataflexghana.com/#organization",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "Ghana",
                  },
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "GHS",
                    price: "50-4000",
                    description: "Commission range per digital voucher sale",
                  },
                },
                {
                  "@type": "Service",
                  "@id": "https://dataflexghana.com/#mentorship-channels",
                  name: "Teacher Mentorship & Learning Channels",
                  description:
                    "Join teacher-led mentorship channels and learning communities. Connect with educational mentors, professional consultants, and skill-building experts. Agents earn referral commissions when connecting students and professionals with mentors for training and career guidance.",
                  provider: {
                    "@id": "https://dataflexghana.com/#organization",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "Ghana",
                  },
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "GHS",
                    description: "Commission earnings from mentorship referrals",
                  },
                },
                {
                  "@type": "JobPosting",
                  "@id": "https://dataflexghana.com/#agent-opportunity",
                  title: "DataFlex Agent - Earn ₵700+ Daily | Multi-Income Side Gig Opportunity",
                  description:
                    "Join DataFlex as an agent and earn ₵700+ daily through multiple income streams: GES book sales (₵50-₵500 per sale), job referrals, business registrations (₵80-₵130 per registration), wholesale trading, digital vouchers (₵50-₵4000 per sale), and mentorship referrals. Flexible hours, work from home, zero agency fees, transparent commissions, and 24/7 support included.",
                  jobBenefits: [
                    "Earn ₵700+ daily potential earnings",
                    "Multiple income streams and passive income opportunities",
                    "Flexible working hours - work from home",
                    "No hidden fees or agency charges",
                    "24/7 customer support via WhatsApp and phone",
                    "Comprehensive training and onboarding",
                    "Real-time earnings tracking dashboard",
                    "Exclusive access to mentorship channels",
                    "Nationwide network of agents",
                    "Transparent commission structure",
                  ],
                  datePosted: "2024-01-01",
                  validThrough: "2025-12-31",
                  employmentType: ["PART_TIME", "CONTRACTOR", "TEMPORARY", "OTHER"],
                  hiringOrganization: {
                    "@id": "https://dataflexghana.com/#organization",
                  },
                  jobLocation: {
                    "@type": "Place",
                    address: {
                      "@type": "PostalAddress",
                      addressCountry: "GH",
                      addressRegion: "Ghana",
                      addressLocality: "Nationwide",
                    },
                  },
                  baseSalary: {
                    "@type": "MonetaryAmount",
                    currency: "GHS",
                    value: {
                      "@type": "QuantitativeValue",
                      minValue: 50,
                      maxValue: 10000,
                      unitText: "MONTH",
                    },
                  },
                  qualifications:
                    "No specific qualifications required. Perfect for students aged 18+, job seekers, parents, entrepreneurs, and anyone seeking flexible side income in Ghana.",
                  responsibilities:
                    "Sell GES-approved books and educational materials, connect job seekers with employers, register businesses online, facilitate wholesale purchases, promote digital vouchers, and connect mentees with mentors. Track earnings via dashboard and provide customer support.",
                  benefits:
                    "Flexible scheduling, work-from-home opportunity, multiple income sources, transparent commission-based earnings (₵50-₵4000 per transaction), real-time payment tracking, comprehensive training, 24/7 support team, and access to exclusive mentorship channels.",
                },
                {
                  "@type": "AggregateOffer",
                  "@id": "https://dataflexghana.com/#service-catalog",
                  name: "DataFlex Multi-Service Platform - Earn Money in Ghana",
                  description:
                    "Complete suite of earning opportunities combining educational services, employment support, business tools, wholesale access, and mentorship connections. All services designed to generate flexible income with transparent commission structures.",
                  priceCurrency: "GHS",
                  offers: [
                    {
                      "@type": "Offer",
                      name: "GES Books Commission",
                      price: "50-500",
                      availability: "InStock",
                    },
                    {
                      "@type": "Offer",
                      name: "Business Registration Commission",
                      price: "80-130",
                      availability: "InStock",
                    },
                    {
                      "@type": "Offer",
                      name: "Digital Voucher Commission",
                      price: "50-4000",
                      availability: "InStock",
                    },
                    {
                      "@type": "Offer",
                      name: "Job Referral Earnings",
                      price: "Variable",
                      availability: "InStock",
                    },
                  ],
                },
                // Added FAQPage structured data for featured snippets
                {
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "How much can I earn daily as a DataFlex agent in Ghana?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Agents can earn ₵700+ daily depending on activity and product mix. Earnings include: GES books (₵50-₵500), business registrations (₵80-₵130), digital vouchers (₵50-₵4000), job referrals (variable), and wholesale margins (30-50%). Most successful agents earn ₵1500-₵5000 monthly.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "What are the DataFlex agent menu items and services?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "DataFlex offers 6 main services: 1) GES Approved Books - sell educational materials; 2) Verified Jobs - connect job seekers with employers; 3) Business Registration - help businesses get legally registered; 4) Wholesale Shopping - resell wholesale products; 5) Digital Vouchers - sell educational and gift vouchers; 6) Mentorship Channels - connect learners with teachers and mentors.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Are there any agency fees or joining costs?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "DataFlex has zero agency fees. The only cost is a one-time joining fee (specific amount depends on current promotion). All commissions are transparent and paid directly to your wallet with no deductions.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Can I earn passive income through mentorship channels?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes! Join teacher mentorship channels and earn referral commissions when connecting students and professionals with mentors. This creates a passive income stream while helping people develop skills and advance careers.",
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
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />

          <DevConsoleDetector />
        </ThemeProvider>
      </body>
    </html>
  )
}

import "./globals.css"

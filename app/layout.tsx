import type { Metadata } from "next"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { DevConsoleDetector } from "@/components/dev-console-detector"

export const metadata: Metadata = {
  title: "DataFlex Agents Ghana - Earn ₵700+ Daily | Multi-Service Platform with Commissions",
  description:
    "Join Ghana's #1 multi-service earning platform. Earn commissions up to ₵700+ daily as a DataFlex Agent. Access GES-approved books, verified jobs, business registration, wholesale shopping, digital vouchers & more. Perfect for students, job seekers & entrepreneurs seeking side income. Zero agency fees. 100% free job search support. Become an agent today!",
  keywords: [
    // Primary earning/commission keywords
    "earn money in Ghana",
    "earn commissions Ghana",
    "make money on the side Ghana",
    "side gigs Ghana",
    "side hustle Ghana",
    "earn 700 cedis daily",
    "earn 500 cedis daily Ghana",
    "earn extra income Ghana",
    "make money online Ghana",
    "online earning Ghana",
    "work from home Ghana",
    "commission based jobs Ghana",
    "affiliate marketing Ghana",
    "referral commission Ghana",
    "passive income Ghana",
    "additional income Ghana",
    "flexible income Ghana",
    "part time earning Ghana",

    // Educational services & GES-approved products
    "GES approved books Ghana",
    "educational materials Ghana",
    "school stationery Ghana",
    "textbooks Ghana",
    "student supplies Ghana",
    "educational resources Ghana",
    "school voucher cards Ghana",
    "GES certified books",
    "BECE results checker Ghana",
    "WASSCE results checker Ghana",
    "school forms Ghana",
    "university application forms Ghana",

    // Job seekers & employment
    "jobs for students Ghana",
    "part time jobs Ghana",
    "online jobs Ghana",
    "remote work Ghana",
    "student jobs Accra",
    "university jobs Ghana",
    "graduate jobs Ghana",
    "entry level jobs Ghana",
    "work from home Ghana",
    "flexible jobs Ghana",
    "job search Ghana",
    "domestic jobs Ghana",
    "corporate jobs Ghana",
    "women jobs Ghana",
    "job vacancies Ghana",
    "remote jobs Ghana",
    "freelance jobs Ghana",
    "casual labor Ghana",
    "fast hired jobs Ghana",

    // Business registration & compliance
    "business registration Ghana",
    "business opportunities Ghana",
    "entrepreneur Ghana",
    "startup Ghana",
    "small business Ghana",
    "business networking Ghana",
    "business promotion Ghana",
    "sole proprietorship registration",
    "company registration Ghana",
    "register business Ghana",
    "AFA registration Ghana",
    "business compliance Ghana",
    "business legalization Ghana",

    // Data bundles & telecommunications
    "affordable data bundles Ghana",
    "cheap data Ghana",
    "data bundle prices",
    "MTN data Ghana",
    "AirtelTigo data Ghana",
    "Telecel data Ghana",
    "buy data online Ghana",
    "data packages Ghana",
    "internet bundles Ghana",

    // Wholesale & shopping
    "wholesale business Ghana",
    "wholesale shopping Ghana",
    "bulk purchases Ghana",
    "business supplies Ghana",
    "wholesale marketplace Ghana",
    "retail shopping Ghana",
    "school supplies wholesale Ghana",
    "dropshipping Ghana",
    "import export Ghana",
    "supplier Ghana",

    // Real estate & investment
    "real estate agent Ghana",
    "property investment Ghana",
    "buy land Ghana",
    "rent house Ghana",
    "sell property Ghana",
    "invest money Ghana",
    "high return investment Ghana",
    "investment opportunities Ghana",

    // Multi-service platform specific
    "multi-service platform Ghana",
    "all in one service platform",
    "platform to earn money Ghana",
    "DataFlex platform",
    "DataFlex Ghana",
    "DataFlex agents",
    "agent registration Ghana",
    "verified platform Ghana",
    "trusted service platform",
    "legitimate opportunities Ghana",

    // Geographic & regional keywords
    "Greater Accra Ghana",
    "Ashanti Region Ghana",
    "Western Region Ghana",
    "Central Region Ghana",
    "Eastern Region Ghana",
    "Volta Region Ghana",
    "Northern Region Ghana",
    "Kumasi Ghana",
    "Accra Ghana",
    "Tema Ghana",
    "Takoradi Ghana",
    "Sekondi Ghana",
    "Cape Coast Ghana",
    "Tamale Ghana",

    // Mentorship & learning platform keywords
    "learn from mentors Ghana",
    "mentorship platform Ghana",
    "teacher network Ghana",
    "skill development Ghana",
    "training courses Ghana",
    "online learning Ghana",
    "career guidance Ghana",
    "business training Ghana",
    "professional development Ghana",
    "teaching channels Ghana",

    // Platform channels & community
    "channels to join Ghana",
    "learning channels",
    "community platform Ghana",
    "agent community",
    "networking platform Ghana",
    "professional network Ghana",
    "business channels Ghana",
    "educational channels Ghana",

    // Service-specific keywords
    "teacher mentor network",
    "find mentors Ghana",
    "learning opportunities Ghana",
    "skill sharing platform",
    "professional consultation Ghana",
  ].join(", "),
  authors: [{ name: "DataFlex Ghana - Adamantis Solutions" }],
  creator: "DataFlex Ghana",
  publisher: "DataFlex Agents Platform",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
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
  },
  generator: "Next.js",
  category: "Business & Finance | Employment | Education",
  classification:
    "Multi-Service Platform | Earning Platform | Job Portal | Investment Tools | Commission-Based Business",
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
        <meta name="format-detection" content="telephone=no" />

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
                      url: "https://wa.me/233551999901",
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
      </head>
      <body className="font-inter">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          suppressHydrationWarning
        >
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

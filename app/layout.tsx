import type { Metadata } from "next"
import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { DevConsoleDetector } from "@/components/dev-console-detector"

export const metadata: Metadata = {
  title: "DataFlex Agents - Educational Services, Jobs & Business Opportunities in Ghana",
  description:
    "Ghana's premier platform for educational services, job opportunities, and business growth. Access GES-approved books, wholesale shopping, business registration, digital vouchers, school forms, and verified employment opportunities. Join thousands building successful careers and businesses.",
  keywords: [
    // Educational services
    "GES approved books Ghana",
    "educational materials Ghana",
    "school stationery Ghana",
    "textbooks Ghana",
    "student supplies Ghana",
    "educational resources Ghana",
    "school voucher cards",
    "GES approved books",

    // Job seekers & students
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

    // Business services
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
    "AFA registration",

    // Side gigs and earning
    "side gigs in Ghana",
    "make money online in Ghana",
    "earn money Ghana",
    "side hustles Ghana",
    "side income Ghana",
    "extra income Ghana",
    "passive income Ghana",
    "money making ideas Ghana",
    "affiliate marketing Ghana",
    "agent opportunities Ghana",

    // Real estate
    "real estate agent Ghana",
    "property investment Ghana",
    "buy land Ghana",
    "rent house Ghana",
    "sell property Ghana",
    "invest money Ghana",
    "high return investment Ghana",
    "investment opportunities Ghana",

    // Government services
    "birth certificate Ghana",
    "driver's license Ghana",
    "passport Ghana",
    "legal document processing Ghana",
    "government services Ghana",

    // Wholesale & shopping
    "wholesale business Ghana",
    "wholesale shopping Ghana",
    "bulk purchases Ghana",
    "business supplies Ghana",
    "wholesale marketplace Ghana",
    "retail shopping Ghana",
    "school supplies Ghana",

    // Tech services
    "MTN Turbonet",
    "buy internet routers Ghana",
    "software installation Ghana",
    "tech services Ghana",
    "data bundles Ghana",
    "internet services Ghana",
    "tech support Ghana",
    "software Ghana",
    "hardware Ghana",
    "networking Ghana",

    // Digital services
    "digital voucher cards Ghana",
    "school placement forms Ghana",
    "educational paperwork Ghana",
    "digital services Ghana",
    "e-commerce Ghana",
    "online shopping Ghana",
    "digital payments Ghana",
    "online payments Ghana",
    "mobile money Ghana",

    // Financial services
    "financial services Ghana",
    "financial freedom Ghana",
    "wealth creation Ghana",
    "savings Ghana",
    "loans Ghana",
    "credit Ghana",
    "banking Ghana",
    "cryptocurrency Ghana",
    "bitcoin Ghana",
    "forex trading Ghana",
    "stock trading Ghana",
    "investment clubs Ghana",
    "microfinance Ghana",

    // Business ideas
    "business ideas Ghana",
    "online business Ghana",
    "home business Ghana",
    "online business ideas Ghana",
    "business consulting Ghana",

    // Education and training
    "career growth Ghana",
    "skills development Ghana",
    "training Ghana",
    "certification Ghana",
    "online courses Ghana",
    "distance learning Ghana",
    "scholarships Ghana",
    "student loans Ghana",
    "education Ghana",
    "schools Ghana",
    "universities Ghana",
    "colleges Ghana",
    "vocational training Ghana",
    "apprenticeship Ghana",
    "internship Ghana",

    // Professional services
    "legal consulting Ghana",
    "financial consulting Ghana",
    "tax consulting Ghana",
    "audit services Ghana",
    "accounting services Ghana",
    "bookkeeping Ghana",
    "payroll services Ghana",
    "HR services Ghana",

    // Regional keywords
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

    // Platform specific
    "DataFlex Ghana",
    "DataFlex Agents",
    "agent registration Ghana",
    "verified platform Ghana",
    "trusted service platform",
    "legitimate opportunities Ghana",
  ].join(", "),
  authors: [{ name: "DataFlex Ghana - Adamantis Solutions" }],
  creator: "DataFlex Ghana",
  publisher: "DataFlex Agents Platform",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://dataflexghana.com",
    siteName: "DataFlex Agents - Ghana's Premier Educational & Business Platform",
    title: "Educational Services, Jobs & Business Opportunities in Ghana | DataFlex",
    description:
      "Transform your future with DataFlex! Access GES-approved educational materials, find verified job opportunities, register your business, shop wholesale, and access digital services. Perfect for students, job seekers, parents, and entrepreneurs. Join thousands building successful careers in Ghana.",
    images: [
      {
        url: "https://dataflexghana.com/images/social-previewone.jpg",
        width: 1200,
        height: 630,
        alt: "DataFlex Agents - Educational Services, Jobs & Business Opportunities in Ghana",
        type: "image/jpeg",
      },
      {
        url: "https://dataflexghana.com/images/hero-main.jpg",
        width: 800,
        height: 600,
        alt: "Students and professionals accessing educational and business services through DataFlex platform",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DataFlexGhana",
    creator: "@DataFlexGhana",
    title: "🎓 Educational Services, Jobs & Business Opportunities in Ghana",
    description:
      "📚 GES-approved books ✅ Verified jobs ✅ Business registration ✅ Wholesale shopping ✅ Digital vouchers ✅ School forms. Perfect for students, parents & entrepreneurs! 🇬🇭 #GhanaEducation #GhanaJobs #BusinessGhana #StudentServices",
    images: [
      {
        url: "https://dataflexghana.com/images/social-previewone.jpg",
        alt: "DataFlex - Ghana's Premier Platform for Educational & Business Services",
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
  category: "Business & Finance",
  classification: "Earning Platform, Job Portal, Investment Tools",
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
                  name: "DataFlex Agents",
                  alternateName: ["Adamantis Solutions", "DataFlex Ghana"],
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
                  contactPoint: {
                    "@type": "ContactPoint",
                    telephone: "+233-55-199-9901",
                    contactType: "customer service",
                    areaServed: "GH",
                    availableLanguage: ["English", "Twi"],
                    hoursAvailable: {
                      "@type": "OpeningHoursSpecification",
                      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                      opens: "08:00",
                      closes: "20:00",
                    },
                  },
                  address: {
                    "@type": "PostalAddress",
                    addressCountry: "GH",
                    addressRegion: "Ghana",
                  },
                  sameAs: ["https://www.dataflexagents.com", "https://agentwelcome.netlify.app/"],
                  foundingDate: "2023",
                  numberOfEmployees: "50-100",
                  slogan: "Ghana's Premier Platform for Educational & Business Services",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://dataflexghana.com/#website",
                  url: "https://dataflexghana.com",
                  name: "DataFlex Agents - Ghana's Premier Educational & Business Platform",
                  description:
                    "Join Ghana's #1 platform for educational services, job opportunities, and business growth. Access GES-approved books, wholesale shopping, business registration, digital vouchers, school forms, and verified employment opportunities.",
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
                  "@id": "https://dataflexghana.com/#service",
                  name: "DataFlex Agent Platform",
                  description:
                    "Comprehensive platform offering educational services, job opportunities, business registration, wholesale shopping, digital vouchers, and school forms for students, professionals, parents, and entrepreneurs in Ghana.",
                  provider: {
                    "@id": "https://dataflexghana.com/#organization",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "Ghana",
                  },
                  audience: [
                    {
                      "@type": "Audience",
                      audienceType: "Students",
                      geographicArea: {
                        "@type": "Country",
                        name: "Ghana",
                      },
                    },
                    {
                      "@type": "Audience",
                      audienceType: "Job Seekers",
                      geographicArea: {
                        "@type": "Country",
                        name: "Ghana",
                      },
                    },
                    {
                      "@type": "Audience",
                      audienceType: "Investors",
                      geographicArea: {
                        "@type": "Country",
                        name: "Ghana",
                      },
                    },
                    {
                      "@type": "Audience",
                      audienceType: "Parents",
                      geographicArea: {
                        "@type": "Country",
                        name: "Ghana",
                      },
                    },
                    {
                      "@type": "Audience",
                      audienceType: "Entrepreneurs",
                      geographicArea: {
                        "@type": "Country",
                        name: "Ghana",
                      },
                    },
                  ],
                  hasOfferCatalog: {
                    "@type": "OfferCatalog",
                    name: "DataFlex Agent Services and Opportunities",
                    itemListElement: [
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "GES Approved Books",
                          description:
                            "Access to GES-approved educational materials and books for students and parents.",
                          category: "Educational Services",
                        },
                      },
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "Verified Job Opportunities",
                          description:
                            "Access to verified job listings from credible employers across Ghana, perfect for students and job seekers looking for part-time, remote, or full-time work.",
                          category: "Employment Services",
                        },
                      },
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "Business Registration",
                          description: "Register your business with DataFlex for seamless setup and management.",
                          category: "Business Services",
                        },
                      },
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "Wholesale Shopping",
                          description:
                            "Access wholesale products, import goods, and start dropshipping business with doorstep delivery from verified suppliers across Ghana.",
                          category: "E-commerce",
                        },
                      },
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "Digital Voucher Cards",
                          description:
                            "Promote high-value business projects and services to earn commissions ranging from ₵50 to ₵4000 based on project value and success.",
                          category: "Digital Services",
                        },
                      },
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "School Forms and Paperwork",
                          description:
                            "Comprehensive dashboard with earnings reports, performance metrics, profit calculators, and business intelligence tools for agents.",
                          category: "Administrative Services",
                        },
                      },
                    ],
                  },
                },
                {
                  "@type": "JobPosting",
                  "@id": "https://dataflexghana.com/#agent-opportunity",
                  title: "DataFlex Agent - Earn Money Online",
                  description:
                    "Join as a DataFlex Agent and start earning through multiple income streams: job applications, educational services, business registration, wholesale shopping, and digital vouchers.",
                  datePosted: "2024-01-01",
                  validThrough: "2025-12-31",
                  employmentType: ["PART_TIME", "CONTRACTOR", "OTHER"],
                  hiringOrganization: {
                    "@id": "https://dataflexghana.com/#organization",
                  },
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
                      minValue: 50,
                      maxValue: 5000,
                      unitText: "MONTH",
                    },
                  },
                  qualifications:
                    "No specific qualifications required. Perfect for students, job seekers, parents, and anyone looking to earn extra income.",
                  responsibilities:
                    "Provide educational services, apply to jobs, register businesses, manage wholesale orders, and use digital services to track earnings.",
                  benefits:
                    "Flexible working hours, multiple income streams, comprehensive training, 24/7 support, and access to exclusive business opportunities.",
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

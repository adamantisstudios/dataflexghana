import type { Metadata } from "next"
import DomesticWorkersClient from "@/components/public/domestic-workers/DomesticWorkersClient"
import DomesticWorkersWhatsAppDialog from "@/components/public/domestic-workers/DomesticWorkersWhatsAppDialog"

// SEO-optimized metadata for Ghana domestic workers market
export const metadata: Metadata = {
  title: "Domestic Workers in Ghana | Housekeepers, Nannies, Cleaners & Home Care Services",
  description:
    "Find trusted domestic workers in Ghana. Browse experienced housekeepers, nannies, cleaners, and home care professionals. Contact admin directly via WhatsApp for reliable domestic services.",
  keywords: [
    // Primary domestic worker keywords
    "domestic workers Ghana",
    "housekeepers Ghana",
    "nannies Ghana",
    "cleaners Ghana",
    "home care services Ghana",
    "domestic help Ghana",
    "house help Ghana",

    // Location-specific keywords
    "domestic workers Accra",
    "housekeepers Tema",
    "nannies East Legon",
    "cleaners Kumasi",
    "home care Spintex",
    "domestic help Airport Residential",
    "house help Cantonments",

    // Service types
    "live-in domestic workers Ghana",
    "live-out domestic workers Ghana",
    "child care Ghana",
    "elderly care Ghana",
    "cooking services Ghana",
    "cleaning services Ghana",
    "laundry services Ghana",

    // Experience and skills
    "experienced domestic workers Ghana",
    "trained housekeepers Ghana",
    "professional nannies Ghana",
    "skilled cleaners Ghana",
    "reliable domestic help Ghana",

    // Contact and interaction
    "WhatsApp domestic workers Ghana",
    "contact domestic worker admin Ghana",
    "domestic worker enquiry Ghana",
    "home care contact Ghana",
  ].join(", "),
  authors: [{ name: "DataFlex Ghana Domestic Workers" }],
  creator: "DataFlex Ghana",
  publisher: "DataFlex Domestic Workers Platform",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://dataflexghana.com/domestic-workers",
    siteName: "DataFlex Domestic Workers - Ghana Home Care Services",
    title: "Domestic Workers in Ghana | Housekeepers, Nannies, Cleaners & Home Care",
    description:
      "Find trusted domestic workers across Ghana! Browse experienced housekeepers, nannies, cleaners, and home care professionals. Contact admin directly via WhatsApp for reliable domestic services.",
    images: [
      {
        url: "https://dataflexghana.com/images/ghana-domestic-workers-showcase.jpg",
        width: 1200,
        height: 630,
        alt: "Domestic Workers in Ghana - Housekeepers, Nannies, Cleaners, Home Care Services",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DataFlexGhana",
    creator: "@DataFlexGhana",
    title: "🏠 Domestic Workers in Ghana | Home Care Services",
    description:
      "🏡 Housekeepers ✅ Nannies ✅ Cleaners ✅ Home Care ✅ Trusted Professionals ✅ Contact admin via WhatsApp! 🇬🇭 #DomesticWorkersGhana #HomeCareGhana #HousekeepersGhana",
    images: [
      {
        url: "https://dataflexghana.com/images/ghana-domestic-workers-showcase.jpg",
        alt: "Ghana Domestic Workers - Housekeepers, Nannies, Cleaners & Home Care Services",
      },
    ],
  },
  alternates: {
    canonical: "https://dataflexghana.com/domestic-workers",
  },
  other: {
    "geo.region": "GH",
    "geo.placename": "Ghana",
    "geo.position": "7.9465;-1.0232",
    ICBM: "7.9465, -1.0232",
    "apple-mobile-web-app-title": "Ghana Domestic Workers",
    "application-name": "DataFlex Domestic Workers",
    "msapplication-TileColor": "#15803d",
    "msapplication-config": "/browserconfig.xml",
  },
  generator: "Next.js",
  category: "Domestic Services",
  classification: "Domestic Workers, Home Care Services, Ghana Domestic Help",
}

// JSON-LD structured data for better SEO
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://dataflexghana.com/domestic-workers#website",
      url: "https://dataflexghana.com/domestic-workers",
      name: "DataFlex Domestic Workers - Ghana Home Care Services",
      description:
        "Find trusted domestic workers in Ghana. Browse experienced housekeepers, nannies, cleaners, and home care professionals across all regions of Ghana.",
      publisher: {
        "@type": "Organization",
        name: "DataFlex Ghana",
        url: "https://dataflexghana.com",
        logo: {
          "@type": "ImageObject",
          url: "https://dataflexghana.com/images/logo.png",
        },
      },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://dataflexghana.com/domestic-workers?search={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Service",
      "@id": "https://dataflexghana.com/domestic-workers#service",
      name: "Ghana Domestic Workers Service",
      description:
        "Comprehensive domestic worker placement service covering housekeepers, nannies, cleaners, and home care professionals across Ghana",
      provider: {
        "@type": "Organization",
        name: "DataFlex Ghana",
        url: "https://dataflexghana.com",
      },
      areaServed: {
        "@type": "Country",
        name: "Ghana",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Ghana Domestic Workers",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Housekeeping Services",
              description: "Professional housekeepers for cleaning, cooking, and home maintenance",
              category: "Domestic Services",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Childcare Services",
              description: "Experienced nannies and childcare professionals",
              category: "Domestic Services",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Cleaning Services",
              description: "Professional cleaning services for homes and offices",
              category: "Domestic Services",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Elder Care Services",
              description: "Compassionate care for elderly family members",
              category: "Domestic Services",
            },
          },
        ],
      },
    },
  ],
}

export default function DomesticWorkersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <DomesticWorkersClient />
      <DomesticWorkersWhatsAppDialog />
    </>
  )
}

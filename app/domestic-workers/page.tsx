import type { Metadata } from "next"
import DomesticWorkersClientPage from "@/components/public/domestic-workers/DomesticWorkersClientPage"

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
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://dataflexghana.com"}/images/domestic-workers-og.jpg`,
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
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://dataflexghana.com"}/images/domestic-workers-og.jpg`,
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

export default function DomesticWorkersPage() {
  return (
    <>
      <DomesticWorkersClientPage />
    </>
  )
}

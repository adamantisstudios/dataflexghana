import type { Metadata } from "next"
import type { ReactNode } from "react"

const SITE_URL = "https://www.dataflexghana.com"
const PAGE_PATH = "/foodandGroceries"
const OG_IMAGE_PATH = "/images/grocery-hero-4/grocery-hero-4.jpg"

const PAGE_TITLE = "Grocery Delivery Accra – Fresh Food, No Stress | Dataflex Ghana"
const PAGE_DESCRIPTION =
  "Submit your shopping list and get fresh, hygienic groceries delivered to your door anywhere in Accra. No account needed, one-time commitment fee. Fast, personal concierge service for busy professionals, families, and offices. Try Dataflex Grocery Concierge today!"

const PAGE_KEYWORDS = [
  "grocery delivery Accra",
  "foodstuff delivery Ghana",
  "fresh groceries Accra",
  "online grocery Accra",
  "concierge shopping Ghana",
  "Dataflex Ghana",
  "Accra grocery service",
  "home delivery Ghana",
  "fresh produce",
  "stress-free shopping",
]

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: PAGE_KEYWORDS,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: `${SITE_URL}${PAGE_PATH}`,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: PAGE_PATH,
    siteName: "Dataflex Ghana",
    locale: "en_GH",
    images: [
      {
        url: OG_IMAGE_PATH,
        secureUrl: `${SITE_URL}${OG_IMAGE_PATH}`,
        width: 1920,
        height: 1280,
        alt: "Fresh groceries and produce — Dataflex Ghana grocery concierge in Accra",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [`${SITE_URL}${OG_IMAGE_PATH}`],
  },
}

export default function FoodAndGroceriesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap"
      />
      <div
        className="min-h-screen bg-[#0A5C2A] text-[#1F2937]"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {children}
      </div>
    </>
  )
}

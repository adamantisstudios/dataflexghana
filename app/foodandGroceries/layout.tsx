import type { Metadata } from "next"
import type { ReactNode } from "react"

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dataflexghana.com").replace(/\/$/, "")

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Grocery Delivery Accra – Submit Your Shopping List | Dataflex Ghana",
  description:
    "Request concierge grocery shopping in Ghana. Pay a small commitment fee, send your market list, and DataFlex coordinates fresh groceries and delivery to your door.",
  openGraph: {
    title: "Dataflex Ghana – Grocery Concierge | Fresh Food, No Stress",
    description:
      "Submit your shopping list and get fresh groceries delivered to your door in Accra. No account needed. Try it today!",
    type: "website",
    url: "/foodandGroceries",
    siteName: "Dataflex Ghana",
    locale: "en_GH",
    images: [
      {
        url: "/images/grocery-og.jpg",
        width: 1200,
        height: 630,
        alt: "Fresh groceries and produce — Dataflex Ghana grocery concierge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dataflex Ghana – Grocery Concierge | Fresh Food, No Stress",
    description:
      "Submit your shopping list and get fresh groceries delivered to your door in Accra. No account needed. Try it today!",
    images: ["/images/grocery-og.jpg"],
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

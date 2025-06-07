import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { WhatsAppChat } from "@/components/whatsapp-chat"
import { WhatsAppChannelPopup } from "@/components/whatsapp-channel-popup"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DataFlex Ghana - Affordable Data Bundles & Digital Services",
  description:
    "Ghana's cheapest data bundles from MTN, Telecel, and AirtelTigo. Save up to 20% on data plans. ECG top-up, software installation, CV writing services.",
  keywords:
    "data bundles, Ghana, MTN, Telecel, AirtelTigo, cheap data, internet, mobile data, ECG prepaid, software installation, CV writing",
  openGraph: {
    type: "website",
    url: "https://dataflexghana.com/",
    title: "DataFlex Ghana - Affordable Data Bundles & Digital Services",
    description: "Ghana's cheapest data bundles from MTN, Telecel, and AirtelTigo. Save up to 20% on data plans.",
    images: [
      {
        url: "https://dataflexghana.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DataFlex Ghana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DataFlex Ghana - Affordable Data Bundles & Digital Services",
    description: "Ghana's cheapest data bundles from MTN, Telecel, and AirtelTigo. Save up to 20% on data plans.",
    images: ["https://dataflexghana.com/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#25d366",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* External Stylesheets */}
        <link rel="stylesheet" href="/styles.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css"
        />
      </head>
      <body className={inter.className}>
        {children}
        <WhatsAppChat />
        <WhatsAppChannelPopup />
      </body>
    </html>
  )
}

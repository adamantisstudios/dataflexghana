"use client"
import DomesticWorkersClient from "@/components/public/domestic-workers/DomesticWorkersClient"
import DomesticWorkersWhatsAppDialog from "@/components/public/domestic-workers/DomesticWorkersWhatsAppDialog"
import { DomesticWorkerSlideUpNotification } from "@/components/public/domestic-workers/DomesticWorkerSlideUpNotification"
import { useState, useEffect } from "react"

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

export default function DomesticWorkersClientPage() {
  const [showSlideUp, setShowSlideUp] = useState(false)
  const [shouldAutoClose, setShouldAutoClose] = useState(false)

  useEffect(() => {
    // Show slide-up after 8 seconds of page load
    const showTimer = setTimeout(() => {
      setShowSlideUp(true)
    }, 8000)

    // Auto-close after another 8 seconds (16 seconds total from page load)
    const closeTimer = setTimeout(() => {
      setShouldAutoClose(true)
      setShowSlideUp(false)
    }, 16000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(closeTimer)
    }
  }, [])

  const handleCloseSlideUp = () => {
    setShowSlideUp(false)
  }

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
      <DomesticWorkerSlideUpNotification isOpen={showSlideUp} onClose={handleCloseSlideUp} variant="public" />
    </>
  )
}

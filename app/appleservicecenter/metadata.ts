import type { Metadata } from "next"

export const appleServiceCenterMetadata: Metadata = {
  title: "Apple Device Repair Service Accra Ghana | iPhone, iPad, MacBook Repair - DataFlex",
  description:
    "Professional Apple device repair service in Accra, Ghana. Expert iPhone, iPad, MacBook & Apple Watch repairs. Free pickup & delivery, certified technicians, 24-48hr turnaround, warranty on repairs. ₵250-₵800 per service. Call +233 242 799 990 today.",
  keywords: [
    // Primary local keywords
    "Apple repair Accra Ghana",
    "iPhone repair Accra",
    "iPad repair Accra",
    "MacBook repair Accra",
    "Apple Watch repair Accra",
    "Apple device repair Ghana",
    "iPhone screen repair Accra",
    "iPhone battery replacement Accra",
    "Apple repair service Ghana",
    "Phone repair Accra Ghana",

    // Service-specific keywords
    "iPhone screen replacement Accra",
    "iPhone battery replacement Accra",
    "iPhone charging port repair Accra",
    "iPhone water damage repair Accra",
    "iPhone camera repair Accra",
    "iPhone motherboard repair Accra",
    "iPad screen replacement Accra",
    "MacBook repair Accra",
    "Apple Watch repair Accra",

    // Local area keywords
    "phone repair near me Accra",
    "Apple repair near me Accra",
    "device repair service Accra",
    "electronics repair Accra",

    // Broader Ghana keywords
    "Apple repair Ghana",
    "best phone repair Ghana",
    "certified Apple repair Ghana",
    "professional device repair Ghana",
    "smartphone repair services Ghana",

    // Keyword phrases with modifiers
    "affordable Apple repair Accra",
    "fast Apple repair Accra",
    "reliable Apple repair Accra",
    "certified Apple technician Accra",
    "Apple authorized repair Accra",
    "same day phone repair Accra",
    "quick device repair Accra",
    "professional iPhone repair Accra",

    // Transactional keywords
    "Apple repair cost Accra",
    "iPhone repair price Accra",
    "how much iPhone repair costs Ghana",
    "Apple device repair cost Ghana",

    // Featured service keywords
    "free phone pickup Accra",
    "phone pickup and delivery Accra",
    "home device repair service Accra",
    "mobile repair shop Accra",
  ],
  authors: [{ name: "DataFlex Apple Service Center" }],
  creator: "DataFlex Ghana",
  publisher: "DataFlex",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1, notranslate",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://dataflexghana.com/appleservicecenter",
    siteName: "DataFlex Apple Service Center - Accra Ghana",
    title: "Professional Apple Device Repair Service Accra Ghana | DataFlex",
    description:
      "Expert Apple repair in Accra, Ghana. iPhone, iPad, MacBook repairs by certified technicians. Free pickup & delivery, ₵250-₵800, 24-48hr turnaround. WhatsApp +233 242 799 990",
    images: [
      {
        url: "https://dataflexghana.com/apple-device-repair-center.jpg",
        width: 1200,
        height: 630,
        alt: "Apple Device Repair Center - Professional iPhone, iPad, MacBook Repairs in Accra Ghana",
        type: "image/jpeg",
      },
      {
        url: "https://dataflexghana.com/technician-repairing-iphone.jpg",
        width: 800,
        height: 600,
        alt: "Expert Apple technician repairing iPhone with professional tools",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DataFlexGhana",
    creator: "@DataFlexGhana",
    title: "Apple Device Repair Accra Ghana | iPhone, iPad & MacBook Repair",
    description:
      "Professional Apple repair in Accra. iPhone screen, battery, charging port & more. Certified technicians, free pickup/delivery, 24-48hr turnaround. +233 242 799 990",
    images: [
      {
        url: "https://dataflexghana.com/apple-device-repair-center.jpg",
        alt: "Apple Device Repair Service in Accra Ghana",
      },
    ],
  },
  alternates: {
    canonical: "https://dataflexghana.com/appleservicecenter",
  },
  other: {
    "geo.region": "GH-GA",
    "geo.placename": "Accra",
    "geo.position": "5.6037;-0.1870",
    ICBM: "5.6037, -0.1870",
    "business.type": "Electronics Repair Service",
    "business.service_area": "Accra, Greater Accra, Ghana",
    "business.phone": "+233242799990",
    "business.hours": "Monday - Friday: 9AM - 6PM, Saturday: 10AM - 4PM, Sunday: Closed",
    "apple-mobile-web-app-title": "DataFlex Apple Repair",
    "format-detection": "telephone=yes, email=yes, address=yes",
  },
}

export const appleServiceCenterSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://dataflexghana.com/appleservicecenter/#business",
      name: "DataFlex Apple Service Center",
      description: "Professional Apple device repair service in Accra, Ghana",
      url: "https://dataflexghana.com/appleservicecenter",
      image: {
        "@type": "ImageObject",
        url: "https://dataflexghana.com/apple-device-repair-center.jpg",
        width: 1200,
        height: 630,
      },
      priceRange: "GH₵250 - GH₵800",
      areaServed: [
        {
          "@type": "City",
          name: "Accra",
          "@id": "https://en.wikipedia.org/wiki/Accra",
        },
        {
          "@type": "AdministrativeArea",
          name: "Greater Accra",
        },
        {
          "@type": "Country",
          name: "Ghana",
        },
      ],
      address: {
        "@type": "PostalAddress",
        streetAddress: "Accra, Ghana",
        addressLocality: "Accra",
        addressRegion: "Greater Accra",
        postalCode: "",
        addressCountry: "GH",
      },
      telephone: "+233242799990",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer Service",
        telephone: "+233242799990",
        availableLanguage: ["en", "tw", "ha"],
      },
      sameAs: [
        "https://wa.me/233242799990",
        "https://facebook.com/dataflexghana",
        "https://instagram.com/dataflexghana",
      ],
      hasOfferingDescription: [
        {
          "@type": "Offer",
          name: "iPhone Repair Services",
          description: "Professional iPhone screen, battery, and component repairs",
          priceCurrency: "GHS",
          price: "250",
          priceValidUntil: "2025-12-31",
        },
        {
          "@type": "Offer",
          name: "iPad Repair Services",
          description: "Expert iPad screen and battery replacement",
          priceCurrency: "GHS",
          price: "250",
          priceValidUntil: "2025-12-31",
        },
        {
          "@type": "Offer",
          name: "MacBook Repair Services",
          description: "Professional MacBook repair and maintenance",
          priceCurrency: "GHS",
          price: "500",
          priceValidUntil: "2025-12-31",
        },
      ],
      service: [
        {
          "@type": "Service",
          name: "iPhone Screen Replacement",
          description: "Professional iPhone screen replacement with premium glass",
          offers: {
            "@type": "Offer",
            priceCurrency: "GHS",
            price: "250",
          },
        },
        {
          "@type": "Service",
          name: "Battery Replacement",
          description: "Original capacity battery replacement with warranty",
          offers: {
            "@type": "Offer",
            priceCurrency: "GHS",
            price: "120",
          },
        },
        {
          "@type": "Service",
          name: "Water Damage Restoration",
          description: "Complete water damage assessment and repair",
          offers: {
            "@type": "Offer",
            priceCurrency: "GHS",
            price: "500",
          },
        },
        {
          "@type": "Service",
          name: "Motherboard Repair",
          description: "Complex motherboard diagnostic and repair",
          offers: {
            "@type": "Offer",
            priceCurrency: "GHS",
            price: "800",
          },
        },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "156",
        bestRating: "5",
        worstRating: "1",
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://dataflexghana.com/appleservicecenter/#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://dataflexghana.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Services",
          item: "https://dataflexghana.com#services",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Apple Service Center",
          item: "https://dataflexghana.com/appleservicecenter",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://dataflexghana.com/appleservicecenter/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "How much does iPhone screen replacement cost in Accra?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "iPhone screen replacement costs GH₵250 at our DataFlex Apple Service Center in Accra. This includes professional installation with premium glass and a warranty on the repair.",
          },
        },
        {
          "@type": "Question",
          name: "Do you offer free pickup and delivery in Accra?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, we offer free pickup and delivery service throughout Accra. Simply contact us via WhatsApp at +233 242 799 990 and we'll collect your device from your location.",
          },
        },
        {
          "@type": "Question",
          name: "How long does Apple device repair take?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Most Apple device repairs are completed within 24-48 hours. Complex repairs like motherboard fixes may take longer. We'll provide a timeline when you contact us.",
          },
        },
        {
          "@type": "Question",
          name: "Are your technicians certified?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, all our technicians are certified professionals trained to handle all types of Apple devices including iPhones, iPads, MacBooks, and Apple Watches.",
          },
        },
        {
          "@type": "Question",
          name: "Do you provide warranty on repairs?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, we provide warranty on all our repairs. All components and labor are guaranteed to ensure your device works perfectly after repair.",
          },
        },
        {
          "@type": "Question",
          name: "What Apple devices do you repair?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We repair all Apple devices including iPhones, iPads, MacBooks, Apple Watches, and other Apple products. Common repairs include screen replacement, battery replacement, charging port repair, water damage restoration, and motherboard repair.",
          },
        },
        {
          "@type": "Question",
          name: "Can you repair water-damaged Apple devices?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, we offer water damage restoration services for Apple devices. Our technicians will assess the damage and repair or replace affected components. The service costs GH₵500 and includes complete diagnosis.",
          },
        },
        {
          "@type": "Question",
          name: "How do I book a repair service?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can book a repair by clicking 'Request Service Now' on our website, or contact us directly via WhatsApp at +233 242 799 990. Our team will guide you through the process.",
          },
        },
      ],
    },
  ],
}

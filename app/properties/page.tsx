import type { Metadata } from "next"
import PublicPropertiesClient from "@/components/public/properties/PublicPropertiesClient"

// SEO-optimized metadata for Ghana property market
export const metadata: Metadata = {
  title: "Properties for Sale & Rent in Ghana | Houses, Apartments, Land & Commercial Properties",
  description:
    "Find the best properties for sale and rent in Ghana. Browse houses, apartments, land, commercial properties, and luxury estates in Accra, Tema, Kumasi, and across Ghana. Contact property owners directly via WhatsApp.",
  keywords: [
    // Primary property keywords
    "properties for sale Ghana",
    "houses for rent Ghana",
    "apartments for sale Accra",
    "land for sale Ghana",
    "commercial properties Ghana",
    "real estate Ghana",
    "property listings Ghana",

    // Location-specific keywords
    "properties East Legon",
    "houses Tema",
    "apartments Airport Residential",
    "land Oyibi",
    "commercial Cantonments",
    "properties Spintex",
    "houses Adenta",
    "apartments Labone",

    // Property types
    "luxury properties Ghana",
    "executive apartments Ghana",
    "residential land Ghana",
    "office space Ghana",
    "warehouse Ghana",
    "new developments Ghana",
    "estate properties Ghana",

    // Buying/renting keywords
    "buy house Ghana",
    "rent apartment Ghana",
    "property investment Ghana",
    "real estate investment Ghana",
    "property developers Ghana",
    "estate agents Ghana",

    // Currency and pricing
    "properties Ghana cedis",
    "properties USD Ghana",
    "affordable houses Ghana",
    "luxury real estate Ghana",

    // Contact and interaction
    "WhatsApp property Ghana",
    "contact property owner Ghana",
    "property enquiry Ghana",
    "real estate contact Ghana",
  ].join(", "),
  authors: [{ name: "DataFlex Ghana Properties" }],
  creator: "DataFlex Ghana",
  publisher: "DataFlex Properties Platform",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://dataflexghana.com/properties",
    siteName: "DataFlex Properties - Ghana Real Estate Listings",
    title: "Properties for Sale & Rent in Ghana | Houses, Apartments, Land & Commercial",
    description:
      "Discover premium properties across Ghana! Browse houses for sale, apartments for rent, commercial properties, and land in Accra, Tema, Kumasi. Contact property owners directly via WhatsApp for instant communication.",
    images: [
      {
        url: "https://dataflexghana.com/images/ghana-properties-showcase.jpg",
        width: 1200,
        height: 630,
        alt: "Properties for Sale and Rent in Ghana - Houses, Apartments, Land, Commercial",
        type: "image/jpeg",
      },
      {
        url: "https://dataflexghana.com/images/diverse-property-showcase.png",
        width: 800,
        height: 600,
        alt: "Diverse property listings across Ghana including luxury homes and commercial spaces",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DataFlexGhana",
    creator: "@DataFlexGhana",
    title: "🏠 Properties for Sale & Rent in Ghana | Real Estate Listings",
    description:
      "🏡 Houses for Sale ✅ Apartments for Rent ✅ Commercial Properties ✅ Land for Sale ✅ Luxury Estates ✅ Contact owners via WhatsApp! 🇬🇭 #GhanaProperties #RealEstateGhana #PropertiesForSale #AccraProperties",
    images: [
      {
        url: "https://dataflexghana.com/images/ghana-properties-showcase.jpg",
        alt: "Ghana Properties - Houses, Apartments, Land & Commercial Properties for Sale and Rent",
      },
    ],
  },
  alternates: {
    canonical: "https://dataflexghana.com/properties",
  },
  other: {
    "geo.region": "GH",
    "geo.placename": "Ghana",
    "geo.position": "7.9465;-1.0232",
    ICBM: "7.9465, -1.0232",
    "apple-mobile-web-app-title": "Ghana Properties",
    "application-name": "DataFlex Properties",
    "msapplication-TileColor": "#10b981",
    "msapplication-config": "/browserconfig.xml",
  },
  generator: "Next.js",
  category: "Real Estate",
  classification: "Property Listings, Real Estate, Ghana Properties",
}

// JSON-LD structured data for better SEO
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://dataflexghana.com/properties#website",
      url: "https://dataflexghana.com/properties",
      name: "DataFlex Properties - Ghana Real Estate Listings",
      description:
        "Find the best properties for sale and rent in Ghana. Browse houses, apartments, land, and commercial properties across Accra, Tema, Kumasi, and all regions of Ghana.",
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
        target: "https://dataflexghana.com/properties?search={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "RealEstateAgent",
      "@id": "https://dataflexghana.com/properties#organization",
      name: "DataFlex Properties Ghana",
      description: "Leading property listing platform in Ghana connecting buyers, sellers, and renters",
      url: "https://dataflexghana.com/properties",
      logo: {
        "@type": "ImageObject",
        url: "https://dataflexghana.com/images/logo.png",
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: "GH",
        addressRegion: "Ghana",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+233-55-199-9901",
        contactType: "customer service",
        areaServed: "GH",
        availableLanguage: ["English", "Twi"],
      },
      areaServed: {
        "@type": "Country",
        name: "Ghana",
      },
      serviceArea: {
        "@type": "GeoCircle",
        geoMidpoint: {
          "@type": "GeoCoordinates",
          latitude: 7.9465,
          longitude: -1.0232,
        },
        geoRadius: "500000", // 500km radius covering all of Ghana
      },
    },
    {
      "@type": "Service",
      "@id": "https://dataflexghana.com/properties#service",
      name: "Ghana Property Listings Service",
      description:
        "Comprehensive property listing service covering houses for sale, apartments for rent, commercial properties, and land across Ghana",
      provider: {
        "@id": "https://dataflexghana.com/properties#organization",
      },
      areaServed: {
        "@type": "Country",
        name: "Ghana",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Ghana Property Listings",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: "Houses for Sale",
              description: "Residential houses and homes for sale across Ghana",
              category: "Real Estate",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: "Apartments for Rent",
              description: "Rental apartments and flats in prime locations across Ghana",
              category: "Real Estate",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: "Commercial Properties",
              description: "Office spaces, retail shops, and commercial buildings",
              category: "Real Estate",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: "Land for Sale",
              description: "Residential and commercial land plots with registered titles",
              category: "Real Estate",
            },
          },
        ],
      },
    },
  ],
}

export default function PublicPropertiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <PublicPropertiesClient />
    </>
  )
}

import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com"

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/_next/", "/scripts/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

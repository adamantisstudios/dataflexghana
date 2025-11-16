import type { Metadata } from "next"

export interface SEOData {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
  type?: "website" | "article"
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

export function generateSEOMetadata(data: SEOData): Metadata {
  const {
    title,
    description,
    keywords,
    image,
    url,
    type = "website",
    publishedTime,
    modifiedTime,
    author,
    section,
    tags,
  } = data

  const metadata: Metadata = {
    title,
    description,
    keywords,
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title,
      description,
      type,
      url,
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
      publishedTime,
      modifiedTime,
      section,
      tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: url,
    },
  }

  return metadata
}

export function generateBlogStructuredData(blog: {
  title: string
  description: string
  content: string
  featured_image_url?: string
  published_at: string
  updated_at: string
  slug: string
  reading_time: number
  category?: {
    name: string
  }
  tags?: string[]
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.description,
    image: blog.featured_image_url
      ? {
          "@type": "ImageObject",
          url: blog.featured_image_url,
          width: 1200,
          height: 630,
        }
      : undefined,
    datePublished: blog.published_at,
    dateModified: blog.updated_at,
    author: {
      "@type": "Organization",
      name: "DataFlex",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com",
    },
    publisher: {
      "@type": "Organization",
      name: "DataFlex",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com"}/logo.png`,
        width: 200,
        height: 60,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com"}/blogs/${blog.slug}`,
    },
    articleSection: blog.category?.name,
    keywords: blog.tags?.join(", "),
    wordCount: blog.content.split(/\s+/).length,
    timeRequired: `PT${blog.reading_time}M`,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com"}/blogs/${blog.slug}`,
  }

  return structuredData
}

export function generateBlogListStructuredData(
  blogs: Array<{
    title: string
    description: string
    slug: string
    published_at: string
    featured_image_url?: string
  }>,
) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "DataFlex Blog",
    description: "Latest insights, tips, and industry news from DataFlex experts",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com"}/blogs`,
    publisher: {
      "@type": "Organization",
      name: "DataFlex",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com",
    },
    blogPost: blogs.map((blog) => ({
      "@type": "BlogPosting",
      headline: blog.title,
      description: blog.description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com"}/blogs/${blog.slug}`,
      datePublished: blog.published_at,
      image: blog.featured_image_url,
    })),
  }

  return structuredData
}

export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DataFlex",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com",
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com"}/logo.png`,
    description: "Leading data management and business solutions provider",
    sameAs: [
      // Add your social media URLs here
      "https://twitter.com/dataflex",
      "https://linkedin.com/company/dataflex",
      "https://facebook.com/dataflex",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-555-0123", // Replace with actual phone
      contactType: "customer service",
      availableLanguage: "English",
    },
  }
}

export function generateWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DataFlex",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com",
    description: "Leading data management and business solutions provider",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://dataflex.com"}/blogs?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

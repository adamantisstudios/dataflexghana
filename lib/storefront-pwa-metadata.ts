import type { Metadata } from "next"
import { getStorefrontOrigin } from "@/lib/storefront-utils"

export const STOREFRONT_PWA_ICON = "/images/data-bundles.png"

export type StorefrontMetaFields = {
  agentId: string
  storeName: string
  businessInfo: string | null
  storeSlug: string | null
}

export function storefrontManifestPath(agentId: string): string {
  return `/api/storefront/${agentId}/manifest`
}

export function storefrontStoreDescription(storeName: string, businessInfo: string | null): string {
  const trimmed = businessInfo?.trim()
  if (trimmed) return trimmed.slice(0, 200)
  return `Shop data bundles and more at ${storeName}.`
}

export function storefrontPublicImageUrl(origin?: string): string {
  const base = (origin || getStorefrontOrigin()).replace(/\/$/, "")
  return `${base}${STOREFRONT_PWA_ICON}`
}

/** PWA install / Add to Home Screen metadata (no DataFlex branding). */
export function buildStorefrontPwaMetadata(fields: StorefrontMetaFields): Metadata {
  const title = fields.storeName
  const description = storefrontStoreDescription(title, fields.businessInfo)

  return {
    title,
    description,
    applicationName: title,
    manifest: storefrontManifestPath(fields.agentId),
    icons: {
      icon: [{ url: STOREFRONT_PWA_ICON, sizes: "512x512", type: "image/png" }],
      apple: [{ url: STOREFRONT_PWA_ICON, sizes: "512x512", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      title,
      statusBarStyle: "default",
    },
    other: {
      "apple-mobile-web-app-title": title,
      "application-name": title,
    },
  }
}

/** Full page metadata including link previews when sharing the storefront. */
export function buildStorefrontPageMetadata(
  fields: StorefrontMetaFields,
  pageUrl: string,
  origin?: string,
): Metadata {
  const pwa = buildStorefrontPwaMetadata(fields)
  const title = fields.storeName
  const description = storefrontStoreDescription(title, fields.businessInfo)
  const imageUrl = storefrontPublicImageUrl(origin)

  return {
    ...pwa,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: title,
      images: [{ url: imageUrl, width: 512, height: 512, alt: title, type: "image/png" }],
      locale: "en_GH",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [imageUrl],
    },
  }
}

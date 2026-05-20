import type { NextRequest } from "next/server"

export const DEFAULT_STOREFRONT_ORIGIN = "https://referralpowerhouse.vercel.app"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "")
}

/**
 * Canonical storefront origin for public links, QR codes, share buttons, metadata, and Paystack.
 * Uses NEXT_PUBLIC_STOREFRONT_ORIGIN when set; never window.location or the main app domain.
 */
export function getStorefrontOrigin(): string {
  const envOrigin = process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN?.trim()
  if (envOrigin) {
    return stripTrailingSlash(envOrigin)
  }
  return DEFAULT_STOREFRONT_ORIGIN
}

/** @deprecated Alias — use getStorefrontOrigin */
export function getStorefrontPublicOrigin(): string {
  return getStorefrontOrigin()
}

/**
 * Server-side storefront origin (Paystack callbacks, redirects).
 * Same as getStorefrontOrigin — request host is intentionally ignored.
 */
export function getStorefrontServerOrigin(_request?: NextRequest): string {
  return getStorefrontOrigin()
}

/** Paystack `callback_url` — always on the public storefront domain. */
export function getStorefrontPaystackCallbackUrl(request?: NextRequest): string {
  return `${getStorefrontServerOrigin(request)}/api/paystack/storefront/callback`
}

/** Full URL: `{origin}/store/{segment}` */
export function buildStorefrontPathUrl(origin: string, segment: string): string {
  const safeSegment = segment.trim() || ""
  return `${stripTrailingSlash(origin)}/store/${encodeURIComponent(safeSegment)}`
}

export function getStorefrontPublicBase(): string {
  return `${getStorefrontOrigin()}/store`
}

/** Static fallback for metadata when env is unavailable at build time. */
export const STOREFRONT_PUBLIC_BASE = `${DEFAULT_STOREFRONT_ORIGIN}/store`

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export function normalizeStoreSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function isValidStoreSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 40 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function buildStorefrontUrl(
  agentId: string,
  storeSlug?: string | null,
  storeSegment?: string | null,
): string {
  const segment = storeSegment?.trim() || storeSlug?.trim() || agentId
  return buildStorefrontPathUrl(getStorefrontOrigin(), segment)
}

export function normalizeProvider(provider: string): string {
  const u = (provider || "").toUpperCase()
  if (u.includes("MTN")) return "MTN"
  if (u.includes("TELECEL") || u.includes("VODAFONE")) return "Telecel"
  if (u.includes("AIRTEL") || u.includes("TIGO")) return "AirtelTigo"
  return provider
}

export const BUNDLE_NETWORKS = ["MTN", "Telecel", "AirtelTigo"] as const

export type BundleNetwork = (typeof BUNDLE_NETWORKS)[number]

export function providerDbValues(network: BundleNetwork): string[] {
  switch (network) {
    case "MTN":
      return ["MTN", "mtn"]
    case "Telecel":
      return ["Telecel", "TELECEL", "Vodafone", "vodafone"]
    case "AirtelTigo":
      return ["AirtelTigo", "AIRTELTIGO", "Airtel Tigo", "AT"]
    default:
      return [network]
  }
}

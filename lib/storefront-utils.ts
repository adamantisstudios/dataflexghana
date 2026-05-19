import type { NextRequest } from "next/server"
import { resolveOriginFromRequest } from "@/lib/app-url"

export const DEFAULT_STOREFRONT_ORIGIN = "https://referralpowerhouse.vercel.app"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "")
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname
    return host === "localhost" || host === "127.0.0.1"
  } catch {
    return /localhost|127\.0\.0\.1/i.test(origin)
  }
}

function isStorefrontHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (lower === "referralpowerhouse.vercel.app") return true
  if (lower.endsWith(".referralpowerhouse.vercel.app")) return true
  const extra = process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN?.trim()
  if (extra) {
    try {
      if (new URL(extra).hostname.toLowerCase() === lower) return true
    } catch {
      /* ignore */
    }
  }
  return false
}

/**
 * Server-side storefront origin for Paystack callbacks and post-payment redirects.
 * Never uses VERCEL_URL or generic *.vercel.app deployment hosts.
 */
export function getStorefrontServerOrigin(request?: NextRequest): string {
  const envOrigin = process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN?.trim()
  if (envOrigin && !isLocalhostOrigin(envOrigin)) {
    return stripTrailingSlash(envOrigin)
  }

  if (request) {
    const fromRequest = resolveOriginFromRequest(request)
    if (fromRequest) {
      if (isLocalhostOrigin(fromRequest)) {
        return stripTrailingSlash(fromRequest)
      }
      try {
        const host = new URL(fromRequest).hostname
        if (isStorefrontHostname(host)) {
          return stripTrailingSlash(fromRequest)
        }
      } catch {
        /* fall through */
      }
    }
  }

  return DEFAULT_STOREFRONT_ORIGIN
}

/** Paystack `callback_url` — always on the public storefront domain in production. */
export function getStorefrontPaystackCallbackUrl(request?: NextRequest): string {
  return `${getStorefrontServerOrigin(request)}/api/paystack/storefront/callback`
}

/** Build `/store/{segment}` on a specific origin (server redirects). */
export function buildStorefrontPathUrl(
  origin: string,
  segment: string,
): string {
  const safeSegment = segment.trim() || ""
  return `${stripTrailingSlash(origin)}/store/${encodeURIComponent(safeSegment)}`
}

/**
 * Origin used for public storefront links and QR codes.
 * 1. NEXT_PUBLIC_STOREFRONT_ORIGIN (if set and not localhost)
 * 2. Current browser host on the client (if not localhost)
 * 3. Production default — never NEXT_PUBLIC_APP_URL (often localhost in dev builds)
 */
export function getStorefrontPublicOrigin(): string {
  const envOrigin = process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN?.trim()
  if (envOrigin && !isLocalhostOrigin(envOrigin)) {
    return envOrigin.replace(/\/$/, "")
  }

  if (typeof window !== "undefined") {
    const hostOrigin = window.location.origin
    if (!isLocalhostOrigin(hostOrigin)) {
      return hostOrigin.replace(/\/$/, "")
    }
  }

  return DEFAULT_STOREFRONT_ORIGIN
}

export function getStorefrontPublicBase(): string {
  return `${getStorefrontPublicOrigin()}/store`
}

/** Static fallback for metadata; prefer getStorefrontPublicBase() at runtime. */
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
  return `${getStorefrontPublicOrigin()}/store/${segment}`
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

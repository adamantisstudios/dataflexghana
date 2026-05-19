import type { NextRequest } from "next/server"

const PRODUCTION_STOREFRONT_ORIGIN =
  process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN ||
  "https://referralpowerhouse.vercel.app"

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "")
}

function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return host === "localhost" || host === "127.0.0.1"
  } catch {
    return url.includes("localhost") || url.includes("127.0.0.1")
  }
}

/** Origin from incoming request (Vercel / reverse proxy). */
export function resolveOriginFromRequest(request: NextRequest): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https"
  if (forwardedHost) {
    return stripTrailingSlash(`${forwardedProto}://${forwardedHost.split(",")[0].trim()}`)
  }

  const host = request.headers.get("host")
  if (!host) return null

  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")

  return stripTrailingSlash(`${proto}://${host}`)
}

/**
 * Base URL for server-side Paystack callbacks and redirects.
 * Prefers non-localhost env vars, then request origin, then production defaults.
 */
export function getServerAppBaseUrl(request?: NextRequest): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean) as string[]

  for (const url of candidates) {
    const normalized = stripTrailingSlash(url)
    if (!isLocalhostUrl(normalized)) return normalized
  }

  if (request) {
    const fromRequest = resolveOriginFromRequest(request)
    if (fromRequest && !isLocalhostUrl(fromRequest)) return fromRequest
  }

  if (process.env.NODE_ENV === "production") {
    return stripTrailingSlash(PRODUCTION_STOREFRONT_ORIGIN)
  }

  const localhost =
    candidates.find((u) => isLocalhostUrl(u)) ||
    (request ? resolveOriginFromRequest(request) : null) ||
    "http://localhost:3000"

  return stripTrailingSlash(localhost)
}

export const STOREFRONT_PUBLIC_BASE = "https://referralpowerhouse.vercel.app/store"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

export function buildStorefrontUrl(agentId: string, storeSlug?: string | null): string {
  const segment = storeSlug?.trim() || agentId
  return `${STOREFRONT_PUBLIC_BASE}/${segment}`
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

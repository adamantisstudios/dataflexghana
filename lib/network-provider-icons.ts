/** Network logos — same paths as `/agent/data-order` and agent dashboard. */

export const NETWORK_PROVIDER_IMAGES = {
  MTN: "/images/mtn.jpg",
  AirtelTigo: "/images/airteltigo.jpg",
  Telecel: "/images/telecel.jpg",
} as const

export type NetworkProviderKey = keyof typeof NETWORK_PROVIDER_IMAGES

export function normalizeNetworkProvider(provider: string): NetworkProviderKey | null {
  const u = (provider || "").toUpperCase()
  if (u.includes("MTN")) return "MTN"
  if (u.includes("TELECEL") || u.includes("VODAFONE")) return "Telecel"
  if (u.includes("AIRTEL") || u.includes("TIGO")) return "AirtelTigo"
  return null
}

export function getNetworkProviderImage(provider: string): string {
  const key = normalizeNetworkProvider(provider)
  return key ? NETWORK_PROVIDER_IMAGES[key] : NETWORK_PROVIDER_IMAGES.MTN
}

/** Upgrade http image URLs to https to avoid mixed-content blocking on HTTPS pages. */
export function ensureHttpsImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return ""
  const trimmed = url.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`
  }
  return trimmed
}

export function ensureHttpsImageUrls(urls: string[] | null | undefined): string[] {
  if (!urls?.length) return []
  return urls.map((u) => ensureHttpsImageUrl(u)).filter(Boolean)
}

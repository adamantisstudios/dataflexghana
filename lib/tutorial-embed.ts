const ALLOWED_HOSTS = [
  "player.vimeo.com",
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
]

export function extractIframeSrc(html: string): string | null {
  const match = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)
  return match?.[1] ?? null
}

export function detectPlatformFromEmbed(html: string): "vimeo" | "youtube" | null {
  const src = extractIframeSrc(html)
  if (!src) return null
  if (src.includes("vimeo.com")) return "vimeo"
  if (src.includes("youtube.com") || src.includes("youtu.be")) return "youtube"
  return null
}

export function isAllowedEmbedSrc(src: string): boolean {
  try {
    const url = new URL(src)
    return ALLOWED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

/** Strip to a single iframe from Vimeo or YouTube only. */
export function sanitizeTutorialEmbed(html: string): string {
  const trimmed = html.trim()
  const iframeMatch = trimmed.match(/<iframe[\s\S]*?<\/iframe>/i)
  if (!iframeMatch) return ""

  const iframe = iframeMatch[0]
  const src = extractIframeSrc(iframe)
  if (!src || !isAllowedEmbedSrc(src)) return ""

  return iframe
}

export function buildLegacyVimeoEmbed(vimeoVideoId: string): string {
  return `<iframe src="https://player.vimeo.com/video/${vimeoVideoId}?playsinline=1&autoplay=1&muted=1&loop=1&controls=0&title=0&byline=0&portrait=0&dnt=1&transparent=0" width="1080" height="1920" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
}

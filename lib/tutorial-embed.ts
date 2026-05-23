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

/** Normalize embed iframe src for the agent TikTok-style feed. */
export function prepareAgentFeedEmbed(html: string): string {
  const sanitized = sanitizeTutorialEmbed(html)
  if (!sanitized) return ""

  const src = extractIframeSrc(sanitized)
  if (!src) return sanitized

  const platform = detectPlatformFromEmbed(sanitized)
  let newSrc = src

  if (platform === "vimeo") {
    const url = new URL(src)
    url.searchParams.set("playsinline", "1")
    url.searchParams.set("autoplay", "1")
    url.searchParams.set("muted", "1")
    url.searchParams.set("loop", "1")
    url.searchParams.set("controls", "0")
    url.searchParams.set("title", "0")
    url.searchParams.set("byline", "0")
    url.searchParams.set("portrait", "0")
    url.searchParams.set("dnt", "1")
    url.searchParams.set("transparent", "0")
    newSrc = url.toString()
  } else if (platform === "youtube") {
    const url = new URL(src)
    url.searchParams.set("autoplay", "1")
    url.searchParams.set("mute", "1")
    url.searchParams.set("controls", "1")
    url.searchParams.set("modestbranding", "1")
    url.searchParams.set("rel", "0")
    url.searchParams.set("playsinline", "1")
    newSrc = url.toString()
  }

  return sanitized.replace(/src=["'][^"']+["']/i, `src="${newSrc}"`)
}

export function buildLegacyVimeoEmbed(vimeoVideoId: string): string {
  return `<iframe src="https://player.vimeo.com/video/${vimeoVideoId}?playsinline=1&autoplay=1&muted=1&loop=1&controls=0&title=0&byline=0&portrait=0&dnt=1&transparent=0" width="1080" height="1920" frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
}

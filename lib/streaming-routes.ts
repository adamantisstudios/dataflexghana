/** Routes where full-screen voice/video streaming is active — hide floating UI chrome. */
export function isStreamingPagePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false

  const path = pathname.split("?")[0].replace(/\/$/, "") || "/"

  // Agent conference room (not the list at /agent/voice-rooms)
  if (path.includes("/agent/voice-room") && !path.includes("/agent/voice-rooms")) {
    return true
  }

  // Channel live member view (e.g. /agent/teaching/[channelId]/member)
  if (path.includes("/agent/teaching/") && path.includes("/member")) {
    return true
  }

  // Teacher/host channel dashboard (live session overlay)
  if (/^\/agent\/teaching\/[^/]+$/.test(path) && path !== "/agent/teaching") {
    return true
  }

  // Admin conference management / live moderation
  if (path.includes("/admin/voice-rooms")) {
    return true
  }

  return false
}

/** Server/layout use when pathname is known (no overlay context). */
export function shouldHideStreamingChrome(pathname: string | null | undefined): boolean {
  return isStreamingPagePath(pathname)
}

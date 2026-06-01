/** Routes where immersive media is active — hide call FAB, scroll widget, announcements, etc. */
export function isStreamingPagePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false

  const path = pathname.split("?")[0].replace(/\/$/, "") || "/"

  // Full-screen agent tutorial videos
  if (path === "/agent/tutorials" || path.startsWith("/agent/tutorials/")) {
    return true
  }

  // Teaching hub, channels list, and all channel member/host views
  if (path === "/agent/teaching" || path.startsWith("/agent/teaching/")) {
    return true
  }

  // Agent conference room (not the list at /agent/voice-rooms)
  if (path.includes("/agent/voice-room") && !path.includes("/agent/voice-rooms")) {
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

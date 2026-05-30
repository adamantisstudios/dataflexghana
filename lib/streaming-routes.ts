/** Routes where full-screen voice/video streaming is active — hide floating UI chrome. */
export function isStreamingPagePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false

  // Agent conference room (not the room list at /agent/voice-rooms)
  if (pathname.startsWith("/agent/voice-room/")) return true

  // Channel live: member view and teacher/host channel dashboard (live overlay)
  if (/^\/agent\/teaching\/[^/]+\/member\/?$/.test(pathname)) return true
  if (/^\/agent\/teaching\/[^/]+\/?$/.test(pathname) && pathname !== "/agent/teaching") return true

  // Admin conference management / live moderation
  if (pathname.startsWith("/admin/voice-rooms")) return true

  return false
}

"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { isStreamingPagePath } from "@/lib/streaming-routes"

type StreamingSessionContextValue = {
  active: boolean
  setActive: (active: boolean) => void
}

const StreamingSessionContext = createContext<StreamingSessionContextValue | null>(null)

/** Tracks full-screen LiveKit overlays (e.g. admin control panel on /admin). */
export function StreamingSessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  const value = useMemo(() => ({ active, setActive }), [active])
  return (
    <StreamingSessionContext.Provider value={value}>{children}</StreamingSessionContext.Provider>
  )
}

export function useStreamingSession(): StreamingSessionContextValue {
  const ctx = useContext(StreamingSessionContext)
  if (!ctx) {
    return { active: false, setActive: () => {} }
  }
  return ctx
}

/** Register/unregister an active live stream overlay (conference, channel live, admin control). */
export function useRegisterStreamingSession(active: boolean): void {
  const { setActive } = useStreamingSession()
  useEffect(() => {
    setActive(active)
    return () => setActive(false)
  }, [active, setActive])
}

/** Path-based or overlay-based — hide call widget, back-to-top, announcements FAB. */
export function useShouldHideStreamingChrome(): boolean {
  const pathname = usePathname()
  const { active } = useStreamingSession()
  return isStreamingPagePath(pathname) || active
}

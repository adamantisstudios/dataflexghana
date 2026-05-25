"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

const THROTTLE_MS = 30_000

function getAgentIdFromStorage(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("agent")
    if (!raw) return null
    const agent = JSON.parse(raw) as { id?: string }
    return agent.id?.trim() || null
  } catch {
    return null
  }
}

export function PageViewTracker() {
  const pathname = usePathname()
  const lastSent = useRef<{ path: string; at: number } | null>(null)

  useEffect(() => {
    if (!pathname || pathname.startsWith("/api")) return

    const now = Date.now()
    if (
      lastSent.current?.path === pathname &&
      now - lastSent.current.at < THROTTLE_MS
    ) {
      return
    }

    const storageKey = `df_pv_${pathname}`
    try {
      const prev = sessionStorage.getItem(storageKey)
      if (prev && now - Number.parseInt(prev, 10) < THROTTLE_MS) return
      sessionStorage.setItem(storageKey, String(now))
    } catch {
      /* ignore */
    }

    lastSent.current = { path: pathname, at: now }

    const agentId = getAgentIdFromStorage()

    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, agent_id: agentId }),
      keepalive: true,
    }).catch(() => {
      /* non-blocking */
    })
  }, [pathname])

  return null
}

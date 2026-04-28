"use client"

import { useCallback } from "react"
import { adminCacheManager } from "@/lib/admin-cache-manager"

export function useAgentsCache() {
  const invalidateCache = useCallback(() => {
    // Clear cache keys related to agents
    adminCacheManager.clear("agents:all")
    adminCacheManager.clear("agents:dashboard")
    adminCacheManager.clear("agents:stats")
  }, [])

  return { invalidateCache }
}

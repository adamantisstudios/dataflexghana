"use client"

import { useCallback, useRef } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const dashboardCache = new Map<string, CacheEntry<any>>()

export function useAgentDashboardCache() {
  const cacheRef = useRef(dashboardCache)

  const getFromCache = useCallback(<T,>(key: string, ttl = 300000): T | null => {
    const entry = cacheRef.current.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      cacheRef.current.delete(key)
      return null
    }

    return entry.data as T
  }, [])

  const setInCache = useCallback(<T,>(key: string, data: T, ttl = 300000) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }, [])

  const clearCache = useCallback((key?: string) => {
    if (key) {
      cacheRef.current.delete(key)
    } else {
      cacheRef.current.clear()
    }
  }, [])

  return { getFromCache, setInCache, clearCache }
}

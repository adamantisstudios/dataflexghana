"use client"

import { useRef, useCallback } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const TAB_CACHE_TTL = {
  wallets: 5 * 60 * 1000, // 5 minutes
  jobs: 10 * 60 * 1000, // 10 minutes
  domestic_workers: 10 * 60 * 1000, // 10 minutes
  default: 5 * 60 * 1000, // 5 minutes
}

export const useAdminTabCache = () => {
  const cache = useRef<Map<string, CacheEntry<any>>>(new Map())

  const getCachedData = useCallback((tabName: string) => {
    const entry = cache.current.get(tabName)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      cache.current.delete(tabName)
      return null
    }

    return entry.data
  }, [])

  const setCachedData = useCallback((tabName: string, data: any, ttl?: number) => {
    const tabTtl = ttl || TAB_CACHE_TTL[tabName as keyof typeof TAB_CACHE_TTL] || TAB_CACHE_TTL.default
    cache.current.set(tabName, {
      data,
      timestamp: Date.now(),
      ttl: tabTtl,
    })
  }, [])

  const clearCache = useCallback((tabName?: string) => {
    if (tabName) {
      cache.current.delete(tabName)
    } else {
      cache.current.clear()
    }
  }, [])

  return { getCachedData, setCachedData, clearCache }
}

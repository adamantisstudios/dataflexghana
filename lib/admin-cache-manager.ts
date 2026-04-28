"use client"

import { useRef, useCallback } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class AdminCacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private requestCache = new Map<string, Promise<any>>()

  // Get cached data if still valid
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  // Set cache with TTL
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
  }

  // Deduplicate requests - return same promise for concurrent requests
  async dedupRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.requestCache.has(key)) {
      return this.requestCache.get(key)!
    }

    const promise = fetcher()
    this.requestCache.set(key, promise)

    try {
      const result = await promise
      this.requestCache.delete(key)
      return result
    } catch (error) {
      this.requestCache.delete(key)
      throw error
    }
  }

  // Clear specific cache or all
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  // Get cache stats for debugging
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.requestCache.size,
    }
  }
}

export const adminCacheManager = new AdminCacheManager()

// Hook for using admin cache
export function useAdminCache<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 5 * 60 * 1000) {
  const isMountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = adminCacheManager.get<T>(key)
    if (cached) return cached

    // Deduplicate concurrent requests
    const data = await adminCacheManager.dedupRequest(key, fetcher)

    if (isMountedRef.current) {
      adminCacheManager.set(key, data, ttlMs)
    }

    return data
  }, [key, fetcher, ttlMs])

  return { fetchData, clearCache: () => adminCacheManager.clear(key) }
}

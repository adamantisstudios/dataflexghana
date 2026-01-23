/**
 * Caching utilities for teaching platform
 * Implements LRU cache with TTL for optimal performance
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class TeachingPlatformCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private maxSize = 100
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear()
  }

  /**
   * Clear cache by pattern (e.g., "channel:123:*")
   */
  clearByPattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"))
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    }
  }
}

// Singleton instance
export const teachingCache = new TeachingPlatformCache()

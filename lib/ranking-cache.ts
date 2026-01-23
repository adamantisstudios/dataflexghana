// This singleton pattern prevents multiple simultaneous requests and caches results

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class RankingCache {
  private static instance: RankingCache
  private cache = new Map<string, CacheEntry<any>>()
  private pendingRequests = new Map<string, Promise<any>>()

  static getInstance(): RankingCache {
    if (!RankingCache.instance) {
      RankingCache.instance = new RankingCache()
    }
    return RankingCache.instance
  }

  // Check if cache is still valid
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  // Get cached data if valid
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (entry && this.isValid(entry)) {
      console.log(`[v0] Cache hit for key: ${key}`)
      return entry.data as T
    }
    // Remove expired entry
    if (entry) {
      this.cache.delete(key)
    }
    return null
  }

  // Set cache with TTL
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
    console.log(`[v0] Cache set for key: ${key}, TTL: ${ttlMs}ms`)
  }

  // Deduplicate simultaneous requests
  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs: number = 5 * 60 * 1000): Promise<T> {
    // Return cached if valid
    const cached = this.get<T>(key)
    if (cached) {
      return cached
    }

    // Return pending request if one already exists (deduplication)
    if (this.pendingRequests.has(key)) {
      console.log(`[v0] Request already pending for key: ${key}, returning existing promise`)
      return this.pendingRequests.get(key)!
    }

    // Create new request promise
    const promise = fetchFn()
      .then((data) => {
        this.set(key, data, ttlMs)
        this.pendingRequests.delete(key)
        return data
      })
      .catch((error) => {
        this.pendingRequests.delete(key)
        throw error
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  // Clear specific cache entry
  invalidate(key: string): void {
    this.cache.delete(key)
    console.log(`[v0] Cache invalidated for key: ${key}`)
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
    console.log(`[v0] All cache cleared`)
  }

  // Get cache stats (useful for monitoring costs)
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
      })),
    }
  }
}

export const rankingCache = RankingCache.getInstance()

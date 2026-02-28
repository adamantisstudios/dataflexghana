/**
 * Search Cache Utility
 * Persists search results to localStorage so users can return to their search
 */

import type { CandidateProfile } from "@/lib/candidate-search-utils"

interface SearchCache {
  query: string
  results: CandidateProfile[]
  currentPage: number
  timestamp: number
}

const CACHE_KEY = "candidates_search_cache"
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

/**
 * Save search results to cache
 */
export function saveSearchCache(query: string, results: CandidateProfile[], currentPage: number): void {
  try {
    const cache: SearchCache = {
      query,
      results,
      currentPage,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn("[v0] Failed to save search cache:", error)
  }
}

/**
 * Retrieve search results from cache
 */
export function getSearchCache(): SearchCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const cache: SearchCache = JSON.parse(cached)
    const now = Date.now()

    // Check if cache has expired
    if (now - cache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return cache
  } catch (error) {
    console.warn("[v0] Failed to retrieve search cache:", error)
    return null
  }
}

/**
 * Clear search cache
 */
export function clearSearchCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.warn("[v0] Failed to clear search cache:", error)
  }
}

/**
 * Check if cache is valid and not expired
 */
export function isSearchCacheValid(): boolean {
  const cache = getSearchCache()
  if (!cache) return false

  const now = Date.now()
  return now - cache.timestamp < CACHE_DURATION
}

/**
 * Wallet Cache Utility
 * Manages local storage cache for wallet operations to prevent duplicate submissions
 */

interface PendingTopupCache {
  agentId: string
  timestamp: number
  expiryTime: number
}

const CACHE_KEY = "wallet_pending_topup_cache"
const CACHE_EXPIRY_MS = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Check if a pending topup cache exists and is still valid for the agent
 */
export function hasPendingTopupInCache(agentId: string): boolean {
  if (typeof window === "undefined") return false

  try {
    const cacheData = localStorage.getItem(CACHE_KEY)
    if (!cacheData) return false

    const cache: PendingTopupCache = JSON.parse(cacheData)

    // Verify cache belongs to this agent and hasn't expired
    if (cache.agentId === agentId && Date.now() < cache.expiryTime) {
      return true
    }

    // Clear expired cache
    if (Date.now() >= cache.expiryTime) {
      localStorage.removeItem(CACHE_KEY)
    }

    return false
  } catch (error) {
    console.error("[v0] Error reading wallet cache:", error)
    return false
  }
}

/**
 * Set a pending topup cache for the agent
 */
export function setPendingTopupCache(agentId: string): void {
  if (typeof window === "undefined") return

  try {
    const cache: PendingTopupCache = {
      agentId,
      timestamp: Date.now(),
      expiryTime: Date.now() + CACHE_EXPIRY_MS,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    console.log("[v0] Wallet topup cache set for agent:", agentId)
  } catch (error) {
    console.error("[v0] Error setting wallet cache:", error)
  }
}

/**
 * Clear the pending topup cache
 */
export function clearPendingTopupCache(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(CACHE_KEY)
    console.log("[v0] Wallet topup cache cleared")
  } catch (error) {
    console.error("[v0] Error clearing wallet cache:", error)
  }
}

/**
 * Get time remaining until cache expires (in seconds)
 */
export function getCacheTimeRemaining(): number {
  if (typeof window === "undefined") return 0

  try {
    const cacheData = localStorage.getItem(CACHE_KEY)
    if (!cacheData) return 0

    const cache: PendingTopupCache = JSON.parse(cacheData)
    const remaining = Math.max(0, Math.ceil((cache.expiryTime - Date.now()) / 1000))
    return remaining
  } catch (error) {
    console.error("[v0] Error getting cache time remaining:", error)
    return 0
  }
}

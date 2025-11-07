/**
 * Search Tracking & Rate Limiting Utility
 * Manages daily search quotas and device identification
 * Added client-side guard to prevent window usage on server
 */

const STORAGE_KEY_PREFIX = "candidate_search_"
const DAILY_SEARCH_LIMIT = 7

export interface SearchQuota {
  date: string
  count: number
  lastSearchTime: number
}

/**
 * Generate device fingerprint from browser/device info
 * This helps identify unique devices without storing personal data
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === "undefined") {
    return "server-side-default"
  }

  const navigator_info = window.navigator
  const screen_info = window.screen

  const fingerprint = [
    navigator_info.userAgent,
    navigator_info.language,
    screen_info.width + "x" + screen_info.height,
    new Date().getTimezoneOffset(),
  ].join("|")

  // Simple hash function
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16)
}

/**
 * Get search quota for current device
 */
export function getSearchQuota(): SearchQuota {
  try {
    if (typeof localStorage === "undefined") {
      return { date: new Date().toISOString().split("T")[0], count: 0, lastSearchTime: 0 }
    }

    const deviceId = generateDeviceFingerprint()
    const storageKey = STORAGE_KEY_PREFIX + deviceId
    const today = new Date().toISOString().split("T")[0]

    const stored = localStorage.getItem(storageKey)
    if (!stored) {
      return { date: today, count: 0, lastSearchTime: 0 }
    }

    const quota = JSON.parse(stored) as SearchQuota

    // Reset if date changed
    if (quota.date !== today) {
      return { date: today, count: 0, lastSearchTime: 0 }
    }

    return quota
  } catch (error) {
    console.error("[v0] Error getting search quota:", error)
    return { date: new Date().toISOString().split("T")[0], count: 0, lastSearchTime: 0 }
  }
}

/**
 * Increment search count and store
 */
export function incrementSearchCount(): SearchQuota {
  try {
    if (typeof localStorage === "undefined") {
      return { date: new Date().toISOString().split("T")[0], count: 0, lastSearchTime: 0 }
    }

    const deviceId = generateDeviceFingerprint()
    const storageKey = STORAGE_KEY_PREFIX + deviceId
    const today = new Date().toISOString().split("T")[0]

    const quota = getSearchQuota()

    const updated: SearchQuota = {
      date: today,
      count: quota.count + 1,
      lastSearchTime: Date.now(),
    }

    localStorage.setItem(storageKey, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error("[v0] Error incrementing search count:", error)
    return { date: new Date().toISOString().split("T")[0], count: 0, lastSearchTime: 0 }
  }
}

/**
 * Check if user has exceeded daily search limit
 */
export function canPerformSearch(): boolean {
  const quota = getSearchQuota()
  return quota.count < DAILY_SEARCH_LIMIT
}

/**
 * Get remaining searches for today
 */
export function getRemainingSearches(): number {
  const quota = getSearchQuota()
  return Math.max(0, DAILY_SEARCH_LIMIT - quota.count)
}

/**
 * Get human-readable search limit message
 */
export function getSearchLimitMessage(): string {
  const remaining = getRemainingSearches()
  if (remaining === 0) {
    return `You have reached your daily search limit (${DAILY_SEARCH_LIMIT} searches). Contact our admin at +233 546 460 945 for priority candidate search support.`
  }
  return `You have ${remaining} search${remaining !== 1 ? "es" : ""} remaining today.`
}

/**
 * Clear search data (for testing or reset)
 */
export function clearSearchData(): void {
  try {
    if (typeof localStorage === "undefined") {
      return
    }

    const deviceId = generateDeviceFingerprint()
    const storageKey = STORAGE_KEY_PREFIX + deviceId
    localStorage.removeItem(storageKey)
  } catch (error) {
    console.error("[v0] Error clearing search data:", error)
  }
}

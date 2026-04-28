import { getAdminClient } from "./supabase-base"

// Utility functions for URL detection and validation

const DENYLIST_IP_RANGES = ["10.0.0.0/8", "127.0.0.0/8", "169.254.0.0/16", "192.168.0.0/16", "172.16.0.0/12"]

function isIPInRange(ip: string, range: string): boolean {
  const [rangeIP, rangeMask] = range.split("/")
  const [a, b, c, d] = rangeIP.split(".").map(Number)
  const [x, y, z, w] = ip.split(".").map(Number)
  const mask = Number.parseInt(rangeMask)

  const rangeNum = (a << 24) + (b << 16) + (c << 8) + d
  const ipNum = (x << 24) + (y << 16) + (z << 8) + w
  const maskNum = (0xffffffff << (32 - mask)) >>> 0

  return (rangeNum & maskNum) === (ipNum & maskNum)
}

export function isBlockedIP(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true

  try {
    const parts = hostname.split(".").map(Number)
    if (parts.length === 4 && parts.every((p) => p >= 0 && p <= 255)) {
      return DENYLIST_IP_RANGES.some((range) => isIPInRange(hostname, range))
    }
  } catch {
    return false
  }

  return false
}

export const CACHE_CONFIG = {
  TTL_DAYS: 3,
  MAX_RESPONSE_SIZE_MB: 2,
  TIMEOUT_SECONDS: 5,
}

export async function clearPreviewCache() {
  try {
    const supabase = getAdminClient()

    const { error } = await supabase.from("link_preview_cache").delete().neq("id", "")

    if (error) {
      console.error("[v0] Error clearing cache:", error)
      throw error
    }

    return { success: true, message: "Preview cache cleared" }
  } catch (error) {
    console.error("[v0] Error in clearPreviewCache:", error)
    throw error
  }
}

export async function getCacheStats() {
  try {
    const supabase = getAdminClient()

    const { data, error } = await supabase.from("link_preview_cache").select("id, url, cached_at, expires_at")

    if (error) {
      console.error("[v0] Error fetching cache stats:", error)
      return {
        totalEntries: 0,
        activeEntries: 0,
        expiredEntries: 0,
        cacheSize: "0 MB",
        warning: "Cache stats unavailable - using fallback values",
      }
    }

    const totalEntries = data?.length || 0
    const expiredEntries = data?.filter((entry: any) => new Date(entry.expires_at) < new Date()).length || 0
    const activeEntries = totalEntries - expiredEntries

    return {
      totalEntries,
      activeEntries,
      expiredEntries,
      cacheSize: `${(totalEntries * 0.05).toFixed(2)} MB`,
    }
  } catch (error) {
    console.error("[v0] Error in getCacheStats:", error)
    return {
      totalEntries: 0,
      activeEntries: 0,
      expiredEntries: 0,
      cacheSize: "0 MB",
      warning: "Cache stats unavailable - using fallback values",
    }
  }
}

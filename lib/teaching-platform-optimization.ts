import { supabase } from "@/lib/supabase"
import { teachingCache } from "./teaching-platform-cache"

/**
 * Optimization utilities for teaching platform
 * Includes batch operations, query optimization, and media compression
 */

/**
 * Batch load channels with caching
 */
export async function batchLoadChannels(channelIds: string[]) {
  const uncachedIds: string[] = []
  const cachedChannels: any[] = []

  // Check cache first
  channelIds.forEach((id) => {
    const cached = teachingCache.get(`channel:${id}`)
    if (cached) {
      cachedChannels.push(cached)
    } else {
      uncachedIds.push(id)
    }
  })

  // Load uncached channels
  if (uncachedIds.length > 0) {
    const { data, error } = await supabase.from("teaching_channels").select("*").in("id", uncachedIds)

    if (error) throw error

    // Cache results
    data?.forEach((channel) => {
      teachingCache.set(`channel:${channel.id}`, channel, 10 * 60 * 1000) // 10 min TTL
    })

    return [...cachedChannels, ...(data || [])]
  }

  return cachedChannels
}

/**
 * Batch load posts with pagination
 */
export async function batchLoadPosts(channelId: string, page = 1, pageSize = 10) {
  const cacheKey = `posts:${channelId}:${page}`
  const cached = teachingCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  const { data, error, count } = await supabase
    .from("channel_posts")
    .select("*", { count: "exact" })
    .eq("channel_id", channelId)
    .eq("is_archived", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(start, end)

  if (error) throw error

  const result = {
    posts: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }

  teachingCache.set(cacheKey, result, 5 * 60 * 1000) // 5 min TTL
  return result
}

/**
 * Batch load comments with caching
 */
export async function batchLoadComments(postId: string) {
  const cacheKey = `comments:${postId}`
  const cached = teachingCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const { data, error } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  if (error) throw error

  teachingCache.set(cacheKey, data || [], 3 * 60 * 1000) // 3 min TTL
  return data || []
}

/**
 * Invalidate related caches when data changes
 */
export function invalidateChannelCache(channelId: string) {
  teachingCache.clear(`channel:${channelId}`)
  teachingCache.clearByPattern(`posts:${channelId}:.*`)
  teachingCache.clearByPattern(`members:${channelId}:.*`)
}

export function invalidatePostCache(postId: string) {
  teachingCache.clear(`comments:${postId}`)
  teachingCache.clearByPattern(`reactions:${postId}:.*`)
}

/**
 * Compress image for media optimization
 */
export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to compress image"))
            }
          },
          "image/jpeg",
          0.8,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

/**
 * Calculate media cache key
 */
export function getMediaCacheKey(url: string): string {
  return `media:${btoa(url)}`
}

/**
 * Prefetch channel data for better UX
 */
export async function prefetchChannelData(channelId: string) {
  try {
    // Prefetch channel info
    await batchLoadChannels([channelId])

    // Prefetch first page of posts
    await batchLoadPosts(channelId, 1, 10)
  } catch (error) {
    console.error("Error prefetching channel data:", error)
  }
}

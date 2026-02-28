import { adminCacheManager } from "./admin-cache-manager"

export async function loadAdminPageData(pageKey: string, loaders: Record<string, () => Promise<any>>) {
  // Check if all data is cached
  const allCached = Object.entries(loaders).every(([key]) => {
    return adminCacheManager.get(`${pageKey}:${key}`) !== null
  })

  if (allCached) {
    // Return all cached data immediately
    return Object.fromEntries(Object.entries(loaders).map(([key]) => [key, adminCacheManager.get(`${pageKey}:${key}`)]))
  }

  // Load all data in parallel
  const results = await Promise.allSettled(
    Object.entries(loaders).map(async ([key, loader]) => {
      const cacheKey = `${pageKey}:${key}`
      const cached = adminCacheManager.get(cacheKey)

      if (cached) return [key, cached]

      const data = await adminCacheManager.dedupRequest(cacheKey, loader)
      adminCacheManager.set(cacheKey, data, 5 * 60 * 1000)
      return [key, data]
    }),
  )

  // Convert results to object
  const data: Record<string, any> = {}
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const [key, value] = result.value
      data[key] = value
    }
  })

  return data
}

// Batch loader for multiple items
export async function loadAdminBatchData<T>(
  cacheKey: string,
  fetcher: () => Promise<T[]>,
  batchSize = 50,
): Promise<T[]> {
  const cached = adminCacheManager.get<T[]>(cacheKey)
  if (cached) return cached

  const data = await adminCacheManager.dedupRequest(cacheKey, fetcher)
  adminCacheManager.set(cacheKey, data, 5 * 60 * 1000)

  return data
}

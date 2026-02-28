/**
 * Multi-Keyword Search Utility
 * Supports combination searches like "Marketing, Accra" (job title + location)
 * Allows flexible keyword combinations for better candidate discovery
 */

export interface SearchConfig {
  fields: string[]
  matchType: "any" | "all" // 'any' = OR logic, 'all' = AND logic
}

/**
 * Split search query into individual keywords
 * Supports comma-separated or space-separated keywords
 * Prioritizes comma separation for exact combinations
 */
export function parseSearchQuery(query: string): string[] {
  if (!query.trim()) return []

  // Split by comma first (for "job title, location" format)
  if (query.includes(",")) {
    return query
      .split(",")
      .map((keyword) => keyword.trim().toLowerCase())
      .filter((keyword) => keyword.length > 0)
  }

  // Otherwise split by spaces for multi-word keywords
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((keyword) => keyword.length > 0)
}

/**
 * Check if a candidate matches ANY of the search keywords
 * Used for flexible search (matches if ANY keyword is found)
 */
export function matchesAnyKeyword(candidate: Record<string, any>, keywords: string[], fields: string[]): boolean {
  if (keywords.length === 0) return true

  return keywords.some((keyword) =>
    fields.some((field) => {
      const value = candidate[field]
      if (!value) return false
      return String(value).toLowerCase().includes(keyword)
    }),
  )
}

/**
 * Check if a candidate matches ALL of the search keywords
 * Used for precise search (matches only if ALL keywords are found)
 */
export function matchesAllKeywords(candidate: Record<string, any>, keywords: string[], fields: string[]): boolean {
  if (keywords.length === 0) return true

  return keywords.every((keyword) =>
    fields.some((field) => {
      const value = candidate[field]
      if (!value) return false
      return String(value).toLowerCase().includes(keyword)
    }),
  )
}

/**
 * Perform multi-keyword search on candidates
 */
export function filterByMultiKeywords(
  candidates: any[],
  query: string,
  fields: string[],
  matchType: "any" | "all" = "any",
): any[] {
  const keywords = parseSearchQuery(query)

  if (keywords.length === 0) return candidates

  return candidates.filter((candidate) =>
    matchType === "any"
      ? matchesAnyKeyword(candidate, keywords, fields)
      : matchesAllKeywords(candidate, keywords, fields),
  )
}

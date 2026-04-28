/**
 * Candidate Search and Filtering Utilities
 * Centralized functions for candidate search operations
 */

export interface CandidateProfile {
  id: string
  full_name: string
  email: string
  contact_lines: string
  country: string
  exact_location: string
  willingness_to_relocate: string
  job_looking_for: string
  highest_education: string
  created_at: string
  [key: string]: any
}

/**
 * Filter candidates by search term across multiple fields
 */
export function filterBySearchTerm(candidates: CandidateProfile[], searchTerm: string): CandidateProfile[] {
  if (!searchTerm) return candidates

  const searchLower = searchTerm.toLowerCase()
  return candidates.filter(
    (candidate) =>
      candidate.full_name.toLowerCase().includes(searchLower) ||
      candidate.job_looking_for?.toLowerCase().includes(searchLower) ||
      candidate.exact_location?.toLowerCase().includes(searchLower) ||
      candidate.highest_education?.toLowerCase().includes(searchLower) ||
      candidate.email?.toLowerCase().includes(searchLower),
  )
}

/**
 * Filter candidates by country
 */
export function filterByCountry(candidates: CandidateProfile[], country: string): CandidateProfile[] {
  if (!country || country === "All Countries") return candidates
  return candidates.filter((candidate) => candidate.country === country)
}

/**
 * Filter candidates by location
 */
export function filterByLocation(candidates: CandidateProfile[], location: string): CandidateProfile[] {
  if (!location || location === "All Locations") return candidates
  return candidates.filter((candidate) => candidate.exact_location?.toLowerCase().includes(location.toLowerCase()))
}

/**
 * Filter candidates by willingness to relocate
 */
export function filterByRelocation(candidates: CandidateProfile[], relocation: string): CandidateProfile[] {
  if (!relocation || relocation === "All") return candidates
  return candidates.filter((candidate) => candidate.willingness_to_relocate?.toLowerCase() === relocation.toLowerCase())
}

/**
 * Filter candidates by education level
 */
export function filterByEducation(candidates: CandidateProfile[], education: string): CandidateProfile[] {
  if (!education || education === "All") return candidates
  return candidates.filter((candidate) => candidate.highest_education?.toLowerCase().includes(education.toLowerCase()))
}

/**
 * Apply all filters to candidates list
 */
export function applyAllFilters(
  candidates: CandidateProfile[],
  filters: {
    searchTerm?: string
    country?: string
    location?: string
    relocation?: string
    education?: string
  },
): CandidateProfile[] {
  let filtered = [...candidates]

  if (filters.searchTerm) {
    filtered = filterBySearchTerm(filtered, filters.searchTerm)
  }

  if (filters.country) {
    filtered = filterByCountry(filtered, filters.country)
  }

  if (filters.location) {
    filtered = filterByLocation(filtered, filters.location)
  }

  if (filters.relocation) {
    filtered = filterByRelocation(filtered, filters.relocation)
  }

  if (filters.education) {
    filtered = filterByEducation(filtered, filters.education)
  }

  return filtered
}

/**
 * Sort candidates by specified field
 */
export function sortCandidates(
  candidates: CandidateProfile[],
  sortBy: "name" | "date" | "location" = "date",
  ascending = true,
): CandidateProfile[] {
  const sorted = [...candidates]

  sorted.sort((a, b) => {
    let compareA: string
    let compareB: string

    switch (sortBy) {
      case "name":
        compareA = a.full_name.toLowerCase()
        compareB = b.full_name.toLowerCase()
        break
      case "location":
        compareA = a.exact_location?.toLowerCase() || ""
        compareB = b.exact_location?.toLowerCase() || ""
        break
      case "date":
      default:
        compareA = a.created_at
        compareB = b.created_at
        break
    }

    const comparison = compareA < compareB ? -1 : compareA > compareB ? 1 : 0
    return ascending ? comparison : -comparison
  })

  return sorted
}

/**
 * Paginate candidates
 */
export function paginateCandidates(
  candidates: CandidateProfile[],
  page: number,
  itemsPerPage: number,
): CandidateProfile[] {
  const startIndex = (page - 1) * itemsPerPage
  return candidates.slice(startIndex, startIndex + itemsPerPage)
}

/**
 * Calculate total pages
 */
export function getTotalPages(totalItems: number, itemsPerPage: number): number {
  return Math.ceil(totalItems / itemsPerPage)
}

/**
 * Get candidates count by country
 */
export function getCandidatesByCountry(candidates: CandidateProfile[]): Record<string, number> {
  return candidates.reduce(
    (acc, candidate) => {
      const country = candidate.country || "Unknown"
      acc[country] = (acc[country] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}

/**
 * Get candidates count by position
 */
export function getCandidatesByPosition(candidates: CandidateProfile[]): Record<string, number> {
  return candidates.reduce(
    (acc, candidate) => {
      const position = candidate.job_looking_for || "Unknown"
      acc[position] = (acc[position] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
}

/**
 * Fetch candidates from API
 */
export async function fetchCandidates(): Promise<CandidateProfile[]> {
  try {
    const response = await fetch("/api/candidates/search", {
      method: "GET",
    })
    if (!response.ok) throw new Error("Failed to load candidates")
    const data = await response.json()
    return data.candidates || []
  } catch (error) {
    console.error("Error loading candidates:", error)
    return []
  }
}

/**
 * Fetch single candidate by ID
 */
export async function fetchCandidateById(candidateId: string): Promise<CandidateProfile | null> {
  try {
    const response = await fetch(`/api/candidates/search?id=${candidateId}`)
    if (!response.ok) throw new Error("Candidate not found")
    const data = await response.json()
    return data.candidate || null
  } catch (error) {
    console.error("Error loading candidate:", error)
    return null
  }
}

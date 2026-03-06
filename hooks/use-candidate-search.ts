"use client"

/**
 * Hook for managing candidate search state and filtering
 * Centralizes search logic and state management
 */

import { useState, useEffect, useCallback } from "react"
import {
  type CandidateProfile,
  fetchCandidates,
  fetchCandidateById,
  applyAllFilters,
  sortCandidates,
  paginateCandidates,
  getTotalPages,
} from "@/lib/candidate-search-utils"

export interface SearchFilters {
  searchTerm: string
  country: string
  location: string
  relocation?: string
  education?: string
}

export interface UseSearchResult {
  candidates: CandidateProfile[]
  filteredCandidates: CandidateProfile[]
  paginatedCandidates: CandidateProfile[]
  loading: boolean
  error: string | null
  totalPages: number
  currentPage: number
  filters: SearchFilters
  updateSearch: (term: string) => void
  updateCountry: (country: string) => void
  updateLocation: (location: string) => void
  updateRelocation: (relocation: string) => void
  updateEducation: (education: string) => void
  setCurrentPage: (page: number) => void
  resetFilters: () => void
  refreshCandidates: () => Promise<void>
}

const DEFAULT_FILTERS: SearchFilters = {
  searchTerm: "",
  country: "All Countries",
  location: "All Locations",
  relocation: "All",
  education: "All",
}

export function useCandidateSearch(itemsPerPage = 12): UseSearchResult {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [currentPage, setCurrentPageState] = useState(1)

  const paginatedCandidates = paginateCandidates(filteredCandidates, currentPage, itemsPerPage)
  const totalPages = getTotalPages(filteredCandidates.length, itemsPerPage)

  // Load candidates on mount
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchCandidates()
        setCandidates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load candidates")
      } finally {
        setLoading(false)
      }
    }

    loadCandidates()
  }, [])

  // Apply filters whenever candidates or filters change
  useEffect(() => {
    const filtered = applyAllFilters(candidates, filters)
    const sorted = sortCandidates(filtered, "date", false) // Most recent first
    setFilteredCandidates(sorted)
    setCurrentPageState(1)
  }, [candidates, filters])

  const updateSearch = useCallback((term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }))
  }, [])

  const updateCountry = useCallback((country: string) => {
    setFilters((prev) => ({ ...prev, country }))
  }, [])

  const updateLocation = useCallback((location: string) => {
    setFilters((prev) => ({ ...prev, location }))
  }, [])

  const updateRelocation = useCallback((relocation: string) => {
    setFilters((prev) => ({ ...prev, relocation }))
  }, [])

  const updateEducation = useCallback((education: string) => {
    setFilters((prev) => ({ ...prev, education }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setCurrentPageState(1)
  }, [])

  const refreshCandidates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchCandidates()
      setCandidates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh candidates")
    } finally {
      setLoading(false)
    }
  }, [])

  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageState(page)
  }, [])

  return {
    candidates,
    filteredCandidates,
    paginatedCandidates,
    loading,
    error,
    totalPages,
    currentPage,
    filters,
    updateSearch,
    updateCountry,
    updateLocation,
    updateRelocation,
    updateEducation,
    setCurrentPage,
    resetFilters,
    refreshCandidates,
  }
}

export interface UseCandidateDetailResult {
  candidate: CandidateProfile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCandidateDetail(candidateId: string): UseCandidateDetailResult {
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchCandidateById(candidateId)
      if (!data) {
        setError("Candidate not found")
      }
      setCandidate(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load candidate")
    } finally {
      setLoading(false)
    }
  }, [candidateId])

  useEffect(() => {
    refetch()
  }, [candidateId, refetch])

  return {
    candidate,
    loading,
    error,
    refetch,
  }
}

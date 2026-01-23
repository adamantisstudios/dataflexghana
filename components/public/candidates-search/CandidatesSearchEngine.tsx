"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Users, Search, Home, Briefcase } from "lucide-react"
import Link from "next/link"
import CandidatesHeroSlider from "@/components/public/candidates-search/CandidatesHeroSlider"
import GoogleStyleSearchResult from "@/components/public/candidates-search/GoogleStyleSearchResult"
import SearchTipsNotification from "@/components/public/candidates-search/SearchTipsNotification"
import SearchLimitExceededCard from "@/components/public/candidates-search/SearchLimitExceededCard"
import ATSInfoNotification from "@/components/public/candidates-search/ATSInfoNotification"
import { type CandidateProfile, paginateCandidates, getTotalPages } from "@/lib/candidate-search-utils"
import { openWhatsAppCVRequest } from "@/lib/whatsapp-integration"
import { canPerformSearch, getRemainingSearches, incrementSearchCount } from "@/lib/search-tracking"
import { saveSearchCache, getSearchCache, clearSearchCache, isSearchCacheValid } from "@/lib/search-cache"
import ServicesSlider from "@/components/public/candidates-search/ServicesSlider"
import VanityMetrics from "@/components/public/candidates-search/VanityMetrics"

export default function CandidatesSearchEngine({ onRefresh }: { onRefresh?: () => void }) {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchLimitExceeded, setSearchLimitExceeded] = useState(false)
  const heroSearchInputRef = useRef<HTMLInputElement>(null)
  const resultsSearchInputRef = useRef<HTMLInputElement>(null)
  const itemsPerPage = 12

  useEffect(() => {
    const cache = getSearchCache()
    if (cache && isSearchCacheValid()) {
      console.log("[v0] Restoring search from cache:", cache.query)
      setCandidates(cache.results)
      setFilteredCandidates(cache.results)
      setSearchTerm(cache.query)
      setCurrentPage(cache.currentPage)
      setHasSearched(true)
    }
  }, [])

  const handleSearch = async () => {
    try {
      if (!canPerformSearch()) {
        setSearchLimitExceeded(true)
        setHasSearched(true)
        return
      }
      setLoading(true)
      setSearchLimitExceeded(false)
      console.log("[v0] Starting search for term:", searchTerm)
      const response = await fetch(`/api/candidates/search?query=${encodeURIComponent(searchTerm)}`, {
        method: "GET",
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] API error:", errorData)
        throw new Error(errorData.message || "Failed to load candidates")
      }
      const data = await response.json()
      console.log("[v0] Search successful, found:", data.candidates?.length || 0, "candidates")
      const limitedCandidates = (data.candidates || []).slice(0, 36)
      setCandidates(limitedCandidates)
      setFilteredCandidates(limitedCandidates)
      setHasSearched(true)
      setCurrentPage(1)
      saveSearchCache(searchTerm, limitedCandidates, 1)
      incrementSearchCount()
    } catch (error) {
      console.error("[v0] Error loading candidates:", error)
      setCandidates([])
      setFilteredCandidates([])
      setHasSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const getPaginatedData = (data: CandidateProfile[], page: number) => {
    return paginateCandidates(data, page, itemsPerPage)
  }

  const getTotalPagesValue = (totalItems: number) => {
    return getTotalPages(totalItems, itemsPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    saveSearchCache(searchTerm, filteredCandidates, page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleRequestCV = (candidate: CandidateProfile) => {
    openWhatsAppCVRequest({
      candidateName: candidate.full_name,
      candidateEmail: candidate.email,
      position: candidate.job_looking_for,
      location: candidate.exact_location,
      country: candidate.country,
      phoneNumber: candidate.contact_lines,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => {
    if (totalPages <= 1) return null
    const getVisiblePages = () => {
      const maxVisible = typeof window !== "undefined" && window.innerWidth < 768 ? 3 : 5
      if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
      }
      const start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
      const end = Math.min(totalPages, start + maxVisible - 1)
      const adjustedStart = Math.max(1, end - maxVisible + 1)
      return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i)
    }
    const visiblePages = getVisiblePages()
    return (
      <div className="flex justify-center mt-8">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (currentPage > 1) onPageChange(currentPage - 1)
                }}
                className={`${currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
            {visiblePages.map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  if (currentPage < totalPages) onPageChange(currentPage + 1)
                }}
                className={`${currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  const renderSearchResults = () => {
    if (!hasSearched) {
      return (
        <div className="min-h-screen flex flex-col bg-gray-50">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="w-full px-4 md:px-0 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-gray-300 hover:bg-gray-100 bg-transparent"
                  >
                    <Link
                      href="/candidates-searchengine"
                      onClick={() => {
                        setSearchTerm("")
                        setHasSearched(false)
                        clearSearchCache()
                      }}
                    >
                      <Home className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">Home</span>
                    </Link>
                  </Button>
                  <div>
                    <h1 className="text-lg md:text-xl font-bold text-gray-900">Candidate Search</h1>
                    <p className="text-gray-600 text-xs">Find qualified professionals</p>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 w-full flex flex-col items-center px-4 md:px-0 py-8 md:py-12">
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Main Search */}
              <div className="md:col-span-2">
                <CandidatesHeroSlider />
                <div className="w-full">
                  <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8 text-center">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Find Top Talent in Ghana</h2>
                    <p className="text-gray-600 text-base mb-8">
                      Search through our database of verified professionals across various industries
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-8">
                    <div className="flex flex-col gap-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          ref={heroSearchInputRef}
                          placeholder="Search candidates by job title, location, skills, education..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="pl-12 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-full py-3"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSearch}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8"
                        >
                          {loading ? "Searching..." : "Search"}
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="text-green-600 font-medium">{getRemainingSearches()} free searches</span>{" "}
                        available today
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Find Great Talent?</h3>
                  <p className="text-sm text-gray-600">
                    Use the search field above to discover qualified candidates from our network
                  </p>
                </div>
              </div>

              {/* Right Column - Services & Metrics */}
              <div className="md:col-span-1 space-y-6">
                <ServicesSlider />
                <VanityMetrics />
              </div>
            </div>
          </main>
          <SearchTipsNotification />
          <ATSInfoNotification searchInputRef={heroSearchInputRef} />
        </div>
      )
    }

    if (searchLimitExceeded) {
      return (
        <div className="min-h-screen flex flex-col bg-gray-50">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="w-full px-4 md:px-0 py-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-300 hover:bg-gray-100 bg-transparent"
                >
                  <Link
                    href="/candidates-searchengine"
                    onClick={() => {
                      setSearchTerm("")
                      setHasSearched(false)
                      clearSearchCache()
                    }}
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Home</span>
                  </Link>
                </Button>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-gray-900">Candidate Search</h1>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 w-full px-4 py-12">
            <SearchLimitExceededCard />
          </main>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Searching candidates...</p>
          </div>
        </div>
      )
    }

    const currentCandidates = getPaginatedData(filteredCandidates, currentPage)
    const totalPages = getTotalPagesValue(filteredCandidates.length)

    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="w-full px-4 md:px-0 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-300 hover:bg-gray-100 bg-transparent"
                >
                  <Link
                    href="/candidates-searchengine"
                    onClick={() => {
                      setSearchTerm("")
                      setHasSearched(false)
                      clearSearchCache()
                    }}
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Home</span>
                  </Link>
                </Button>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-gray-900">Search Results</h1>
                  <p className="text-gray-600 text-xs">
                    {filteredCandidates.length} candidates found for "{searchTerm}"
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                {getRemainingSearches()} searches left
              </Badge>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full px-4 md:px-0 py-6 md:py-8">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Main Search Results */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6 sticky top-20 z-5">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      ref={resultsSearchInputRef}
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10 text-xs border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-full py-2"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Search
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6 text-xs text-gray-600">
                <span>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCandidates.length)}-
                  {Math.min(currentPage * itemsPerPage, filteredCandidates.length)} of {filteredCandidates.length}
                </span>
                {totalPages > 1 && (
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                {currentCandidates.length > 0 ? (
                  <div className="space-y-4">
                    {currentCandidates.map((candidate, index) => (
                      <GoogleStyleSearchResult
                        key={candidate.id}
                        candidate={candidate}
                        onRequestCV={handleRequestCV}
                        index={index}
                        rawScore={candidate.matchScore || 50}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Candidates Found</h3>
                    <p className="text-sm text-gray-600">Try adjusting your search terms</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        setHasSearched(false)
                        clearSearchCache()
                        window.location.href = "/candidates-searchengine"
                      }}
                      className="mt-4 border-gray-300"
                    >
                      New Search
                    </Button>
                  </div>
                )}
              </div>
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>

            {/* Right Column - Services & Metrics */}
            <div className="md:col-span-1 space-y-6">
              <ServicesSlider />
              <VanityMetrics />
            </div>
          </div>
        </main>
        <SearchTipsNotification />
        <ATSInfoNotification searchInputRef={resultsSearchInputRef} />
      </div>
    )
  }

  return renderSearchResults()
}

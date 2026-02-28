"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Search, Home, Briefcase, TrendingUp, Zap } from "lucide-react"
import Link from "next/link"
import GoogleStyleSearchResult from "@/components/public/candidates-search/GoogleStyleSearchResult"
import SearchTipsNotification from "@/components/public/candidates-search/SearchTipsNotification"
import SearchLimitExceededCard from "@/components/public/candidates-search/SearchLimitExceededCard"
import ATSInfoNotification from "@/components/public/candidates-search/ATSInfoNotification"
import { type CandidateProfile, paginateCandidates, getTotalPages } from "@/lib/candidate-search-utils"
import { openWhatsAppCVRequest } from "@/lib/whatsapp-integration"
import { canPerformSearch, getRemainingSearches, incrementSearchCount } from "@/lib/search-tracking"
import { saveSearchCache, getSearchCache, clearSearchCache, isSearchCacheValid } from "@/lib/search-cache"
import BoldServicesSlider from "@/components/public/candidates-search/BoldServicesSlider"
import PCOnlySidebar from "@/components/public/candidates-search/PCOnlySidebar"
import VanityMetricsCompact from "@/components/public/candidates-search/VanityMetricsCompact"
import LocationBasedNotification from "@/components/public/candidates-search/LocationBasedNotification"
import CandidatesHeroSlider from "@/components/public/candidates-search/CandidatesHeroSlider"
import { isLocationInGhana } from "@/lib/ghana-locations"
import { Footer } from "@/components/footer"
import { SearchAdsOverlay } from "@/components/public/candidates-search/SearchAdsOverlay"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function BoldCandidatesSearchEngine() {
  // State and Refs
  const [candidates, setCandidates] = useState<CandidateProfile[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<CandidateProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchLimitExceeded, setSearchLimitExceeded] = useState(false)
  const [searchedLocation, setSearchedLocation] = useState("")
  const [showLocationNotification, setShowLocationNotification] = useState(false)
  const [showSearchAd, setShowSearchAd] = useState(false)
  const [searchCountToday, setSearchCountToday] = useState(0)
  const heroSearchInputRef = useRef<HTMLInputElement>(null)
  const resultsSearchInputRef = useRef<HTMLInputElement>(null)
  const itemsPerPage = 12

  // Load cached search on mount
  useEffect(() => {
    const cache = getSearchCache()
    if (cache && isSearchCacheValid()) {
      setCandidates(cache.results)
      setFilteredCandidates(cache.results)
      setSearchTerm(cache.query)
      setCurrentPage(cache.currentPage)
      setHasSearched(true)
    }
    const storedCount = localStorage.getItem("candidate_search_count_today") || "0"
    setSearchCountToday(Number.parseInt(storedCount))
  }, [])

  // Search handler with retry
  const handleSearch = async (retryCount = 0) => {
    try {
      if (!canPerformSearch()) {
        setSearchLimitExceeded(true)
        setHasSearched(true)
        return
      }
      setLoading(true)
      setSearchLimitExceeded(false)
      setShowLocationNotification(false)
      setShowSearchAd(false)

      console.log("[v0] Fetching candidates, attempt:", retryCount + 1)
      const url = `/api/candidates/search?query=${encodeURIComponent(searchTerm)}`
      console.log("[v0] Fetch URL:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Response received:", response.status, response.statusText)

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("[v0] Failed to parse response as JSON:", jsonError)
        console.log("[v0] Response text:", await response.text())
        throw new Error("Invalid response from server")
      }

      if (!response.ok) {
        console.error("[v0] Search API error:", response.status, response.statusText, data)
        throw new Error(data?.message || "Failed to load candidates")
      }

      const limitedCandidates = (data.candidates || []).slice(0, 36)
      setCandidates(limitedCandidates)
      setFilteredCandidates(limitedCandidates)
      setHasSearched(true)
      setCurrentPage(1)

      const searchTermLower = searchTerm.toLowerCase().trim()
      const isGhanaLocation = isLocationInGhana(searchTermLower)
      console.log("[v0] Location search:", searchTermLower, "is Ghana location:", isGhanaLocation)

      if (isGhanaLocation) {
        setSearchedLocation(searchTerm.trim())
        setShowLocationNotification(true)
      }

      saveSearchCache(searchTerm, limitedCandidates, 1)
      incrementSearchCount()

      const newCount = searchCountToday + 1
      setSearchCountToday(newCount)
      localStorage.setItem("candidate_search_count_today", newCount.toString())

      if (newCount === 4) {
        setShowSearchAd(true)
      }
    } catch (error) {
      console.error("[v0] Search error:", error instanceof Error ? error.message : error)
      
      // Retry once if it's a network error
      if (retryCount < 1 && error instanceof TypeError && error.message.includes("fetch")) {
        console.log("[v0] Retrying search...")
        await new Promise((resolve) => setTimeout(resolve, 500))
        return handleSearch(retryCount + 1)
      }
      
      setHasSearched(true)
      setCandidates([])
      setFilteredCandidates([])
    } finally {
      setLoading(false)
    }
  }

  // Pagination logic
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

  // CV request handler
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

  // Key press handler
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // Loading screen component
  const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="text-center space-y-6">
        {/* Animated search bars */}
        <div className="flex justify-center items-center gap-2 h-12">
          <div
            className="w-2 h-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-full animate-pulse"
            style={{ animationDuration: "0.6s" }}
          ></div>
          <div
            className="w-2 h-10 bg-gradient-to-t from-blue-500 to-blue-300 rounded-full animate-pulse"
            style={{ animationDuration: "0.5s", animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-full animate-pulse"
            style={{ animationDuration: "0.6s", animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-10 bg-gradient-to-t from-blue-500 to-blue-300 rounded-full animate-pulse"
            style={{ animationDuration: "0.5s", animationDelay: "0.3s" }}
          ></div>
        </div>
        <div className="space-y-2">
          <p className="text-gray-900 font-bold text-lg">Searching talent...</p>
          <p className="text-gray-500 text-sm">Finding the best matches for you</p>
        </div>
      </div>
    </div>
  )

  // Pagination UI component
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

  // Main render logic
  const renderSearchResults = () => {
    if (!hasSearched) {
      return (
        <div className="min-h-screen flex flex-col bg-gray-50">
          {/* Header - Enhanced styling */}
          <header className="bg-gradient-to-r from-white to-blue-50 border-b border-gray-200 sticky top-0 z-20 shadow-md">
            <div className="w-full px-4 md:px-0 py-4">
              <div className="flex items-center gap-3 max-w-7xl mx-auto">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-300 hover:bg-blue-50 bg-white text-gray-700 hover:text-gray-900 font-semibold"
                >
                  <Link
                    href="/candidates-searchengine"
                    onClick={(e) => {
                      e.preventDefault()
                      setSearchTerm("")
                      setHasSearched(false)
                      setShowLocationNotification(false)
                      clearSearchCache()
                      window.location.href = "/candidates-searchengine"
                    }}
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Home</span>
                  </Link>
                </Button>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-gray-900">Talent Search</h1>
                  <p className="text-gray-600 text-xs font-medium">Find verified professionals</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 w-full flex flex-col items-center px-4 md:px-0 py-8 md:py-12">
            <div className="w-full max-w-7xl mb-6 md:mb-8">
              <VanityMetricsCompact />
            </div>
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Main Search */}
              <div className="lg:col-span-2">
                {/* Hero Slider - Now shown on initial load */}
                <div className="mb-8">
                  <CandidatesHeroSlider />
                </div>
                {/* Hero Section - Enhanced styling */}
                <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600 rounded-2xl p-8 md:p-12 mb-8 text-white shadow-xl hover:shadow-2xl transition-shadow">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold mb-2">Find Top Talent</h2>
                      <p className="text-blue-100 text-lg font-medium">Search verified professionals across Ghana</p>
                    </div>
                    <div className="hidden sm:block">
                      <Zap className="h-12 w-12 text-yellow-300 opacity-30" />
                    </div>
                  </div>
                  {/* Search Input - Enhanced */}
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/80 h-5 w-5" />
                    <Input
                      ref={heroSearchInputRef}
                      placeholder="Search by name, location, skills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-12 pr-4 py-4 text-base bg-white/95 text-gray-900 placeholder-gray-500 border-2 border-white/40 focus:border-white focus:ring-4 focus:ring-white/30 rounded-xl w-full shadow-lg hover:bg-white transition-all font-semibold"
                    />
                  </div>
                  {/* Search Button & Stats */}
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <Button
                      onClick={handleSearch}
                      disabled={loading}
                      className="bg-white text-blue-600 hover:bg-blue-50 active:bg-blue-100 font-bold px-8 py-3 rounded-lg w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {loading ? "Searching..." : "Search Now"}
                    </Button>
                    <div className="text-white/95 text-sm flex items-center gap-2 font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      <span>{getRemainingSearches()}</span>
                      <span>free searches today</span>
                    </div>
                  </div>
                </div>
                {/* Placeholder Message */}
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-md hover:shadow-lg transition-shadow">
                  <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Find Great Talent?</h3>
                  <p className="text-gray-600 font-medium">
                    Use the search field above to discover qualified professionals
                  </p>
                </div>
              </div>
              {/* Right Column - Services & PC Sidebar */}
              <div className="lg:col-span-2 space-y-6">
                {/* Mobile: Services at top */}
                <div className="lg:hidden">
                  <BoldServicesSlider />
                </div>
                {/* Desktop: Services + Sidebar */}
                <div className="hidden lg:block space-y-6">
                  <BoldServicesSlider />
                  <PCOnlySidebar />
                </div>
              </div>
            </div>
          </main>
          <SearchTipsNotification />
          <ATSInfoNotification searchInputRef={heroSearchInputRef} />
          <Footer />
        </div>
      )
    }
    if (searchLimitExceeded) {
      return (
        <div className="min-h-screen flex flex-col bg-gray-50">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="w-full px-4 md:px-0 py-4">
              <div className="flex items-center gap-3 max-w-7xl mx-auto">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-300 hover:bg-gray-100 bg-white text-gray-700 hover:text-gray-900"
                >
                  <Link
                    href="/candidates-searchengine"
                    onClick={(e) => {
                      e.preventDefault()
                      window.location.href = "/candidates-searchengine"
                    }}
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Home</span>
                  </Link>
                </Button>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">Talent Search</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 w-full px-4 py-12">
            <SearchLimitExceededCard />
          </main>
          <Footer />
        </div>
      )
    }
    if (loading) {
      return <LoadingScreen />
    }
    const currentCandidates = getPaginatedData(filteredCandidates, currentPage)
    const totalPages = getTotalPagesValue(filteredCandidates.length)
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header - Enhanced styling */}
        <header className="bg-gradient-to-r from-white to-blue-50 border-b border-gray-200 sticky top-0 z-20 shadow-md">
          <div className="w-full px-4 md:px-0 py-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-300 hover:bg-blue-50 bg-white text-gray-700 hover:text-gray-900 font-semibold"
                >
                  <Link
                    href="/candidates-searchengine"
                    onClick={(e) => {
                      e.preventDefault()
                      setSearchTerm("")
                      setHasSearched(false)
                      setShowLocationNotification(false)
                      clearSearchCache()
                      window.location.href = "/candidates-searchengine"
                    }}
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Home</span>
                  </Link>
                </Button>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-gray-900">Results</h1>
                  <p className="text-gray-600 text-xs font-medium">
                    {filteredCandidates.length} candidates for "{searchTerm}"
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-gray-300 text-gray-700 w-fit font-semibold">
                {getRemainingSearches()} searches
              </Badge>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full px-4 md:px-0 py-6 md:py-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Results */}
            <div className="lg:col-span-3">
              {/* Sticky Search Bar - Enhanced */}
              <div className="bg-gradient-to-r from-blue-50 to-white border-2 border-blue-100 rounded-xl p-3 md:p-4 mb-6 sticky top-20 z-40 shadow-md hover:shadow-lg transition-all">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 font-bold" />
                  <Input
                    ref={resultsSearchInputRef}
                    placeholder="Search candidates, location, skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-4 py-3 text-sm bg-white border-2 border-blue-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 w-full rounded-lg transition-all font-semibold"
                  />
                </div>
              </div>
              {showLocationNotification && searchedLocation && (
                <LocationBasedNotification
                  searchedLocation={searchedLocation}
                  resultCount={filteredCandidates.length}
                  onDismiss={() => setShowLocationNotification(false)}
                />
              )}
              {/* Results Info */}
              <div className="flex justify-between items-center mb-6 text-xs text-gray-600 font-medium">
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
              {/* Results */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 space-y-4 shadow-md">
                {currentCandidates.length > 0 ? (
                  currentCandidates.map((candidate, index) => (
                    <GoogleStyleSearchResult
                      key={candidate.id}
                      candidate={candidate}
                      onRequestCV={handleRequestCV}
                      index={index}
                      rawScore={candidate.matchScore || 50}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Candidates Found</h3>
                    <p className="text-gray-600">Try adjusting your search terms</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        setHasSearched(false)
                        clearSearchCache()
                      }}
                      className="mt-4 border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      New Search
                    </Button>
                  </div>
                )}
              </div>
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
            {/* Right: Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <PCOnlySidebar />
            </div>
          </div>
        </main>
        <SearchTipsNotification />
        <ATSInfoNotification searchInputRef={resultsSearchInputRef} />

        {showSearchAd && <SearchAdsOverlay onClose={() => setShowSearchAd(false)} />}

        <Footer />
      </div>
    )
  }

  return renderSearchResults()
}

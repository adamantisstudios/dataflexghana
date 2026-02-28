"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Users,
  GraduationCap,
  MessageCircle,
  Search,
  Home,
  CheckCircle,
  XCircle,
  ArrowRight,
  MessageSquare,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import Link from "next/link"
import DomesticWorkersHeroSlider from "@/components/public/domestic-workers/DomesticWorkersHeroSlider"
import DomesticWorkerRequestModal from "@/components/public/domestic-workers/DomesticWorkerRequestModal"
import ImageGallery from "@/components/public/domestic-workers/ImageGallery"

export interface DomesticWorker {
  id: string
  full_name: string
  age: number
  years_of_experience: number
  highest_education_level: string
  key_skills: string
  current_location: string
  availability_status: "available" | "unavailable"
  image_url_1?: string
  image_url_2?: string
  image_url_3?: string
  religion?: string
  primary_language?: string
  other_languages?: string
  willing_to_relocate?: boolean
  job_type?: "Live-In" | "Live-Out" | "Live-In or Live-Out"
  created_at: string
}

export default function DomesticWorkersClient() {
  const [workers, setWorkers] = useState<DomesticWorker[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<DomesticWorker[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<DomesticWorker | null>(null)
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [galleryWorker, setGalleryWorker] = useState<DomesticWorker | null>(null)
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)
  const [pageLoadTime, setPageLoadTime] = useState<Date | null>(null)
  const itemsPerPage = 12

  useEffect(() => {
    setPageLoadTime(new Date())
    const loadInitialCandidates = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("domestic_workers_candidates")
          .select("*")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(5)
        if (error) throw error
        const initialWorkers = data || []
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(null)
          }, 15000)
        })
        setWorkers(initialWorkers)
        setFilteredWorkers(initialWorkers)
        setHasSearched(true)
        setCurrentPage(1)
      } catch (error) {
        console.error("Error loading initial domestic workers:", error)
        setHasSearched(true)
      } finally {
        setLoading(false)
      }
    }
    loadInitialCandidates()
  }, [])

  const handleSearch = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("domestic_workers_candidates")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
      if (error) throw error
      let filtered = data || []
      if (searchTerm) {
        const query = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (worker) =>
            worker.full_name?.toLowerCase().includes(query) ||
            worker.current_location?.toLowerCase().includes(query) ||
            worker.key_skills?.toLowerCase().includes(query) ||
            worker.highest_education_level?.toLowerCase().includes(query) ||
            worker.job_type?.toLowerCase().includes(query) ||
            worker.primary_language?.toLowerCase().includes(query),
        )
      }
      setFilteredWorkers(filtered)
      setCurrentPage(1)
    } catch (error) {
      console.error("Error loading domestic workers:", error)
      setFilteredWorkers([])
    } finally {
      setLoading(false)
    }
  }

  const getPaginatedData = (data: DomesticWorker[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleRequestDetails = (worker: DomesticWorker) => {
    setSelectedWorker(worker)
    setShowRequestModal(true)
  }

  const handleImageClick = (worker: DomesticWorker, imageIndex = 0) => {
    setGalleryWorker(worker)
    setGalleryInitialIndex(imageIndex)
    setShowImageGallery(true)
  }

  const handleWhatsAppAdmin = (worker: DomesticWorker) => {
    const whatsappNumber = "+233242799990"
    const message = `Hello Admin, I'm interested in this domestic worker:\n\nWorker ID: ${worker.id}\nName: ${worker.full_name}\nExperience: ${worker.years_of_experience} years\nLocation: ${worker.current_location}\nSkills: ${worker.key_skills}\n\nPlease provide more details and arrange a meeting.`
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const getAgeRange = (age: number) => {
    if (age <= 25) return "20-25"
    if (age <= 30) return "26-30"
    if (age <= 35) return "31-35"
    if (age <= 40) return "36-40"
    return "40+"
  }

  const getAbridgedName = (fullName: string) => {
    const names = fullName.split(" ")
    if (names.length === 1) return names[0]
    return `${names[0]} ${names[names.length - 1].charAt(0)}.`
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
  }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null
    const getVisiblePages = () => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768
      const maxVisible = isMobile ? 3 : 5
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
      <div className="flex justify-center mt-6">
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

  if (!hasSearched) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-x-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 shadow-md border-b border-green-700 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto w-full px-4 py-4 md:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 shrink-0"
                >
                  <Link
                    href="/domestic-workers"
                    onClick={() => {
                      setSearchTerm("")
                      setHasSearched(false)
                      setCurrentPage(1)
                      window.location.reload()
                    }}
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Home</span>
                  </Link>
                </Button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">Domestic Workers in Ghana</h1>
                  <p className="text-green-100 text-sm">Find trusted home care professionals</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-2 sm:px-4 py-4 md:py-6">
          {/* Hero Slider */}
          <DomesticWorkersHeroSlider />
          {/* Welcome Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-green-200 p-6 mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">
              Find Trusted Home Care Professionals in Ghana
            </h2>
            <p className="text-green-600 text-lg mb-4">
              Connect with experienced housekeepers, nannies, cleaners, personal nurses, and more. We process workers
              for you!
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-green-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">Search for Domestic Workers</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, location, skills, job type, education..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 border-green-200 focus:border-green-500"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <Search className="h-5 w-5 mr-2" />
                {loading ? "Loading..." : "Search"}
              </Button>
            </div>
            <p className="text-sm text-green-600 mt-3 text-center">
              Click the search button to browse our database of trusted domestic workers
            </p>
          </div>
          {/* Registration CTA */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg border border-purple-200 p-6 mb-6 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-purple-800 mb-3">
              Join Our Network of Trusted Professionals
            </h2>
            <p className="text-purple-600 text-lg mb-5">
              Register as a Domestic Worker or Care Professional in minutes.
            </p>
            <div className="flex justify-center">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl text-lg px-8 py-4 transform hover:scale-105 transition-all"
              >
                <Link href="/register-worker">
                  <Users className="mr-2 h-5 w-5" />
                  Register Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          {/* No Search Message */}
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-green-300" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">Ready to Find Great Domestic Workers?</h3>
            <p className="text-green-600">
              Use the search field above and click the search button to start discovering trusted professionals from our
              network.
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-green-700 font-medium">Loading domestic workers...</p>
        </div>
      </div>
    )
  }

  const currentWorkers = getPaginatedData(filteredWorkers, currentPage)
  const totalPages = getTotalPages(filteredWorkers.length)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 shadow-md border-b border-green-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto w-full px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 shrink-0"
              >
                <Link
                  href="/domestic-workers"
                  onClick={() => {
                    setSearchTerm("")
                    setHasSearched(false)
                    setCurrentPage(1)
                    window.location.reload()
                  }}
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Home</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Domestic Workers in Ghana</h1>
                <p className="text-green-100 text-sm">Find trusted home care professionals</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Users className="h-4 w-4 mr-1" />
              {filteredWorkers.length} Workers
            </Badge>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-2 sm:px-4 py-4 md:py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-green-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 h-4 w-4" />
              <Input
                placeholder="Search by name, location, skills, job type, education..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 border-green-200 focus:border-green-500"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          <div className="flex justify-between items-center mt-4 text-sm text-green-600">
            <span>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredWorkers.length)}-
              {Math.min(currentPage * itemsPerPage, filteredWorkers.length)} of {filteredWorkers.length} workers
            </span>
            {totalPages > 1 && (
              <span className="hidden sm:inline">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        </div>
        {/* Workers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {currentWorkers.map((worker) => {
            const workerImages = [worker.image_url_1, worker.image_url_2, worker.image_url_3].filter(Boolean)
            return (
              <Card
                key={worker.id}
                className="hover:shadow-xl transition-all duration-300 border-green-200 bg-white/90 backdrop-blur-sm overflow-hidden hover:transform hover:-translate-y-1"
              >
                <div className="relative">
                  <div className="aspect-[4/3] w-full bg-gradient-to-br from-green-100 to-emerald-100 overflow-hidden">
                    <div
                      className="w-full h-full cursor-pointer relative group"
                      onClick={() => handleImageClick(worker, 0)}
                    >
                      <ImageWithFallback
                        src={worker.image_url_1 || "/domestic-worker-profile.jpg"}
                        alt={getAbridgedName(worker.full_name)}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        fallbackSrc="/domestic-worker-profile.jpg"
                      />
                      {workerImages.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          +{workerImages.length - 1} more
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    {worker.availability_status === "available" ? (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-500 text-white">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unavailable
                      </Badge>
                    )}
                  </div>
                </div>
                {workerImages.length > 1 && (
                  <div className="px-4 py-2 bg-gray-50 border-b">
                    <div className="flex gap-2 overflow-x-auto">
                      {workerImages.slice(1).map((image, index) => (
                        <div
                          key={index + 1}
                          className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                          onClick={() => handleImageClick(worker, index + 1)}
                        >
                          <ImageWithFallback
                            src={image || "/domestic-worker-profile.jpg"}
                            alt={`${getAbridgedName(worker.full_name)} - Image ${index + 2}`}
                            className="w-full h-full object-cover"
                            fallbackSrc="/domestic-worker-profile.jpg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800 mb-2 flex items-center justify-between">
                    {getAbridgedName(worker.full_name)}
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-800 border-green-200">
                      {worker.years_of_experience} yrs
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                    <span>Age: {getAgeRange(worker.age)}</span>
                    <span>•</span>
                    <span>{worker.current_location}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {worker.highest_education_level && (
                      <div className="flex items-center gap-2 text-green-600">
                        <GraduationCap className="h-4 w-4" />
                        <span className="text-sm">{worker.highest_education_level}</span>
                      </div>
                    )}
                    {worker.key_skills && (
                      <div className="text-sm text-green-600">
                        <strong>Skills:</strong> {worker.key_skills}
                      </div>
                    )}
                    <div className="space-y-2 pt-2 border-t border-green-100">
                      {worker.willing_to_relocate !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-700 font-medium">Willing To Relocate:</span>
                          <Badge variant={worker.willing_to_relocate ? "default" : "secondary"} className="text-xs">
                            {worker.willing_to_relocate ? "Yes" : "No"}
                          </Badge>
                        </div>
                      )}
                      {worker.job_type && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-700 font-medium">Job Type:</span>
                          <Badge variant="outline" className="text-xs">
                            {worker.job_type}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-green-100">
                      <Button
                        size="sm"
                        onClick={() => handleRequestDetails(worker)}
                        className="bg-green-600 hover:bg-green-700 text-xs"
                        disabled={worker.availability_status === "unavailable"}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Request Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWhatsAppAdmin(worker)}
                        className="text-xs border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {filteredWorkers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-green-300" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">No Workers Found</h3>
            <p className="text-green-600">Try adjusting your search criteria or filters.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setHasSearched(false)
                setCurrentPage(1)
                window.location.reload()
              }}
              className="mt-4"
            >
              Clear Search
            </Button>
          </div>
        )}
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </main>
      {/* Request Modal */}
      {showRequestModal && selectedWorker && (
        <DomesticWorkerRequestModal
          worker={selectedWorker}
          isOpen={showRequestModal}
          onClose={() => {
            setShowRequestModal(false)
            setSelectedWorker(null)
          }}
        />
      )}
      {/* Image Gallery Modal */}
      {showImageGallery && galleryWorker && (
        <ImageGallery
          images={[galleryWorker.image_url_1, galleryWorker.image_url_2, galleryWorker.image_url_3]}
          workerName={getAbridgedName(galleryWorker.full_name)}
          isOpen={showImageGallery}
          onClose={() => {
            setShowImageGallery(false)
            setGalleryWorker(null)
          }}
          initialIndex={galleryInitialIndex}
        />
      )}
    </div>
  )
}

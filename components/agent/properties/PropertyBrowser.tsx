"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Phone,
  MessageCircle,
  Search,
  Filter,
  PhoneCall,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Agent } from "@/lib/supabase"
import type { Property } from "../../../app/agent/properties/page"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { PropertyDescription } from "@/components/ui/property-description"

interface PropertyBrowserProps {
  agent: Agent
  favoriteProperties: string[]
  onToggleFavorite: (propertyId: string) => void
  onInquirySuccess: () => void
  onInquiryError: (error: string) => void
}

const propertyCategories = [
  "All Categories",
  "Houses for Sale",
  "Houses for Rent",
  "Apartments / Flats",
  "Commercial Properties",
  "Land for Sale",
  "New Developments / Estates",
  "Short Stay / Airbnb-style Rentals",
  "Luxury Properties",
  "Industrial Properties",
  "Serviced / Shared Spaces",
]

const priceRanges = {
  GHS: [
    "All Prices",
    "₵450 – ₵2,000",
    "₵2,000 – ₵10,000",
    "₵10,000 – ₵50,000",
    "₵50,000 – ₵150,000",
    "₵150,000 – ₵500,000",
    "₵500,000 and above",
  ],
  USD: [
    "All Prices",
    "$100 – $2,000",
    "$2,000 – $10,000",
    "$10,000 – $50,000",
    "$50,000 – $150,000",
    "$150,000 – $500,000",
    "$500,000 and above",
  ],
}

export default function PropertyBrowser({
  agent,
  favoriteProperties,
  onToggleFavorite,
  onInquirySuccess,
  onInquiryError,
}: PropertyBrowserProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedPriceRange, setSelectedPriceRange] = useState("All Prices")
  const [selectedCurrency, setSelectedCurrency] = useState("All Currencies")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [modalImageAlt, setModalImageAlt] = useState("")
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        console.log("[v0] Loading properties from database...")

        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .in("status", ["Published", "Featured"])
          .eq("is_approved", true)  // Only show admin-approved properties
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Database error loading properties:", error)
          throw error
        }

        console.log("[v0] Properties loaded from database:", data?.length || 0)
        console.log("[v0] Sample properties:", data?.slice(0, 2))

        setProperties(data || [])
      } catch (error) {
        console.error("Error loading properties:", error)
        onInquiryError("Failed to load properties")
      } finally {
        setLoading(false)
      }
    }
    loadProperties()
  }, [onInquiryError])

  // Filter properties
  useEffect(() => {
    console.log("[v0] Filtering properties. Total properties:", properties.length)

    properties.forEach((property, index) => {
      console.log(
        `[v0] Property ${index + 1}: ${property.title}, Currency: "${property.currency}", Type: ${typeof property.currency}`,
      )
    })

    let filtered = properties
    if (searchTerm) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((property) => property.category === selectedCategory)
    }

    if (selectedCurrency !== "All Currencies") {
      filtered = filtered.filter((property) => {
        const propertyCurrency = property.currency || "GHS" // Default to GHS if currency is null/undefined
        return propertyCurrency === selectedCurrency
      })
    }

    console.log("[v0] Filtered properties:", filtered.length)
    console.log("[v0] Applied filters:", { searchTerm, selectedCategory, selectedCurrency, selectedPriceRange })

    filtered.forEach((property, index) => {
      console.log(`[v0] Filtered Property ${index + 1}: ${property.title}, Currency: "${property.currency}"`)
    })

    setFilteredProperties(filtered)
    setCurrentPage(1)
  }, [properties, searchTerm, selectedCategory, selectedPriceRange, selectedCurrency])

  const getPaginatedData = (data: Property[], currentPage: number) => {
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

  const openImageModal = (images: string[], index: number, alt: string) => {
    const validImages = images.filter(
      (img) => img && typeof img === "string" && img.trim() !== "" && img !== "/placeholder.svg",
    )
    if (validImages.length === 0) {
      setModalImages(["/placeholder.svg"])
      setModalImageIndex(0)
    } else {
      const adjustedIndex = Math.min(Math.max(0, index), validImages.length - 1)
      setModalImages([...validImages])
      setModalImageIndex(adjustedIndex)
    }
    setModalImageAlt(alt)
    setShowImageModal(true)
  }

  const handleModalIndexChange = (newIndex: number) => {
    setModalImageIndex(newIndex)
  }

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === "GHS" ? "₵" : "$"
    return `${symbol}${price.toLocaleString()}`
  }

  const handleContactAdmin = (property: Property) => {
    const phone = "0242799990"
    window.open(`tel:${phone}`, "_self")
  }

  const handleRequestCall = async (property: Property) => {
    try {
      const { error } = await supabase.from("call_requests").insert([
        {
          property_id: property.id,
          agent_id: agent.id,
          agent_name: agent.full_name,
          agent_email: agent.email,
          agent_phone: agent.phone_number,
          property_title: property.title,
          property_price: property.price,
          property_currency: property.currency,
          request_message: `Call back request from agent ${agent.full_name} for property: ${property.title}`,
          status: "pending",
        },
      ])
      if (error) throw error
      onInquirySuccess()
      setShowSuccessPopup(true)
      setTimeout(() => {
        setShowSuccessPopup(false)
      }, 6000)
    } catch (error) {
      console.error("Error submitting call request:", error)
      onInquiryError("Failed to request callback")
    }
  }

  const handleWhatsAppAdmin = (property: Property) => {
    const whatsappNumber = "+233242799990"
    const message = `Hello Admin, I'm interested in this property:
Property ID: ${property.id}
Property: ${property.title}
Price: ${formatPrice(property.price, property.currency)}
Agent: ${agent.full_name}
Contact: ${agent.phone_number}`
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
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
                  if (currentPage > 1) {
                    onPageChange(currentPage - 1)
                  }
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
                  if (currentPage < totalPages) {
                    onPageChange(currentPage + 1)
                  }
                }}
                className={`${currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
        <span className="ml-3 text-emerald-700">Loading properties...</span>
      </div>
    )
  }

  const currentProperties = getPaginatedData(filteredProperties, currentPage)
  const totalPages = getTotalPages(filteredProperties.length)

  console.log("[v0] Pagination info:", {
    currentPage,
    totalPages,
    filteredPropertiesLength: filteredProperties.length,
    currentPropertiesLength: currentProperties.length,
    itemsPerPage,
  })

  return (
    <div className="space-y-6 relative">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Request Sent!</h3>
            <p className="text-gray-700">
              Your call request has been sent to the admin and the admin will call back in under 10 minutes.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-emerald-200 focus:border-emerald-500"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {propertyCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedCurrency}
            onValueChange={(value) => {
              setSelectedCurrency(value)
              setSelectedPriceRange("All Prices")
            }}
          >
            <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Currencies">All Currencies</SelectItem>
              <SelectItem value="GHS">Ghana Cedi (₵)</SelectItem>
              <SelectItem value="USD">US Dollar ($)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
            <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectedCurrency === "All Currencies"
                ? ["All Prices"].map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))
                : priceRanges[selectedCurrency as keyof typeof priceRanges].map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between items-center mt-4 text-sm text-emerald-600">
          <span>
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProperties.length)}-
            {Math.min(currentPage * itemsPerPage, filteredProperties.length)} of {filteredProperties.length} properties
          </span>
          {totalPages > 1 && (
            <span className="hidden sm:inline">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentProperties.map((property) => (
          <Card
            key={property.id}
            className="hover:shadow-xl transition-all duration-300 border-emerald-200 bg-white/90 backdrop-blur-sm overflow-hidden"
          >
            <div className="relative">
              {property.image_urls && property.image_urls.length > 0 && (
                <div className="aspect-[4/3] w-full bg-gradient-to-br from-emerald-100 to-green-100 overflow-hidden cursor-pointer relative">
                  <ImageWithFallback
                    src={property.image_urls[0] || "/placeholder.svg"}
                    alt={property.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    onClick={() => openImageModal(property.image_urls || [], 0, property.title)}
                    fallbackSrc="/diverse-property-showcase.png"
                  />
                  {property.image_urls.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      {property.image_urls.length - 1}
                    </div>
                  )}
                </div>
              )}
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-emerald-800 mb-2">{property.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice(property.price, property.currency)}
                    </span>
                    {property.currency === "USD" && (
                      <Badge variant="outline" className="text-xs">
                        USD
                      </Badge>
                    )}
                    {property.commission && property.commission > 0 && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs" title="Commission paid in Ghana Cedis (GH¢)">
                        Commission: ₵{property.commission.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(property.id)}
                  className={`${favoriteProperties.includes(property.id) ? "text-red-500" : "text-gray-400"} hover:text-red-500`}
                >
                  <Heart className={`h-5 w-5 ${favoriteProperties.includes(property.id) ? "fill-current" : ""}`} />
                </Button>
              </div>
              <Badge variant="secondary" className="w-fit mb-2">
                {property.category}
              </Badge>
              {property.badges && property.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {property.badges.map((badge, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {property.location && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{property.location}</span>
                  </div>
                )}
                {property.details && (
                  <div className="flex flex-wrap gap-4 text-sm text-emerald-600">
                    {property.details.bedrooms && (
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{property.details.bedrooms} bed</span>
                      </div>
                    )}
                    {property.details.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span>{property.details.bathrooms} bath</span>
                      </div>
                    )}
                    {property.details.size && (
                      <div className="flex items-center gap-1">
                        <Square className="h-4 w-4" />
                        <span>{property.details.size}</span>
                      </div>
                    )}
                  </div>
                )}
                {property.description && <PropertyDescription description={property.description} />}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-emerald-100">
                  <Button
                    size="sm"
                    onClick={() => handleContactAdmin(property)}
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call Admin
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestCall(property)}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs"
                  >
                    <PhoneCall className="h-3 w-3 mr-1" />
                    Request Call
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleWhatsAppAdmin(property)}
                    className="bg-green-600 hover:bg-green-700 text-xs col-span-2"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    WhatsApp Admin
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
          <h3 className="text-xl font-semibold text-emerald-800 mb-2">No Properties Found</h3>
          <p className="text-emerald-600">Try adjusting your search criteria or filters.</p>
        </div>
      )}

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-white/80 rounded-full hover:bg-white"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
            <div className="relative h-[70vh] flex items-center justify-center">
              <img
                src={modalImages[modalImageIndex] || "/placeholder.svg"}
                alt={modalImageAlt}
                className="max-w-full max-h-full object-contain"
              />
              {modalImages.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      handleModalIndexChange((modalImageIndex - 1 + modalImages.length) % modalImages.length)
                    }
                    className="absolute left-4 p-2 bg-white/80 rounded-full hover:bg-white"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleModalIndexChange((modalImageIndex + 1) % modalImages.length)}
                    className="absolute right-4 p-2 bg-white/80 rounded-full hover:bg-white"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-700" />
                  </button>
                </>
              )}
            </div>
            <div className="p-4 text-center text-sm text-gray-600 bg-gray-50">
              {modalImageAlt} ({modalImageIndex + 1} of {modalImages.length})
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

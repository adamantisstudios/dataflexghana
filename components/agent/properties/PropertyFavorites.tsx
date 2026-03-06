"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { MapPin, Bed, Bath, Square, Heart, Phone, MessageCircle, PhoneCall, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Agent } from "@/lib/supabase"
import type { Property } from "../../../app/agent/properties/page"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { ImageModal } from "@/components/ui/image-modal"
import { PropertyDescription } from "@/components/ui/property-description"

interface PropertyFavoritesProps {
  agent: Agent
  favoriteProperties: string[]
  onToggleFavorite: (propertyId: string) => void
  onInquirySuccess: () => void
  onInquiryError: (error: string) => void
}

export default function PropertyFavorites({
  agent,
  favoriteProperties,
  onToggleFavorite,
  onInquirySuccess,
  onInquiryError,
}: PropertyFavoritesProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [modalImageAlt, setModalImageAlt] = useState("")

  // Load favorite properties
  useEffect(() => {
    const loadFavoriteProperties = async () => {
      if (favoriteProperties.length === 0) {
        setProperties([])
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .in("id", favoriteProperties)
          .in("status", ["Published", "Featured"])
          .eq("is_approved", true)  // Only show admin-approved properties
          .order("created_at", { ascending: false })

        if (error) throw error
        setProperties(data || [])
      } catch (error) {
        console.error("Error loading favorite properties:", error)
        onInquiryError("Failed to load favorite properties")
      } finally {
        setLoading(false)
      }
    }

    loadFavoriteProperties()
  }, [favoriteProperties, onInquiryError])

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
          agent_id: agent.id, // Added agent_id field for proper tracking
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
        <span className="ml-3 text-emerald-700">Loading favorite properties...</span>
      </div>
    )
  }

  if (favoriteProperties.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
        <h3 className="text-xl font-semibold text-emerald-800 mb-2">No Favorite Properties</h3>
        <p className="text-emerald-600">Start browsing properties and add them to your favorites!</p>
      </div>
    )
  }

  const currentProperties = getPaginatedData(properties, currentPage)
  const totalPages = getTotalPages(properties.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-emerald-800">Your Favorite Properties</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            {favoriteProperties.length} properties
          </Badge>
          {totalPages > 1 && (
            <span className="text-sm text-emerald-600 hidden sm:inline">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </div>

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
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(property.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Heart className="h-5 w-5 fill-current" />
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

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={modalImages}
        currentIndex={modalImageIndex}
        onIndexChange={handleModalIndexChange}
        alt={modalImageAlt}
      />
    </div>
  )
}

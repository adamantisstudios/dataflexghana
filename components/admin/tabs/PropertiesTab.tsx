"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabase } from "@/lib/supabase"
import {
  Trash2,
  Edit,
  Search,
  Filter,
  Plus,
  Eye,
  EyeOff,
  Star,
  MapPin,
  Bed,
  Bath,
  Square,
  Upload,
  X,
  Home,
  Phone,
} from "lucide-react"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { ImageModal } from "@/components/ui/image-modal"
import { PropertyDescription } from "@/components/ui/property-description"
import CallRequestsTab from "./CallRequestsTab"
import { uploadPropertyImage } from "@/lib/property-image-upload"

interface Property {
  id: string
  title: string
  image_urls?: string[] // Updated to support multiple images
  price: number
  currency: string
  commission?: number
  category: string
  details: {
    bedrooms?: number
    bathrooms?: number
    size?: string
    furnished?: string
    amenities?: string
    [key: string]: any
  }
  location?: string
  description?: string
  contact_info: {
    phone?: string
    whatsapp?: string
    [key: string]: any
  }
  badges?: string[]
  status: string
  created_at: string
  updated_at: string
  published_by_agent_id?: string
  is_approved?: boolean
}

interface CallRequest {
  id: string
  property_id: string
  agent_name: string
  agent_email?: string
  agent_phone?: string
  property_title: string
  property_price: number
  property_currency: string
  request_message?: string
  status: string
  created_at: string
  updated_at: string
}

interface PropertiesTabProps {
  getCachedData: () => Property[] | undefined
  setCachedData: (data: Property[]) => void
}

const propertyCategories = [
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

const propertyBadges = [
  "New",
  "Featured",
  "Hot Deal",
  "Luxury",
  "Prime Location",
  "High Traffic",
  "Beachside",
  "Registered Title",
  "Good Access",
  "Main Road",
  "Commercial",
  "Estate",
  "Fully Equipped",
  "24/7 Access",
  "Co-working",
  "Industrial",
  "Large Space",
]

export default function PropertiesTab({ getCachedData, setCachedData }: PropertiesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("management")
  const [callRequestsCache, setCallRequestsCache] = useState<CallRequest[]>()

  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [currencyFilter, setCurrencyFilter] = useState("All Currencies")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [agentFilter, setAgentFilter] = useState("All")
  const [agents, setAgents] = useState<Array<{ id: string; full_name: string }>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showPropertyDialog, setShowPropertyDialog] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [modalImageAlt, setModalImageAlt] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    image_urls: [] as string[], // Updated to support multiple images
    price: "",
    currency: "GHS",
    commission: "",
    category: "",
    bedrooms: "",
    bathrooms: "",
    size: "",
    furnished: "",
    amenities: "",
    location: "",
    description: "",
    phone: "0242799990",
    whatsapp: "+233242799990",
    badges: [] as string[],
    status: "Published",
  })

  const [newImageUrl, setNewImageUrl] = useState("")
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const itemsPerPage = 12
  const propertiesListRef = useRef<HTMLDivElement>(null)

  const getCallRequestsCachedData = () => callRequestsCache
  const setCallRequestsCachedData = (data: CallRequest[]) => setCallRequestsCache(data)

  const scrollToTop = () => {
    if (propertiesListRef.current) {
      propertiesListRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  const addImageUrl = () => {
    if (newImageUrl.trim() && !formData.image_urls.includes(newImageUrl.trim())) {
      setFormData((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, newImageUrl.trim()],
      }))
      setNewImageUrl("")
    }
  }

  const removeImageUrl = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }))
  }

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || files.length === 0) return

    try {
      setUploadingFiles(true)
      setUploadProgress(0)

      const fileArray = Array.from(files)
      const uploadedUrls: string[] = []

      for (let i = 0; i < fileArray.length; i++) {
        try {
          const file = fileArray[i]
          console.log(`[v0] Admin uploading image ${i + 1}/${fileArray.length}: ${file.name}`)

          const progressCallback = (progress: number) => {
            setUploadProgress(Math.round(((i + progress / 100) / fileArray.length) * 100))
          }

          const url = await uploadPropertyImage(file, "admin", progressCallback)
          uploadedUrls.push(url)
        } catch (error) {
          console.error(`Failed to upload ${fileArray[i].name}:`, error)
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          image_urls: [...prev.image_urls, ...uploadedUrls],
        }))
      }
    } catch (error) {
      console.error("Error during file upload:", error)
    } finally {
      setUploadingFiles(false)
      setUploadProgress(0)
    }
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

  useEffect(() => {
    const loadProperties = async () => {
      const cachedData = getCachedData()
      if (cachedData) {
        setProperties(cachedData)
        setLoading(false)
        return
      }

      try {
        const { data: propertiesData, error: propertiesError } = await supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false })

        if (propertiesError) throw propertiesError

        setProperties(propertiesData || [])
        setCachedData(propertiesData || [])
      } catch (error) {
        console.error("Error loading properties:", error)
        alert("Failed to load properties data.")
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [getCachedData, setCachedData])

  // Load agents who can publish properties
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("id, full_name")
          .eq("can_publish_properties", true)
          .order("full_name")

        if (error) throw error
        setAgents(data || [])
      } catch (error) {
        console.error("Error loading agents:", error)
      }
    }

    loadAgents()
  }, [])

  useEffect(() => {
    const filtered = properties.filter((property) => {
      const matchesSearch =
        property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "All Categories" || property.category === categoryFilter
      const matchesCurrency = currencyFilter === "All Currencies" || property.currency === currencyFilter
      
      // Only apply status filter when agent filter is "All", otherwise show all statuses for the selected agent
      const matchesStatus = statusFilter === "All Status" && agentFilter === "All" ? true : 
                           statusFilter === "All Status" || property.status === statusFilter

      // Apply agent filter - shows ALL properties (all statuses) for the selected agent
      const matchesAgent = agentFilter === "All" || property.published_by_agent_id === agentFilter

      return matchesSearch && matchesCategory && matchesCurrency && matchesStatus && matchesAgent
    })

    setFilteredProperties(filtered)
    setCurrentPage(1)
  }, [searchTerm, properties, categoryFilter, currencyFilter, statusFilter, agentFilter])

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === "GHS" ? "₵" : "$"
    return `${symbol}${price.toLocaleString()}`
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const openPropertyDialog = (property?: Property) => {
    if (property) {
      setSelectedProperty(property)
      setIsEditing(true)
      setFormData({
        title: property.title || "",
        image_urls: property.image_urls || [], // Updated to use image_urls array
        price: property.price?.toString() || "",
        currency: property.currency || "GHS",
        commission: property.commission?.toString() || "",
        category: property.category || "",
        bedrooms: property.details?.bedrooms?.toString() || "",
        bathrooms: property.details?.bathrooms?.toString() || "",
        size: property.details?.size || "",
        furnished: property.details?.furnished || "",
        amenities: property.details?.amenities || "",
        location: property.location || "",
        description: property.description || "",
        phone: property.contact_info?.phone || "0242799990",
        whatsapp: property.contact_info?.whatsapp || "+233242799990",
        badges: property.badges || [],
        status: property.status || "Published",
      })
    } else {
      setSelectedProperty(null)
      setIsEditing(false)
      setFormData({
        title: "",
        image_urls: [], // Updated to use image_urls array
        price: "",
        currency: "GHS",
        commission: "",
        category: "",
        bedrooms: "",
        bathrooms: "",
        size: "",
        furnished: "",
        amenities: "",
        location: "",
        description: "",
        phone: "0242799990",
        whatsapp: "+233242799990",
        badges: [],
        status: "Published",
      })
    }
    setShowPropertyDialog(true)
  }

  const handleSaveProperty = async () => {
    if (!formData.title || !formData.price || !formData.currency) {
      alert("Please fill in the required fields: Title, Price, and Currency")
      return
    }

    try {
      const propertyData = {
        title: formData.title,
        image_urls: formData.image_urls.length > 0 ? formData.image_urls : ["/placeholder.svg"], // Updated to use image_urls array
        price: Number.parseFloat(formData.price),
        currency: formData.currency,
        commission: formData.commission ? Number.parseFloat(formData.commission) : 0,
        category: formData.category,
        details: {
          bedrooms: formData.bedrooms ? Number.parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? Number.parseInt(formData.bathrooms) : null,
          size: formData.size || null,
          furnished: formData.furnished || null,
          amenities: formData.amenities || null,
        },
        location: formData.location || null,
        description: formData.description || null,
        contact_info: {
          phone: formData.phone,
          whatsapp: formData.whatsapp,
        },
        badges: formData.badges,
        status: formData.status,
      }

      if (isEditing && selectedProperty) {
        const { error } = await supabase.from("properties").update(propertyData).eq("id", selectedProperty.id)

        if (error) throw error

        const updatedProperties = properties.map((property) =>
          property.id === selectedProperty.id ? { ...property, ...propertyData } : property,
        )
        setProperties(updatedProperties)
        setCachedData(updatedProperties)
      } else {
        const { data, error } = await supabase.from("properties").insert([propertyData]).select()

        if (error) throw error

        const updatedProperties = [data[0], ...properties]
        setProperties(updatedProperties)
        setCachedData(updatedProperties)
      }

      setShowPropertyDialog(false)
    } catch (error) {
      console.error("Error saving property:", error)
      alert("Failed to save property")
    }
  }

  const deleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) return

    try {
      const { error } = await supabase.from("properties").delete().eq("id", propertyId)
      if (error) throw error

      const updatedProperties = properties.filter((property) => property.id !== propertyId)
      setProperties(updatedProperties)
      setCachedData(updatedProperties)
    } catch (error) {
      console.error("Error deleting property:", error)
      alert("Failed to delete property")
    }
  }

  const togglePropertyStatus = async (propertyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Published" ? "Unpublished" : "Published"

    try {
      const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", propertyId)

      if (error) throw error

      const updatedProperties = properties.map((property) =>
        property.id === propertyId ? { ...property, status: newStatus } : property,
      )
      setProperties(updatedProperties)
      setCachedData(updatedProperties)
    } catch (error) {
      console.error("Error updating property status:", error)
      alert("Failed to update property status")
    }
  }

  const toggleFeatured = async (propertyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Featured" ? "Published" : "Featured"

    try {
      const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", propertyId)

      if (error) throw error

      const updatedProperties = properties.map((property) =>
        property.id === propertyId ? { ...property, status: newStatus } : property,
      )
      setProperties(updatedProperties)
      setCachedData(updatedProperties)
    } catch (error) {
      console.error("Error updating featured status:", error)
      alert("Failed to update featured status")
    }
  }

  const handleBadgeToggle = (badge: string) => {
    setFormData((prev) => ({
      ...prev,
      badges: prev.badges.includes(badge) ? prev.badges.filter((b) => b !== badge) : [...prev.badges, badge],
    }))
  }

  const getPaginatedData = (data: Property[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
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
      <div className="flex justify-center mt-4 sm:mt-6">
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
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-emerald-800">Properties</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                {filteredProperties.length} properties
              </Badge>
              {callRequestsCache && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {callRequestsCache.filter((r) => r.status === "pending").length} pending calls
                </Badge>
              )}
            </div>
          </div>

          <TabsList className="w-full bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl">
            <div className="flex w-full gap-1">
              <TabsTrigger
                value="management"
                className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg p-3 flex items-center justify-center gap-2 flex-1"
              >
                <Home className="h-4 w-4" />
                Property Management
              </TabsTrigger>
              <TabsTrigger
                value="call-requests"
                className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg p-3 flex items-center justify-center gap-2 flex-1"
              >
                <Phone className="h-4 w-4" />
                Requests
              </TabsTrigger>
            </div>
          </TabsList>
        </div>

        <TabsContent value="management" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-emerald-800">Property Management</h3>
            <Button
              onClick={() => openPropertyDialog()}
              className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Categories">All Categories</SelectItem>
                {propertyCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Currencies">All Currencies</SelectItem>
                <SelectItem value="GHS">Ghana Cedi (₵)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Status">All Status</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Unpublished">Unpublished</SelectItem>
                <SelectItem value="Featured">Featured</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-emerald-600 flex items-center">
              Total: {filteredProperties.length} properties
            </div>
          </div>

          <div ref={propertiesListRef} className="space-y-4">
            {getPaginatedData(filteredProperties, currentPage).map((property) => (
              <Card
                key={property.id}
                className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-emerald-800 text-lg">{property.title}</h3>
                          {property.status === "Featured" && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl font-bold text-green-600">
                            {formatPrice(property.price, property.currency)}
                          </span>
                          <Badge
                            className={
                              property.status === "Published"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : property.status === "Featured"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            {property.status}
                          </Badge>
                          {property.commission && property.commission > 0 && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200" title="Commission paid in Ghana Cedis">
                              Commission: ₵{property.commission.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {property.image_urls && property.image_urls.length > 0 && (
                        <div className="aspect-[4/3] w-full bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg overflow-hidden cursor-pointer relative mb-3">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <p className="text-emerald-600">
                        <span className="font-medium">Category:</span> {property.category}
                      </p>
                      {property.location && (
                        <p className="text-emerald-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.location}
                        </p>
                      )}
                      {property.details && (
                        <div className="flex flex-wrap gap-4 text-sm text-emerald-600 col-span-2">
                          {property.details.bedrooms && (
                            <div className="flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              <span>{property.details.bedrooms} bed</span>
                            </div>
                          )}
                          {property.details.bathrooms && (
                            <div className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              <span>{property.details.bathrooms} bath</span>
                            </div>
                          )}
                          {property.details.size && (
                            <div className="flex items-center gap-1">
                              <Square className="h-3 w-3" />
                              <span>{property.details.size}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-emerald-500 text-xs col-span-2">
                        <span className="font-medium">Created:</span> {formatTimestamp(property.created_at)}
                      </p>
                    </div>

                    {property.badges && property.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {property.badges.map((badge, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {property.description && <PropertyDescription description={property.description} />}

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-emerald-100">
                      <Button
                        size="sm"
                        onClick={() => openPropertyDialog(property)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePropertyStatus(property.id, property.status)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs"
                      >
                        {property.status === "Published" ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Show
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleFeatured(property.id, property.status)}
                        className="border-yellow-300 text-yellow-600 hover:bg-yellow-50 text-xs"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        {property.status === "Featured" ? "Unfeature" : "Feature"}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteProperty(property.id)}
                        className="text-xs col-span-2 sm:col-span-2"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={getTotalPages(filteredProperties.length)}
            onPageChange={(page) => {
              setCurrentPage(page)
              scrollToTop()
            }}
          />
        </TabsContent>

        <TabsContent value="call-requests" className="space-y-4">
          <CallRequestsTab getCachedData={getCallRequestsCachedData} setCachedData={setCallRequestsCachedData} />
        </TabsContent>
      </Tabs>

      {/* Property Dialog */}
      <Dialog open={showPropertyDialog} onOpenChange={setShowPropertyDialog}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Property" : "Add New Property"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-3"
                placeholder="Property title"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="property_link" className="text-right">
                Image URL
              </Label>
              <Input
                id="property_link"
                value={formData.image_urls[0] || ""}
                onChange={(e) => setFormData({ ...formData, image_urls: [e.target.value] })}
                className="col-span-3"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price *
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="col-span-2"
                placeholder="0.00"
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GHS">GHS (₵)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="commission" className="text-right">
                Commission (GH¢)
              </Label>
              <div className="col-span-3">
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Commission in Ghana Cedis (GH¢)</p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {propertyCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Details</Label>
              <div className="col-span-3 grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  placeholder="Bedrooms"
                />
                <Input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  placeholder="Bathrooms"
                />
                <Input
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="Size (sqm)"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="col-span-3"
                placeholder="City, Region"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                placeholder="Property description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Images</Label>
              <div className="col-span-3 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Add image URL..."
                    className="border-emerald-200 focus:border-emerald-500"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
                  />
                  <Button type="button" onClick={addImageUrl} variant="outline" disabled={uploadingFiles}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Or upload image files:</p>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        disabled={uploadingFiles}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={uploadingFiles}
                        onClick={(e) => {
                          e.preventDefault()
                          document.querySelector('input[type="file"][accept="image/*"]')?.click()
                        }}
                      >
                        {uploadingFiles ? `Uploading... ${uploadProgress}%` : "Choose Files"}
                      </Button>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formData.image_urls.map((url, index) => (
                    <div key={index} className="relative">
                      <div className="w-full h-20 rounded border overflow-hidden cursor-pointer">
                        <ImageWithFallback
                          src={url || "/placeholder.svg"}
                          alt={`Property ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                          onClick={() => openImageModal(formData.image_urls, index, `Property ${index + 1}`)}
                          fallbackSrc="/placeholder.svg?height=80&width=80"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImageUrl(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Unpublished">Unpublished</SelectItem>
                  <SelectItem value="Featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProperty} className="bg-emerald-600 hover:bg-emerald-700">
              {isEditing ? "Update Property" : "Add Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

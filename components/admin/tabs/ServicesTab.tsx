"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabase, type Service } from "@/lib/supabase"
import { Plus, Edit, Trash2, Search, Filter, Upload, X } from "lucide-react"
import { ImageModal } from "@/components/ui/image-modal"
import { Badge } from "@/components/ui/badge"

// Rich text editor component
interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormat = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const insertList = (type: "bullet" | "number") => {
    const lines = value.split("\n")
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    let startLine = 0
    let endLine = 0
    let charCount = 0

    for (let i = 0; i < lines.length; i++) {
      if (charCount <= start && start <= charCount + lines[i].length) {
        startLine = i
      }
      if (charCount <= end && end <= charCount + lines[i].length) {
        endLine = i
        break
      }
      charCount += lines[i].length + 1 // +1 for newline
    }

    // Format selected lines
    for (let i = startLine; i <= endLine; i++) {
      if (lines[i].trim()) {
        if (type === "bullet") {
          lines[i] = lines[i].replace(/^(\s*)/, "$1• ")
        } else {
          lines[i] = lines[i].replace(/^(\s*)/, `$1${i - startLine + 1}. `)
        }
      }
    }

    onChange(lines.join("\n"))
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded-t-md border border-b-0">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => insertFormat("**", "**")}
          className="h-7 text-xs"
        >
          <strong>B</strong>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => insertFormat("*", "*")}
          className="h-7 text-xs italic"
        >
          I
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertList("bullet")} className="h-7 text-xs">
          •
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertList("number")} className="h-7 text-xs">
          1.
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => insertFormat("\n\n")} className="h-7 text-xs">
          ¶
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-t-none min-h-[120px] font-mono text-sm"
      />
      <div className="text-xs text-gray-500 mt-1">Use **bold**, *italic*, • for bullets, or 1. for numbers</div>
    </div>
  )
}

// Rich text renderer component
interface RichTextRendererProps {
  content: string
  className?: string
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className }) => {
  const formatText = (text: string) => {
    if (!text) return ""

    // Convert markdown-style formatting to HTML
    let formatted = text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic text
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Line breaks (convert single \n to <br>, double \n\n to paragraph breaks)
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>")
      // Bullet points
      .replace(/^• (.+)$/gm, '<li class="list-disc ml-4">$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="list-decimal ml-4">$1</li>')

    // Wrap in paragraph tags if there's content
    if (formatted && !formatted.startsWith("<")) {
      formatted = "<p>" + formatted + "</p>"
    }

    // Wrap consecutive <li> elements in <ul>
    formatted = formatted.replace(
      /(<li class="list-disc[^>]*>.*?<\/li>)(?:\s*<br>\s*<li class="list-disc[^>]*>.*?<\/li>)*/gs,
      (match) => {
        return '<ul class="my-2">' + match.replace(/<br>\s*/g, "") + "</ul>"
      },
    )

    formatted = formatted.replace(
      /(<li class="list-decimal[^>]*>.*?<\/li>)(?:\s*<br>\s*<li class="list-decimal[^>]*>.*?<\/li>)*/gs,
      (match) => {
        return '<ol class="my-2">' + match.replace(/<br>\s*/g, "") + "</ol>"
      },
    )

    return formatted
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: formatText(content) }}
      style={{
        lineHeight: "1.6",
      }}
    />
  )
}

interface ServicesTabProps {
  getCachedData: () => Service[] | undefined
  setCachedData: (data: Service[]) => void
}

export default function ServicesTab({ getCachedData, setCachedData }: ServicesTabProps) {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServicesAdmin, setFilteredServicesAdmin] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [servicesSearchTerm, setServicesSearchTerm] = useState("")
  const [servicesFilterAdmin, setServicesFilterAdmin] = useState("All Services")
  const [currentServicesPage, setCurrentServicesPage] = useState(1)
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    commission_amount: "",
    product_cost: "",
    materials_link: "",
    image_url: "",
    image_urls: [] as string[],
  })
  const itemsPerPage = 12
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(new Set())

  // Added Image Modal state
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [modalImageAlt, setModalImageAlt] = useState("")
  const [newImageUrl, setNewImageUrl] = useState("")

  const openImageModal = (images: string[], index: number, alt: string) => {
    setModalImages(images.filter((img) => img && img.trim() !== ""))
    setModalImageIndex(index)
    setModalImageAlt(alt)
    setShowImageModal(true)
  }

  const toggleServiceDescription = (serviceId: string) => {
    setExpandedServiceIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  useEffect(() => {
    const loadServices = async () => {
      const cachedData = getCachedData()
      if (cachedData) {
        setServices(cachedData)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: false })

        if (error) throw error
        const servicesData = data || []
        setServices(servicesData)
        setCachedData(servicesData)
      } catch (error) {
        console.error("Error loading services:", error)
        alert("Failed to load services data.")
      } finally {
        setLoading(false)
      }
    }
    loadServices()
  }, [getCachedData, setCachedData])

  useEffect(() => {
    const filtered = services.filter(
      (service) =>
        service.title?.toLowerCase().includes(servicesSearchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(servicesSearchTerm.toLowerCase()),
    )
    let filteredByStatus = filtered
    if (servicesFilterAdmin !== "All Services") {
      filteredByStatus = filtered.filter((service) => {
        const commission = service.commission_amount
        switch (servicesFilterAdmin) {
          case "GH₵0-1000":
            return commission >= 0 && commission <= 1000
          case "GH₵1001-5000":
            return commission >= 1001 && commission <= 5000
          case "GH₵5001+":
            return commission >= 5001
          default:
            return true
        }
      })
    }
    setFilteredServicesAdmin(filteredByStatus)
    setCurrentServicesPage(1)
  }, [servicesSearchTerm, services, servicesFilterAdmin])

  const createOrUpdateService = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const serviceData = {
        ...serviceForm,
        commission_amount: Number.parseFloat(serviceForm.commission_amount),
        product_cost: serviceForm.product_cost ? Number.parseFloat(serviceForm.product_cost) : 0,
        service_type: "referral" as const,
        // Ensure image_url is the first image in the array for backward compatibility
        image_url: serviceForm.image_urls[0] || "",
      }

      let updatedServices
      if (editingService) {
        const { error } = await supabase.from("services").update(serviceData).eq("id", editingService.id)
        if (error) throw error
        updatedServices = services.map((service) =>
          service.id === editingService.id ? { ...service, ...serviceData } : service,
        )
      } else {
        const { data, error } = await supabase.from("services").insert([serviceData]).select()
        if (error) throw error
        updatedServices = [data[0], ...services]
      }

      setServices(updatedServices)
      setCachedData(updatedServices)
      setShowServiceDialog(false)
      setEditingService(null)
      setServiceForm({
        title: "",
        description: "",
        commission_amount: "",
        product_cost: "",
        materials_link: "",
        image_url: "",
        // Reset image_urls
        image_urls: [],
      })
    } catch (error) {
      console.error("Error saving service:", error)
      alert("Failed to save service")
    }
  }

  const editService = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      title: service.title,
      description: service.description,
      commission_amount: service.commission_amount.toString(),
      product_cost: service.product_cost?.toString() || "",
      materials_link: service.materials_link || "",
      image_url: service.image_url || "",
      // Populate image_urls from the service, with fallback to image_url
      image_urls: service.image_urls && service.image_urls.length > 0 
        ? service.image_urls 
        : service.image_url ? [service.image_url] : [],
    })
    setShowServiceDialog(true)
  }

  // Added image management functions
  const addImageUrl = () => {
    if (newImageUrl.trim() && !serviceForm.image_urls.includes(newImageUrl.trim())) {
      setServiceForm((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, newImageUrl.trim()],
      }))
      setNewImageUrl("")
    }
  }

  const removeImageUrl = (index: number) => {
    setServiceForm((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }))
  }

  const deleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("services").delete().eq("id", serviceId)
      if (error) throw error

      const updatedServices = services.filter((service) => service.id !== serviceId)
      setServices(updatedServices)
      setCachedData(updatedServices)
      alert("Service deleted successfully!")
    } catch (error) {
      console.error("Error deleting service:", error)
      alert("Failed to delete service.")
    }
  }

  const getPaginatedData = (data: any[], currentPage: number) => {
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

    return (
      <div className="flex justify-center mt-4 sm:mt-6">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={`${currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Service Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex gap-2">
            <Select value={servicesFilterAdmin} onValueChange={setServicesFilterAdmin}>
              <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Services">All Services</SelectItem>
                <SelectItem value="GH₵0-1000">GH₵0-1000</SelectItem>
                <SelectItem value="GH₵1001-5000">GH₵1001-5000</SelectItem>
                <SelectItem value="GH₵5001+">GH₵5001+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search services..."
              value={servicesSearchTerm}
              onChange={(e) => setServicesSearchTerm(e.target.value)}
              className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <Button
            onClick={() => setShowServiceDialog(true)}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getPaginatedData(filteredServicesAdmin, currentServicesPage).map((service) => {
          // Extract images for display
          const displayImages = service.image_urls && service.image_urls.length > 0
            ? service.image_urls
            : service.image_url ? [service.image_url] : []
          
          return (
            <Card
              key={service.id}
              className="hover:shadow-xl transition-all duration-300 border-emerald-200 bg-white/90 backdrop-blur-sm"
            >
              <CardHeader>
                {displayImages.length > 0 && (
                  <div 
                    className="w-full h-56 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg mb-2 overflow-hidden relative group cursor-pointer"
                    onClick={() => openImageModal(displayImages, 0, service.title)}
                  >
                    <img
                      src={displayImages[0] || "/placeholder.svg?height=224&width=400"}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {/* Show image count badge like wholesale */}
                    {displayImages.length > 1 && (
                      <Badge className="absolute top-2 right-2 bg-emerald-600">
                        +{displayImages.length - 1}
                      </Badge>
                    )}
                  </div>
                )}
                <CardTitle className="text-lg text-emerald-800">{service.title}</CardTitle>
                <div className="text-emerald-600">
                  {expandedServiceIds.has(service.id) ? (
                    <RichTextRenderer content={service.description} className="text-sm" />
                  ) : (
                    <>
                      <div className="text-sm line-clamp-3">
                        <RichTextRenderer content={service.description} className="text-sm" />
                      </div>
                      {service.description && service.description.length > 150 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => toggleServiceDescription(service.id)}
                          className="text-emerald-600 hover:text-emerald-800 mt-2 p-0 h-auto"
                        >
                          Read more
                        </Button>
                      )}
                    </>
                  )}
                  {expandedServiceIds.has(service.id) && service.description && service.description.length > 150 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => toggleServiceDescription(service.id)}
                      className="text-emerald-600 hover:text-emerald-800 mt-2 p-0 h-auto ml-2"
                    >
                      Show less
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {service.product_cost && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-emerald-600">Product Cost:</span>
                      <span className="text-sm font-semibold text-emerald-800">
                        GH₵ {service.product_cost.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-600">Commission:</span>
                    <span className="text-lg font-bold text-green-600">
                      GH₵ {service.commission_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editService(service)}
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteService(service.id)} className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <PaginationControls
        currentPage={currentServicesPage}
        totalPages={getTotalPages(filteredServicesAdmin.length)}
        onPageChange={setCurrentServicesPage}
      />

      {/* Added Image Modal for full screen viewing */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={modalImages}
        currentIndex={modalImageIndex}
        onIndexChange={setModalImageIndex}
        alt={modalImageAlt}
      />

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={createOrUpdateService} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Service Title</Label>
                <Input
                  type="text"
                  id="title"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  className="w-full mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Service Description</Label>
                <div className="mt-1">
                  <RichTextEditor
                    value={serviceForm.description}
                    onChange={(value) => setServiceForm({ ...serviceForm, description: value })}
                    placeholder="Enter service description with formatting..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commission_amount">Commission (GH₵)</Label>
                  <Input
                    type="number"
                    id="commission_amount"
                    value={serviceForm.commission_amount}
                    onChange={(e) => setServiceForm({ ...serviceForm, commission_amount: e.target.value })}
                    className="w-full mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="product_cost">Product Cost (GH₵)</Label>
                  <Input
                    type="number"
                    id="product_cost"
                    value={serviceForm.product_cost}
                    onChange={(e) => setServiceForm({ ...serviceForm, product_cost: e.target.value })}
                    className="w-full mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="materials_link" className="text-emerald-700">Materials Link (Optional)</Label>
                <Input
                  id="materials_link"
                  value={serviceForm.materials_link}
                  onChange={(e) => setServiceForm({ ...serviceForm, materials_link: e.target.value })}
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>

              {/* Replaced single image URL input with multi-image gallery management */}
              <div className="space-y-4 pt-2 border-t border-emerald-100">
                <Label className="text-emerald-800 font-semibold flex items-center gap-2">
                  Service Gallery
                  <Badge variant="outline" className="text-[10px] uppercase">{serviceForm.image_urls.length} Images</Badge>
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste image URL..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="border-emerald-200 focus:border-emerald-500 flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={addImageUrl}
                    className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {serviceForm.image_urls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {serviceForm.image_urls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-emerald-100 group">
                        <img src={url || "/placeholder.svg"} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImageUrl(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
              <Button type="submit" className="w-full sm:w-auto">
                {editingService ? "Update Service" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

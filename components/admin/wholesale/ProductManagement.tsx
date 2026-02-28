"use client"

import type React from "react"
import { supabase } from "@/lib/supabase" // Declare the supabase variable here

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { ImageModal } from "@/components/ui/image-modal"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Plus, Edit, Trash2, Package, Star, Search, Filter, Upload, X, CheckCircle, AlertCircle, Download } from "lucide-react"
import {
  type WholesaleProduct,
  WHOLESALE_CATEGORIES,
  createWholesaleProduct,
  updateWholesaleProduct,
  deleteWholesaleProduct,
  getAllWholesaleProducts,
} from "@/lib/wholesale"
import { getStoredAdmin } from "@/lib/auth"
import { uploadWholesaleProductImage } from "@/lib/wholesale-image-upload"

export default function ProductManagement() {
  const [products, setProducts] = useState<WholesaleProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<WholesaleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [agentFilter, setAgentFilter] = useState("All")
  const [agents, setAgents] = useState<Array<{ id: string; full_name: string }>>([])
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<WholesaleProduct | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 10

  // Confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<WholesaleProduct | null>(null)

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [modalImageAlt, setModalImageAlt] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    commission_value: "", // Changed from commission_rate to commission_value
    quantity: "",
    delivery_time: "",
    image_urls: [] as string[],
    is_active: true,
    variants: [] as Array<{ type: string; values: string[] }>,
  })

  const [newImageUrl, setNewImageUrl] = useState("")

  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Variants state
  const [showVariantsSection, setShowVariantsSection] = useState(false)
  const [newVariantType, setNewVariantType] = useState("")
  const [newVariantValues, setNewVariantValues] = useState("")

  // Enhanced operation wrapper with session validation
  const withSessionValidation = useCallback(
    async <T,>(operation: () => Promise<T>, operationName: string): Promise<T> => {
      try {
        // Check localStorage-based authentication first
        const admin = getStoredAdmin()
        if (!admin) {
          throw new Error("Authentication required. Please refresh the page and log in again.")
        }

        // Verify admin is active
        if (!admin.is_active) {
          throw new Error("Your account is not active. Please contact support.")
        }

        // Execute the operation
        return await operation()
      } catch (error: any) {
        console.error(`${operationName} failed:`, error)

        // Mark as session error for proper handling
        if (
          error.message?.includes("Authentication required") ||
          error.message?.includes("session has expired") ||
          error.message?.includes("account is not active")
        ) {
          error.isSessionError = true
        }

        throw error
      }
    },
    [],
  )

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, categoryFilter, statusFilter, agentFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, statusFilter, agentFilter])

  // Load agents who have publish permission
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("id, full_name")
          .eq("can_publish_products", true)
          .order("full_name")

        if (error) throw error
        setAgents(data || [])
      } catch (error) {
        console.error("Error loading agents:", error)
      }
    }

    loadAgents()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await withSessionValidation(() => getAllWholesaleProducts(), "Load products")
      setProducts(data)
    } catch (error: any) {
      console.error("Error loading products:", error)

      if (error?.isSessionError) {
        setMessage({
          type: "error",
          text: "Session expired. Please refresh the page and log in again.",
        })
      } else {
        setMessage({
          type: "error",
          text: "Failed to load products. Please refresh the page.",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = async () => {
    try {
      let filtered = products

      // Apply search and category filters
      if (searchTerm || categoryFilter !== "All") {
        // For search, we need to filter from all products, not just active ones
        filtered = products.filter((product) => {
          const matchesSearch =
            !searchTerm ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase())

          const matchesCategory = categoryFilter === "All" || product.category === categoryFilter

          return matchesSearch && matchesCategory
        })
      }

      // Apply status filter - only if agent filter is "All", otherwise show all products for the selected agent
      if (statusFilter !== "All" && agentFilter === "All") {
        filtered = filtered.filter((p) => (statusFilter === "Active" ? p.is_active : !p.is_active))
      }

      // Apply agent filter - shows ALL products (active and inactive) for the selected agent
      if (agentFilter !== "All") {
        filtered = filtered.filter((p) => p.submitted_by_agent_id === agentFilter)
      }

      setFilteredProducts(filtered)
    } catch (error) {
      console.error("Error filtering products:", error)
      setFilteredProducts([])
    }
  }

  // Pagination calculations
  const totalProducts = filteredProducts.length
  const totalPages = Math.ceil(totalProducts / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      commission_value: "", // Changed from commission_rate to commission_value
      quantity: "",
      delivery_time: "",
      image_urls: [],
      is_active: true,
      variants: [],
    })
    setNewImageUrl("")
    setEditingProduct(null)
    setShowVariantsSection(false)
    setNewVariantType("")
    setNewVariantValues("")
  }

  const openCreateDialog = () => {
    resetForm()
    setShowProductDialog(true)
  }

  const openEditDialog = (product: WholesaleProduct) => {
    // Parse variants if they exist
    let parsedVariants: Array<{ type: string; values: string[] }> = []
    if (product.variants) {
      if (typeof product.variants === 'string') {
        try {
          parsedVariants = JSON.parse(product.variants)
        } catch (e) {
          console.error('Error parsing variants:', e)
        }
      } else if (Array.isArray(product.variants)) {
        parsedVariants = product.variants
      }
    }

    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      commission_value: product.commission_value.toString(), // Changed from commission_rate calculation
      quantity: product.quantity.toString(),
      delivery_time: product.delivery_time,
      image_urls: [...product.image_urls],
      is_active: product.is_active,
      variants: parsedVariants,
    })
    setEditingProduct(product)
    setShowProductDialog(true)
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

  // Add a new function to handle file input image uploads
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files // Using e.target instead of e.currentTarget for better stability
    if (!files || files.length === 0) return

    // Store reference to target for clearing later
    const target = e.target

    try {
      setUploadingImages(true)
      setUploadProgress(0)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const uploadedUrl = await uploadWholesaleProductImage(file, undefined, (progress) => {
          setUploadProgress(Math.round(((i + progress / 100) / files.length) * 100))
        })

        // Add the uploaded URL to image_urls
        setFormData((prev) => ({
          ...prev,
          image_urls: [...prev.image_urls, uploadedUrl],
        }))
      }

      if (target) {
        target.value = ""
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during upload"
      alert(`Upload Error: ${errorMessage}\n\nTechnical Details: See console for full log.`)

      // Set an error message in the local state if available
      if (typeof setMessage === "function") {
        setMessage({ type: "error", text: `Image upload failed: ${errorMessage}` })
      }
    } finally {
      setUploadingImages(false)
      setUploadProgress(0)
    }
  }

  const handleAddVariant = () => {
    if (!newVariantType.trim() || !newVariantValues.trim()) {
      setMessage({ type: "error", text: "Please enter both variant type and values" })
      return
    }

    const values = newVariantValues
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0)

    if (values.length === 0) {
      setMessage({ type: "error", text: "Please enter at least one variant value" })
      return
    }

    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { type: newVariantType.trim(), values }],
    }))

    setNewVariantType("")
    setNewVariantValues("")
    setMessage({ type: "success", text: `Added ${newVariantType} variant` })
  }

  const handleRemoveVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
  }

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      setMessage({ type: "error", text: "No products to export" })
      return
    }

    // Get agent name for file naming and header
    const selectedAgent = agents.find((a) => a.id === agentFilter)
    const agentName = selectedAgent?.full_name || (agentFilter !== "All" ? "Selected Agent" : "All Agents")
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    // Create CSV header with agent name and date at the top
    const headerRows = [
      `"Agent Name: ${agentName}"`,
      `"Export Date: ${currentDate}"`,
      "", // Empty row for spacing
      "Product Name,Short Description,Price (GH₵),Commission (GH₵),Category,Quantity,Status" // Column headers
    ]

    // Create CSV rows
    const dataRows = filteredProducts.map((product) => {
      const cells = [
        product.name,
        product.description.substring(0, 100), // Short description (first 100 chars)
        product.price.toFixed(2),
        product.commission_value.toFixed(2),
        product.category,
        product.quantity.toString(),
        product.is_active ? "Active" : "Inactive"
      ]

      // Escape quotes and wrap in quotes if contains comma or quotes
      return cells
        .map((cell) => {
          const str = String(cell)
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(",")
    })

    // Combine all rows
    const csvContent = [...headerRows, ...dataRows].join("\n")

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `wholesale_products_${agentName.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    setMessage({ type: "success", text: `Exported ${filteredProducts.length} products to CSV` })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.category || !formData.price) {
      setMessage({ type: "error", text: "Please fill in all required fields" })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || "",
        category: formData.category,
        price: Number.parseFloat(formData.price),
        commission_value: Number.parseFloat(formData.commission_value || "0"),
        quantity: Number.parseInt(formData.quantity) || 0,
        delivery_time: formData.delivery_time.trim() || "2-3 business days",
        image_urls: formData.image_urls.length > 0 ? formData.image_urls : ["/placeholder.svg"],
        is_active: formData.is_active,
        variants: formData.variants.length > 0 ? JSON.stringify(formData.variants) : null,
        submitted_by_agent_id: null,
      }

      // Use session-validated operation
      await withSessionValidation(
        async () => {
          if (editingProduct) {
            return await updateWholesaleProduct(editingProduct.id, productData)
          } else {
            return await createWholesaleProduct(productData)
          }
        },
        editingProduct ? "Update product" : "Create product",
      )

      setMessage({
        type: "success",
        text: `Product ${editingProduct ? "updated" : "created"} successfully!`,
      })

      setShowProductDialog(false)
      resetForm()

      // Reload products with session validation
      try {
        await withSessionValidation(() => getAllWholesaleProducts(), "Reload products").then((data) =>
          setProducts(data),
        )
      } catch (reloadError) {
        // Don't show error to user since the main operation succeeded
      }
    } catch (error: any) {

      let errorMessage = `Failed to ${editingProduct ? "update" : "create"} product`

      if (error?.isSessionError) {
        errorMessage = "Your session has expired. Please refresh the page and try again."
      } else if (error instanceof Error) {
        if (error.message.includes("timed out")) {
          errorMessage = "Operation timed out. Please check your connection and try again."
        } else if (error.message.includes("session") || error.message.includes("expired")) {
          errorMessage = "Your session has expired. Please refresh the page and try again."
        } else if (error.message.includes("trigger")) {
          errorMessage = "Database error occurred. Please check your data and try again."
        } else if (error.message.includes("constraint")) {
          errorMessage = "Invalid data provided. Please check all fields and try again."
        } else {
          errorMessage += `: ${error.message}`
        }
      }

      setMessage({
        type: "error",
        text: errorMessage,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (product: WholesaleProduct) => {
    setProductToDelete(product)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!productToDelete) return

    try {
      await withSessionValidation(() => deleteWholesaleProduct(productToDelete.id), "Delete product")

      setMessage({ type: "success", text: "Product deleted successfully!" })
      await loadProducts()
      setShowDeleteDialog(false)
      setProductToDelete(null)
    } catch (error: any) {

      let errorMessage = "Failed to delete product. Please try again."
      if (error?.isSessionError) {
        errorMessage = "Your session has expired. Please refresh the page and try again."
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      setMessage({
        type: "error",
        text: errorMessage,
      })
    }
  }

  const toggleProductStatus = async (product: WholesaleProduct) => {
    try {
      await withSessionValidation(
        () => updateWholesaleProduct(product.id, { is_active: !product.is_active }),
        "Toggle product status",
      )

      setMessage({
        type: "success",
        text: `Product ${!product.is_active ? "activated" : "deactivated"} successfully!`,
      })
      await loadProducts()
    } catch (error: any) {
      console.error("Error updating product status:", error)

      let errorMessage = "Failed to update product status. Please try again."
      if (error?.isSessionError) {
        errorMessage = "Your session has expired. Please refresh the page and try again."
      }

      setMessage({
        type: "error",
        text: errorMessage,
      })
    }
  }

  const openImageModal = (images: string[], index: number, alt: string) => {
    // Filter out invalid images and ensure we have valid URLs
    const validImages = images.filter(
      (img) => img && typeof img === "string" && img.trim() !== "" && img !== "/placeholder.svg",
    )

    if (validImages.length === 0) {
      // If no valid images, show placeholder
      setModalImages(["/placeholder.svg"])
      setModalImageIndex(0)
    } else {
      // Adjust index if it's out of bounds for valid images
      const adjustedIndex = Math.min(Math.max(0, index), validImages.length - 1)
      setModalImages([...validImages]) // Create new array to trigger re-render
      setModalImageIndex(adjustedIndex)
    }

    setModalImageAlt(alt)
    setShowImageModal(true)
  }

  // Add a new function to handle index changes from the modal
  const handleModalIndexChange = (newIndex: number) => {
    setModalImageIndex(newIndex)
  }

  const renderProductImage = (product: WholesaleProduct) => {
  const imageUrl = (product.image_urls || [])[0] || "/placeholder.svg"
  return (
      <div
        className="relative group cursor-pointer"
        onClick={() => openImageModal(product.image_urls || [], 0, product.name)}
      >
        <ImageWithFallback
          src={imageUrl || "/placeholder.svg"}
          alt={product.name}
          className="h-10 w-10 md:h-12 md:w-12 rounded-md object-cover border border-emerald-100 group-hover:scale-110 transition-transform"
          fallbackSrc="/placeholder-product.jpg"
        />
        {product.image_urls && product.image_urls.length > 1 && (
          <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-emerald-600">
            +{product.image_urls.length - 1}
          </Badge>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Session Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-800 flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">Product Management</span>
            <span className="sm:hidden">Products</span>
          </h2>
          <p className="text-sm sm:text-base text-emerald-600">
            <span className="hidden sm:inline">Manage wholesale products and inventory</span>
            <span className="sm:hidden">Manage products</span>
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Enhanced Message Alert */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
            {message.text.includes("session") && (
              <Button
                variant="link"
                className="ml-2 p-0 h-auto text-sm underline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-emerald-200 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {WHOLESALE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
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

              <div className="flex items-center gap-2 col-span-1 sm:col-span-1">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  {filteredProducts.length} products
                </Badge>
                <Button
                  onClick={handleExportCSV}
                  disabled={filteredProducts.length === 0}
                  variant="outline"
                  size="sm"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 whitespace-nowrap"
                  title="Download product data as CSV"
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="inline sm:hidden">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Display - Mobile-First Responsive */}
      <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
        {/* Product count and pagination info */}
        {totalProducts > 0 && (
          <div className="px-4 sm:px-6 py-3 border-b border-emerald-100 flex justify-between items-center text-sm text-emerald-600">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, totalProducts)} of {totalProducts} products
            </span>
            {totalPages > 1 && (
              <span className="hidden sm:inline">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        )}

        {currentProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
            <h3 className="text-xl font-semibold text-emerald-800 mb-2">No Products Found</h3>
            <p className="text-emerald-600">
              {searchTerm || categoryFilter !== "All" || statusFilter !== "All"
                ? "No products match your current filters."
                : "No products have been added yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout (default) */}
            <div className="block lg:hidden">
              <div className="space-y-4 p-4">
                {currentProducts.map((product) => (
                  <Card key={product.id} className="border-emerald-100 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 relative">
                            <ImageWithFallback
                              src={product.image_urls?.[0] || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                              onClick={() => openImageModal(product.image_urls || [], 0, product.name)}
                              fallbackSrc="/placeholder.svg?height=64&width=64"
                            />
                            {product.image_urls && product.image_urls.length > 1 && (
                              <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                                +{product.image_urls.length - 1}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold text-emerald-800 text-sm leading-tight mb-1"
                              title={product.name}
                            >
                              {product.name}
                            </h3>
                            <p className="text-xs text-emerald-600 mb-2 line-clamp-2" title={product.description}>
                              {product.description}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="border-emerald-200 text-emerald-700 text-xs">
                                {product.category}
                              </Badge>
                              <Badge
                                className={`text-xs ${
                                  product.is_active
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                }`}
                              >
                                {product.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {product.created_by_name && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                  {product.created_by_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-emerald-600 mb-1">Price</p>
                            <p className="font-semibold text-emerald-800">GH₵ {product.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-emerald-600 mb-1">Stock</p>
                            <Badge
                              className={`text-xs ${
                                product.quantity > 0
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                              }`}
                            >
                              {product.quantity} units
                            </Badge>
                          </div>
                          <div>
                            <p className="text-emerald-600 mb-1">Commission</p>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-emerald-700 font-medium">
                                GH₵ {product.commission_value.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-emerald-600 mb-1">Delivery</p>
                            <p className="text-emerald-700 text-xs">{product.delivery_time}</p>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(product)}
                            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleProductStatus(product)}
                            className={`flex-1 ${
                              product.is_active
                                ? "border-amber-300 text-amber-600 hover:bg-amber-50"
                                : "border-green-300 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {product.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(product)}
                            className="border-red-300 text-red-600 hover:bg-red-50 px-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Desktop Table Layout (lg and up) */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50 hover:bg-emerald-50">
                    <TableHead className="text-emerald-800 font-semibold">Product</TableHead>
                    <TableHead className="text-emerald-800 font-semibold">Category</TableHead>
                    <TableHead className="text-emerald-800 font-semibold">Agent</TableHead>
                    <TableHead className="text-emerald-800 font-semibold">Variants</TableHead>
                    <TableHead className="text-emerald-800 font-semibold">Price</TableHead>
                    <TableHead className="text-emerald-800 font-semibold">Stock</TableHead>
                    <TableHead className="text-emerald-800 font-semibold">Commission</TableHead>
                    <TableHead className="text-emerald-800 font-semibold">Status</TableHead>
                    <TableHead className="text-emerald-800 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-emerald-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {renderProductImage(product)} {/* Use the new function here */}
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium text-emerald-800 cursor-help leading-tight"
                              title={product.name}
                            >
                              {product.name.length > 12 ? `${product.name.substring(0, 12)}...` : product.name}
                            </p>
                            <p
                              className="text-sm text-emerald-600 line-clamp-1 cursor-help"
                              title={product.description}
                            >
                              {product.description.length > 13
                                ? `${product.description.substring(0, 13)}...`
                                : product.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.created_by_name ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {product.created_by_name}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          let variants = product.variants
                          if (typeof variants === 'string') {
                            try {
                              variants = JSON.parse(variants)
                            } catch (e) {
                              variants = null
                            }
                          }
                          
                          if (Array.isArray(variants) && variants.length > 0) {
                            return (
                              <div className="flex flex-wrap gap-1">
                                {variants.map((v: any, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-emerald-100 border-emerald-300 text-emerald-700">
                                    {v.type}
                                  </Badge>
                                ))}
                              </div>
                            )
                          }
                          return <span className="text-sm text-gray-500">-</span>
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-emerald-800">GH₵ {product.price.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            product.quantity > 0
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {product.quantity} units
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-emerald-700">GH₵ {product.commission_value.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            product.is_active
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(product)}
                            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleProductStatus(product)}
                            className={
                              product.is_active
                                ? "border-amber-300 text-amber-600 hover:bg-amber-50"
                                : "border-green-300 text-green-600 hover:bg-green-50"
                            }
                          >
                            {product.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(product)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product information" : "Create a new wholesale product"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-emerald-800">Basic Information</h4>

                <div>
                  <Label htmlFor="name" className="text-emerald-700">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="border-emerald-200 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-emerald-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="border-emerald-200 focus:border-emerald-500"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-emerald-700">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {WHOLESALE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="delivery_time" className="text-emerald-700">
                    Delivery Time
                  </Label>
                  <Input
                    id="delivery_time"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, delivery_time: e.target.value }))}
                    placeholder="e.g., 2-3 business days"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="space-y-4">
                <h4 className="font-semibold text-emerald-800">Pricing & Inventory</h4>

                <div>
                  <Label htmlFor="price" className="text-emerald-700">
                    Price (GH₵) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    className="border-emerald-200 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="commission_value" className="text-emerald-700">
                    Commission Value (GH₵) {/* Changed label from percentage to value */}
                  </Label>
                  <Input
                    id="commission_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.commission_value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, commission_value: e.target.value }))}
                    className="border-emerald-200 focus:border-emerald-500"
                    placeholder="e.g., 20.00 (20 cedis per item)"
                  />
                  <p className="text-xs text-emerald-600 mt-1">
                    Fixed commission amount per item (e.g., 20 cedis per item sold)
                  </p>
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-emerald-700">
                    Stock Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-emerald-300"
                  />
                  <Label htmlFor="is_active" className="text-emerald-700">
                    Active Product
                  </Label>
                </div>
              </div>
            </div>

            {/* Image URLs section - UPDATED */}
            <div>
              <h4 className="font-semibold text-emerald-800 mb-3">Product Images</h4>

              <div className="space-y-3 mb-3">
                {/* URL input section */}
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Add image URL..."
                    className="border-emerald-200 focus:border-emerald-500"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
                  />
                  <Button type="button" onClick={addImageUrl} variant="outline" disabled={uploadingImages}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-emerald-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 font-medium">
                        {uploadingImages ? `Uploading... ${uploadProgress}%` : "Upload Images"}
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      disabled={uploadingImages}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Display uploaded images */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {formData.image_urls.map((url, index) => (
                  <div key={index} className="relative">
                    <div className="w-full h-20 rounded border overflow-hidden cursor-pointer">
                      <ImageWithFallback
                        src={url || "/placeholder.svg"}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        onClick={() => openImageModal(formData.image_urls, index, `Product ${index + 1}`)}
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

            {/* Product Variants Section */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowVariantsSection(!showVariantsSection)}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-4"
              >
                <Plus className="h-4 w-4" />
                {showVariantsSection ? "Hide" : "Add"} Product Variants (Optional)
              </button>

              {showVariantsSection && (
                <div className="space-y-4 bg-emerald-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="variant_type" className="text-emerald-700">
                        Variant Type (e.g., Color, Size)
                      </Label>
                      <Input
                        id="variant_type"
                        value={newVariantType}
                        onChange={(e) => setNewVariantType(e.target.value)}
                        placeholder="e.g., Color"
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="variant_values" className="text-emerald-700">
                        Variant Values (comma-separated)
                      </Label>
                      <Input
                        id="variant_values"
                        value={newVariantValues}
                        onChange={(e) => setNewVariantValues(e.target.value)}
                        placeholder="e.g., Red, Blue, Green"
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                      <p className="text-xs text-emerald-600 mt-1">Separate values with commas</p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddVariant}
                      disabled={!newVariantType.trim() || !newVariantValues.trim()}
                      variant="outline"
                      className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variant
                    </Button>
                  </div>

                  {formData.variants.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      <p className="font-medium text-sm text-emerald-700">
                        Added Variants ({formData.variants.length})
                      </p>
                      <div className="space-y-2">
                        {formData.variants.map((variant, index) => (
                          <div
                            key={index}
                            className="flex items-start justify-between gap-2 bg-white p-3 rounded border border-emerald-200"
                          >
                            <div>
                              <p className="font-medium text-sm text-emerald-800">{variant.type}</p>
                              <p className="text-xs text-emerald-600">{variant.values.join(", ")}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(index)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductDialog(false)}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {editingProduct ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {editingProduct ? "Update Product" : "Create Product"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={modalImages}
        currentIndex={modalImageIndex}
        onIndexChange={handleModalIndexChange}
        alt={modalImageAlt}
      />

      {/* Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">Delete Product</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{productToDelete?.name}"?</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmDelete} className="bg-emerald-600 hover:bg-emerald-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              let pageNumber
              if (totalPages <= 5) {
                pageNumber = index + 1
              } else if (currentPage <= 3) {
                pageNumber = index + 1
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + index
              } else {
                pageNumber = currentPage - 2 + index
              }

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNumber)}
                    isActive={currentPage === pageNumber}
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
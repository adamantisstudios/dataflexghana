"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  EyeOff,
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { getCurrentAdmin } from "@/lib/unified-auth-system"

interface VoucherProduct {
  id: string
  title: string
  description: string
  image_url: string
  price: number
  quantity: number
  status: "published" | "hidden" | "out_of_stock"
  created_at: string
  updated_at: string
}

interface AdminVoucherProductsTabProps {
  adminId: string
}

export function AdminVoucherProductsTab({ adminId }: AdminVoucherProductsTabProps) {
  const [products, setProducts] = useState<VoucherProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<VoucherProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<VoucherProduct | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    price: "",
    quantity: "",
    status: "published" as "published" | "hidden" | "out_of_stock",
  })
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    hiddenProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
  })

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true)

      const currentAdmin = getCurrentAdmin()
      if (!currentAdmin) {
        throw new Error("Admin authentication required")
      }

      // Use the API endpoint instead of direct Supabase call
      const response = await fetch("/api/admin/voucher/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": JSON.stringify(currentAdmin),
        },
        credentials: "include", // Include cookies for authentication
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to load products")
      }

      const products = result.products || []
      setProducts(products)
      calculateStats(products)

      if (products.length === 0) {
        toast.info("No voucher products found")
      }
    } catch (error) {
      console.error("Error loading products:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load products"
      toast.error(errorMessage)
      setProducts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const calculateStats = (productsList: VoucherProduct[]) => {
    const totalProducts = productsList.length
    const publishedProducts = productsList.filter((p) => p.status === "published").length
    const hiddenProducts = productsList.filter((p) => p.status === "hidden").length
    const outOfStockProducts = productsList.filter((p) => p.status === "out_of_stock").length
    const totalValue = productsList
      .filter((p) => p.status === "published")
      .reduce((sum, p) => sum + p.price * p.quantity, 0)

    setStats({
      totalProducts,
      publishedProducts,
      hiddenProducts,
      outOfStockProducts,
      totalValue,
    })
  }

  // Filter products
  useEffect(() => {
    let filtered = products

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((product) => product.status === statusFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, statusFilter])

  // Load data on mount
  useEffect(() => {
    loadProducts()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "hidden":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "out_of_stock":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="h-4 w-4" />
      case "hidden":
        return <EyeOff className="h-4 w-4" />
      case "out_of_stock":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      price: "",
      quantity: "",
      status: "published",
    })
  }

  const handleCreate = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  const handleEdit = (product: VoucherProduct) => {
    setSelectedProduct(product)
    setFormData({
      title: product.title,
      description: product.description || "",
      image_url: product.image_url || "",
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      status: product.status,
    })
    setShowEditDialog(true)
  }

  const handleDelete = (product: VoucherProduct) => {
    setSelectedProduct(product)
    setShowDeleteDialog(true)
  }

  const handleSubmitCreate = async () => {
    if (!formData.title.trim() || !formData.price || !formData.quantity) {
      toast.error("Please fill in all required fields")
      return
    }

    const price = Number.parseFloat(formData.price)
    const quantity = Number.parseInt(formData.quantity)

    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price")
      return
    }

    if (isNaN(quantity) || quantity < 0) {
      toast.error("Please enter a valid quantity")
      return
    }

    setSubmitting(true)
    try {
      const currentAdmin = getCurrentAdmin()
      if (!currentAdmin) {
        throw new Error("Admin authentication required")
      }

      // Use the API endpoint instead of direct Supabase call
      const response = await fetch("/api/admin/voucher/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": JSON.stringify(currentAdmin),
        },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null,
          price,
          quantity,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create product")
      }

      toast.success("Product created successfully")
      setShowCreateDialog(false)
      resetForm()
      await loadProducts()
    } catch (error) {
      console.error("Error creating product:", error)
      toast.error(`Failed to create product: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitEdit = async () => {
    if (!selectedProduct || !formData.title.trim() || !formData.price || !formData.quantity) {
      toast.error("Please fill in all required fields")
      return
    }

    const price = Number.parseFloat(formData.price)
    const quantity = Number.parseInt(formData.quantity)

    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price")
      return
    }

    if (isNaN(quantity) || quantity < 0) {
      toast.error("Please enter a valid quantity")
      return
    }

    setSubmitting(true)
    try {
      const currentAdmin = getCurrentAdmin()
      if (!currentAdmin) {
        throw new Error("Admin authentication required")
      }

      // Use the API endpoint instead of direct Supabase call
      const response = await fetch(`/api/admin/voucher/products/${selectedProduct.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": JSON.stringify(currentAdmin),
        },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null,
          price,
          quantity,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to update product")
      }

      toast.success("Product updated successfully")
      setShowEditDialog(false)
      setSelectedProduct(null)
      resetForm()
      await loadProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error(`Failed to update product: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitDelete = async () => {
    if (!selectedProduct) return

    setSubmitting(true)
    try {
      const currentAdmin = getCurrentAdmin()
      if (!currentAdmin) {
        throw new Error("Admin authentication required")
      }

      // Use the API endpoint instead of direct Supabase call
      const response = await fetch(`/api/admin/voucher/products/${selectedProduct.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": JSON.stringify(currentAdmin),
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to delete product")
      }

      toast.success("Product deleted successfully")
      setShowDeleteDialog(false)
      setSelectedProduct(null)
      await loadProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-blue-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="border-blue-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="w-full h-48 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-800">E-Products Management</h2>
          <p className="text-blue-600">Create and manage voucher card products</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadProducts}
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-blue-100 mt-1">All products</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.publishedProducts}</div>
            <p className="text-xs text-emerald-100 mt-1">Available for sale</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-100 flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              Hidden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.hiddenProducts}</div>
            <p className="text-xs text-gray-100 mt-1">Not visible to agents</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">GH₵ {stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-purple-100 mt-1">Published products</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
          <Input
            placeholder="Search products by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-blue-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 border-blue-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-blue-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  {searchTerm || statusFilter !== "all" ? "No matching products found" : "No products yet"}
                </h3>
                <p className="text-blue-600 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first voucher card product to get started"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button
                    onClick={handleCreate}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Product
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="border-blue-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg mb-3 overflow-hidden">
                  <ImageWithFallback
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    fallbackSrc="/placeholder.svg?height=192&width=400"
                  />
                </div>

                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-blue-800 line-clamp-2 flex-1">{product.title}</CardTitle>
                  <Badge className={getStatusColor(product.status)}>
                    {getStatusIcon(product.status)}
                    <span className="ml-1">{product.status.replace("_", " ")}</span>
                  </Badge>
                </div>

                {product.description && (
                  <p className="text-sm text-blue-600 line-clamp-3 mt-2">{product.description}</p>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600">Price</p>
                      <p className="font-semibold text-blue-800">GH₵ {product.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">Quantity</p>
                      <p className="font-semibold text-blue-800">{product.quantity}</p>
                    </div>
                  </div>

                  <div className="text-xs text-blue-500">Created {formatTimestamp(product.created_at)}</div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Product Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800">
              <Plus className="h-5 w-5" />
              Create New Product
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-blue-700">
                Title *
              </Label>
              <Input
                id="title"
                placeholder="Enter product title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-blue-700">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="border-blue-200 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image_url" className="text-blue-700">
                Image URL
              </Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-blue-700">
                  Price (GH₵) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="quantity" className="text-blue-700">
                  Quantity *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-blue-700">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "published" | "hidden" | "out_of_stock") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                resetForm()
              }}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitCreate}
              disabled={submitting}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {submitting ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800">
              <Edit className="h-5 w-5" />
              Edit Product
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title" className="text-blue-700">
                Title *
              </Label>
              <Input
                id="edit-title"
                placeholder="Enter product title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-blue-700">
                Description
              </Label>
              <Textarea
                id="edit-description"
                placeholder="Enter product description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="border-blue-200 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-image_url" className="text-blue-700">
                Image URL
              </Label>
              <Input
                id="edit-image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price" className="text-blue-700">
                  Price (GH₵) *
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-quantity" className="text-blue-700">
                  Quantity *
                </Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-status" className="text-blue-700">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "published" | "hidden" | "out_of_stock") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                setSelectedProduct(null)
                resetForm()
              }}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={submitting}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {submitting ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-800">
              <Trash2 className="h-5 w-5" />
              Delete Product
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The product will be permanently deleted.
                </AlertDescription>
              </Alert>

              <div>
                <p className="text-gray-700">Are you sure you want to delete this product?</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-800">{selectedProduct.title}</p>
                  <p className="text-sm text-gray-600">
                    Price: GH₵ {selectedProduct.price.toFixed(2)} • Quantity: {selectedProduct.quantity}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedProduct(null)
              }}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

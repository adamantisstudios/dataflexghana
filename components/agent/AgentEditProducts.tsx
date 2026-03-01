"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Edit, Trash2, Search, AlertCircle } from "lucide-react"
import { WHOLESALE_CATEGORIES } from "@/lib/wholesale"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  commission_value: number
  quantity: number
  delivery_time: string
  image_urls: string[]
  is_active: boolean
  created_at: string
}

interface AgentEditProductsProps {
  agentId: string
  canUpdateProducts?: boolean
}

export default function AgentEditProducts({ agentId, canUpdateProducts = true }: AgentEditProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const isReadOnly = !canUpdateProducts

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    commission_value: "",
    quantity: "",
    delivery_time: "",
  })

  useEffect(() => {
    loadProducts()
  }, [agentId])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, categoryFilter, statusFilter])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("wholesale_products")
        .select("*")
        .eq("submitted_by_agent_id", agentId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setProducts(data || [])
      setMessage(null)
    } catch (error) {
      console.error("Error loading products:", error)
      setMessage({
        type: "error",
        text: "Failed to load products. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== "All") {
      filtered = filtered.filter((p) => p.category === categoryFilter)
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((p) =>
        statusFilter === "Published" ? p.is_active : !p.is_active
      )
    }

    setFilteredProducts(filtered)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      commission_value: product.commission_value.toString(),
      quantity: product.quantity.toString(),
      delivery_time: product.delivery_time,
    })
    setShowEditDialog(true)
  }

  const closeEditDialog = () => {
    setShowEditDialog(false)
    setEditingProduct(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      commission_value: "",
      quantity: "",
      delivery_time: "",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!editingProduct) return

    try {
      setSubmitting(true)

      const { error } = await supabase
        .from("wholesale_products")
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          commission_value: parseFloat(formData.commission_value),
          quantity: parseInt(formData.quantity),
          delivery_time: formData.delivery_time,
          is_active: false, // Always submit as inactive (awaiting approval)
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProduct.id)

      if (error) throw error

      toast.success("Product submitted for admin approval")
      closeEditDialog()
      loadProducts()
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("Failed to submit product. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const { error } = await supabase
        .from("wholesale_products")
        .delete()
        .eq("id", productId)

      if (error) throw error

      toast.success("Product deleted successfully")
      loadProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (filteredProducts.length === 0 && products.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium">No products yet</p>
            <p className="text-sm text-gray-600">
              You haven't submitted any products yet. Submit a product to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <AlertCircle className={`h-4 w-4 ${message.type === "success" ? "text-green-600" : "text-red-600"}`} />
          <AlertDescription className={message.type === "success" ? "text-green-700" : "text-red-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <Card className="border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {WHOLESALE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Unpublished">Unpublished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className={`grid ${isReadOnly ? 'grid-cols-1 md:grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
        {filteredProducts.map((product) => (
          <Card key={product.id} className={`border-emerald-200 hover:border-emerald-400 transition-all overflow-hidden ${isReadOnly ? 'shadow-sm' : ''}`}>
            {/* Product Image */}
            {product.image_urls && product.image_urls.length > 0 ? (
              <div className={`relative w-full ${isReadOnly ? 'h-32' : 'h-48'} bg-gray-100 overflow-hidden`}>
                <img
                  src={product.image_urls[0]}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext x='50%' y='50%' font-size='16' fill='%239ca3af' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"
                  }}
                />
                {product.image_urls.length > 1 && (
                  <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    +{product.image_urls.length - 1}
                  </div>
                )}
              </div>
            ) : (
              <div className={`w-full ${isReadOnly ? 'h-32' : 'h-48'} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center`}>
                <div className="text-center">
                  <div className="text-gray-400 text-2xl mb-1">📦</div>
                  <p className="text-gray-500 text-xs">No image</p>
                </div>
              </div>
            )}

            <CardHeader className={isReadOnly ? 'pb-2' : 'pb-3'}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className={`line-clamp-2 ${isReadOnly ? 'text-sm' : 'text-base'}`}>{product.name}</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                </div>
                <Badge className={`text-xs flex-shrink-0 ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {product.is_active ? 'Published' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className={`space-y-2 ${isReadOnly ? 'pb-2' : 'pb-3'}`}>
              <div className={`grid grid-cols-2 gap-1.5 ${isReadOnly ? 'text-xs' : 'text-sm'}`}>
                <div>
                  <p className="text-gray-500 text-xs">Price</p>
                  <p className="font-semibold">₵{product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Commission</p>
                  <p className="font-semibold">₵{product.commission_value.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Qty</p>
                  <p className="font-semibold">{product.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Delivery</p>
                  <p className="font-semibold text-xs">{product.delivery_time}</p>
                </div>
              </div>

              <p className={`text-gray-600 line-clamp-1 ${isReadOnly ? 'text-xs' : 'text-sm'}`}>{product.description}</p>

              {/* Actions Row */}
              <div className={`flex items-center gap-1.5 pt-2 border-t border-emerald-100 ${isReadOnly ? 'justify-end' : ''}`}>
                {!isReadOnly && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(product)}
                      className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 flex-1 text-xs h-8"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 text-xs h-8"
                      disabled={submitting}
                      onClick={() => openEditDialog(product)}
                    >
                      Submit
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(product.id)}
                  className={isReadOnly ? 'w-full text-xs h-8' : 'flex-1 text-xs h-8'}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Make changes to your product. Click submit to send for admin approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {WHOLESALE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (GH₵) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission_value">Commission (GH₵) *</Label>
                <Input
                  id="commission_value"
                  name="commission_value"
                  type="number"
                  step="0.01"
                  value={formData.commission_value}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_time">Delivery Time *</Label>
                <Input
                  id="delivery_time"
                  name="delivery_time"
                  value={formData.delivery_time}
                  onChange={handleInputChange}
                  placeholder="e.g., 2-3 days"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeEditDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
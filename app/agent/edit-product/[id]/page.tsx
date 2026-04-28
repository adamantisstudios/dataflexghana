"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertCircle, Loader, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { getStoredAgent } from "@/lib/agent-auth"
import { WHOLESALE_CATEGORIES } from "@/lib/wholesale"
import { uploadWholesaleProductImage } from "@/lib/wholesale-image-upload"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  commission_value: number
  quantity: number
  images: string[]
  is_active: boolean
  submitted_by_agent_id: string
  delivery_time?: string
  variants?: Array<{ type: string; values: string[] }>
}

interface ProductVariant {
  type: string
  values: string[]
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    commission_value: "",
    quantity: "",
    delivery_time: "",
    image_urls: [] as string[],
    variants: [] as ProductVariant[],
  })

  const [newImageUrl, setNewImageUrl] = useState("")
  const [newVariantType, setNewVariantType] = useState("")
  const [newVariantValues, setNewVariantValues] = useState("")

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        const storedAgent = getStoredAgent()

        if (!storedAgent) {
          router.push("/agent/login")
          return
        }

        // Fetch product
        const { data, error: fetchError } = await supabase
          .from("wholesale_products")
          .select("*")
          .eq("id", productId)
          .eq("submitted_by_agent_id", storedAgent.id)
          .single()

        if (fetchError || !data) {
          setError("Product not found or you do not have access to edit it")
          return
        }

        // Check if agent has permission to edit
        const { data: agentData } = await supabase
          .from("agents")
          .select("can_update_products")
          .eq("id", storedAgent.id)
          .single()

        if (!agentData?.can_update_products) {
          setError("You do not have permission to edit products. Contact admin to enable this feature.")
          return
        }

        setProduct(data)
        setFormData({
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price.toString(),
          commission_value: (data.commission_value || 0).toString(),
          quantity: data.quantity.toString(),
          delivery_time: data.delivery_time || "",
          image_urls: data.images || [],
          variants: data.variants || [],
        })
      } catch (err) {
        console.error("Error loading product:", err)
        setError("Failed to load product details")
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      loadProduct()
    }
  }, [productId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, newImageUrl],
      }))
      setNewImageUrl("")
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || !product) return

    try {
      setUploadingImages(true)
      setUploadProgress(0)
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          const progressCallback = (progress: number) => {
            setUploadProgress(Math.round(((i + progress / 100) / files.length) * 100))
          }
          const url = await uploadWholesaleProductImage(file, product.submitted_by_agent_id, progressCallback)
          uploadedUrls.push(url)
          toast.success(`✓ Uploaded ${file.name}`)
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          toast.error(`Failed to upload ${file.name}`)
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          image_urls: [...prev.image_urls, ...uploadedUrls],
        }))
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully`)
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload images")
    } finally {
      setUploadingImages(false)
      setUploadProgress(0)
    }
  }

  const handleAddVariant = () => {
    if (!newVariantType.trim() || !newVariantValues.trim()) {
      toast.error("Please enter both variant type and values")
      return
    }

    const values = newVariantValues
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0)

    if (values.length === 0) {
      toast.error("Please enter at least one variant value")
      return
    }

    const newVariant: ProductVariant = {
      type: newVariantType.trim(),
      values,
    }

    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }))

    setNewVariantType("")
    setNewVariantValues("")
    toast.success(`Added ${newVariant.type} variant`)
  }

  const handleRemoveVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    // Validation
    if (!formData.name.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!formData.category) {
      toast.error("Please select a category")
      return
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Valid price is required")
      return
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast.error("Valid quantity is required")
      return
    }
    if (formData.image_urls.length === 0) {
      toast.error("At least one product image is required")
      return
    }

    try {
      setSaving(true)

      // Update product via API
      const response = await fetch("/api/agent/wholesale/update-product", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          agent_id: product.submitted_by_agent_id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          commission_value: parseFloat(formData.commission_value) || 0,
          quantity: parseInt(formData.quantity),
          delivery_time: formData.delivery_time || "3-5 business days",
          images: formData.image_urls,
          variants: formData.variants.length > 0 ? formData.variants : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update product")
      }

      toast.success("Product updated successfully!")
      router.push("/agent/publish-products?tab=view")
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update product")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/agent/publish-products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Cannot Edit Product</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link href="/agent/publish-products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">Update your product information</p>
          </div>
        </div>

        {/* Status Notice */}
        {product.is_active && (
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 ml-2">
              This product is currently published. Changes will not affect the published status - only an admin can unpublish it.
            </AlertDescription>
          </Alert>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  disabled={saving}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product in detail"
                  rows={4}
                  disabled={saving}
                />
              </div>

              {/* Category and Price */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={handleCategoryChange} disabled={saving}>
                    <SelectTrigger id="category">
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

                <div>
                  <Label htmlFor="price">Price (GH₵) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Commission and Quantity */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commission_value">Commission Value (GH₵)</Label>
                  <Input
                    id="commission_value"
                    name="commission_value"
                    type="number"
                    step="0.01"
                    value={formData.commission_value}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Delivery Time */}
              <div>
                <Label htmlFor="delivery_time">Delivery Time</Label>
                <Input
                  id="delivery_time"
                  name="delivery_time"
                  value={formData.delivery_time}
                  onChange={handleInputChange}
                  placeholder="e.g., 3-5 business days"
                  disabled={saving}
                />
              </div>

              {/* Variants */}
              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Product Variants (Optional)</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="variant_type">Variant Type (e.g., Color, Size)</Label>
                      <Input
                        id="variant_type"
                        value={newVariantType}
                        onChange={(e) => setNewVariantType(e.target.value)}
                        placeholder="e.g., Color"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="variant_values">Variant Values (comma-separated)</Label>
                      <Input
                        id="variant_values"
                        value={newVariantValues}
                        onChange={(e) => setNewVariantValues(e.target.value)}
                        placeholder="e.g., Red, Blue, Green"
                        disabled={saving}
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate values with commas</p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddVariant}
                      disabled={saving || !newVariantType.trim() || !newVariantValues.trim()}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variant
                    </Button>
                  </div>

                  {/* Variants List */}
                  {formData.variants.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t">
                      <p className="font-medium text-sm text-gray-700">
                        Added Variants ({formData.variants.length})
                      </p>
                      <div className="space-y-2">
                        {formData.variants.map((variant, index) => (
                          <div
                            key={index}
                            className="flex items-start justify-between gap-2 bg-gray-50 p-3 rounded border"
                          >
                            <div>
                              <p className="font-medium text-sm text-gray-800">{variant.type}</p>
                              <p className="text-xs text-gray-600">{variant.values.join(", ")}</p>
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
              </div>

              {/* Images */}
              <div className="border-t pt-6">
                <div>
                  <Label>Product Images *</Label>
                  <div className="space-y-3">
                    {/* File Upload */}
                    <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={saving || uploadingImages}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center cursor-pointer py-6"
                      >
                        <p className="text-sm font-medium text-gray-700">
                          {uploadingImages ? "Uploading..." : "Click to add more images"}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB each</p>
                      </label>
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="mt-4 w-full">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Uploading...</span>
                            <span className="text-sm font-medium text-emerald-600">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image URL Input */}
                    <div className="flex gap-2">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Or paste image URL"
                        disabled={saving}
                      />
                      <Button
                        type="button"
                        onClick={handleAddImageUrl}
                        disabled={saving || !newImageUrl.trim()}
                        variant="outline"
                      >
                        Add URL
                      </Button>
                    </div>

                    {/* Image List */}
                    {formData.image_urls.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          {formData.image_urls.length} image(s) added
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {formData.image_urls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Product ${index + 1}`}
                                className="w-full h-20 object-cover rounded border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Upload, Plus, ArrowLeft, Lock, CheckCircle, AlertCircle, Loader, BookOpen, Zap, Eye, Edit } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStoredAgent } from "@/lib/agent-auth"
import { supabase } from "@/lib/supabase"
import { WHOLESALE_CATEGORIES, createWholesaleProduct } from "@/lib/wholesale"
import { uploadWholesaleProductImage } from "@/lib/wholesale-image-upload"
import { calculateCompressionSavings, getFileSizeDisplay } from "@/lib/image-compression"
import PublishingRulesModal from "@/components/agent/PublishingRulesModal"
import AgentEditProducts from "@/components/agent/AgentEditProducts"
import { toast } from "sonner"

interface Agent {
  id: string
  full_name: string
  isapproved?: boolean
  can_publish_products?: boolean
}

interface ProductVariant {
  type: string
  values: string[]
}

export default function PublishProductsPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [canUpdateProducts, setCanUpdateProducts] = useState(false)
  const [activeTab, setActiveTab] = useState("publish")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [compressionStatus, setCompressionStatus] = useState<{
    message: string
    originalSize: number
    compressedSize: number
    savings: string
  } | null>(null)
  const [showVariantsSection, setShowVariantsSection] = useState(false)
  const [newVariantType, setNewVariantType] = useState("")
  const [newVariantValues, setNewVariantValues] = useState("")

  const router = useRouter()

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

  // Check agent auth and permissions
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedAgent = getStoredAgent()
        if (!storedAgent) {
          router.push("/agent/login")
          return
        }

        // Fetch full agent details to check approval and permissions
        const { data, error } = await supabase
          .from("agents")
          .select("id, full_name, isapproved, can_publish_products, can_update_products")
          .eq("id", storedAgent.id)
          .single()

        if (error) throw error

        setAgent(data)
        setHasPermission(data?.isapproved === true && data?.can_publish_products === true)
        setCanUpdateProducts(data?.can_update_products === true)
        
        // Show publishing rules modal on first load
        setShowRulesModal(true)
      } catch (error) {
        console.error("Error checking auth:", error)
        router.push("/agent/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

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

  const handleAddVariant = () => {
    if (!newVariantType.trim() || !newVariantValues.trim()) {
      toast.error("Please enter both variant type and values")
      return
    }

    // Split values by comma and clean up
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
    toast.success(`Added ${newVariant.type} variant with ${values.length} option(s)`)
  }

  const handleRemoveVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files || !agent) return

    try {
      setUploadingImages(true)
      setUploadProgress(0)
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          const originalSize = file.size


          const progressCallback = (progress: number) => {
            setUploadProgress(Math.round(((i + progress / 100) / files.length) * 100))
          }
          const url = await uploadWholesaleProductImage(file, agent.id, progressCallback)
          uploadedUrls.push(url)

          // Show compression stats after successful upload
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agent) return

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
      setSubmitting(true)

      // Submit product via API route
      const response = await fetch("/api/agent/wholesale/submit-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          commission_value: formData.commission_value,
          quantity: formData.quantity,
          delivery_time: formData.delivery_time || "3-5 business days",
          image_urls: formData.image_urls,
          agent_id: agent.id,
          variants: formData.variants.length > 0 ? formData.variants : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit product")
      }

      // Show success modal instead of just toast
      setShowSuccessModal(true)
      toast.success("Product submitted successfully!")

      // Reset form
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        commission_value: "",
        quantity: "",
        delivery_time: "",
        image_urls: [],
        variants: [],
      })
      setShowDialog(false)
      setShowVariantsSection(false)
      setNewVariantType("")
      setNewVariantValues("")
    } catch (error) {
      console.error("Error submitting product:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit product")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // No permission view
  if (!hasPermission) {
    const whatsappNumber = "+233242799990"
    const defaultMessage = encodeURIComponent("I want to publish products for agents to buy at wholesale or shop on Dataflex Ghana. What are the requirements?")
    const whatsappLink = `https://wa.me/${whatsappNumber.replace("+", "")}?text=${defaultMessage}`

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Button variant="outline" size="sm" asChild className="mb-6 bg-transparent">
            <Link href="/agent/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-8 w-8 text-red-600" />
                <div>
                  <CardTitle>Account Activation Required</CardTitle>
                  <CardDescription>Product publishing access pending</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Your account needs to be activated and approved by an admin before you can publish products on the wholesale platform. Please contact admin for account activation and approval.
              </p>
              <div className="bg-white p-4 rounded border border-red-200">
                <p className="text-sm text-gray-600 font-medium">To get access, you need to:</p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                  <li>1. Contact the admin via WhatsApp</li>
                  <li>2. Provide required documentation</li>
                  <li>3. Wait for account approval</li>
                </ul>
              </div>
              <Button asChild className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  Contact Admin on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/agent/dashboard">Return to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main page - agent has permission
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-xl border-b-4 border-emerald-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            {/* Row 1: Back button + Badge (Mobile-friendly positioning) */}
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-9 w-9 p-0"
              >
                <Link href="/agent/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Badge className="bg-white/20 text-white border-white/30 text-xs sm:text-sm px-2 sm:px-3 py-1 whitespace-nowrap">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>Approved Publisher</span>
              </Badge>
            </div>

            {/* Row 2: Title and Description */}
            <div className="flex items-start gap-3">
              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">Publish Products</h1>
                <p className="text-sm sm:text-base text-emerald-100 mt-1">Upload products for wholesale review and approval</p>
              </div>
            </div>

            {/* Row 3: View Wholesale Button */}
            <div className="flex gap-2 pt-2">
              <Button
                asChild
                className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold gap-2 w-full sm:w-auto"
              >
                <Link href="/agent/wholesale" className="justify-center sm:justify-start">
                  <Eye className="h-4 w-4" />
                  <span>View Wholesale</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs for Publish and Edit */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-emerald-100 border border-emerald-200">
            <TabsTrigger value="publish" className="gap-2">
              <Upload className="h-4 w-4" />
              Publish Products
            </TabsTrigger>
            <TabsTrigger value="edit" className="gap-2">
              <Edit className="h-4 w-4" />
              {canUpdateProducts ? 'Edit Products' : 'Your Products'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="publish" className="space-y-8">
            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <p>1. Submit your product with all details</p>
              <p>2. Admin reviews and approves the product</p>
              <p>4. Product becomes visible at the Wholesale Section</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <p>✓ Product name and description</p>
              <p>✓ Category selection</p>
              <p>✓ Price and commission</p>
              <p>✓ At least one product image</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                Smart Compression
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <p>📸 Works on phones & desktops</p>
              <p>💾 Auto-optimized per device</p>
              <p>⚡ Fixes photo rotation issues</p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Compatibility Notice */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800 ml-2">
            Images are automatically optimized for your device. On phones with limited memory, compression is tuned for better performance. Phone photos are rotated correctly and compressed up to 80%.
          </AlertDescription>
        </Alert>

        {/* Add Product and View Rules Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Button
            onClick={() => setShowDialog(true)}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Product
          </Button>
          <Button
            onClick={() => setShowRulesModal(true)}
            size="lg"
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            View Publishing Rules
          </Button>
        </div>

        {/* Product Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in all details about your product. It will be submitted for admin approval.
              </DialogDescription>
            </DialogHeader>

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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>

              {/* Category and Price Row */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={handleCategoryChange} disabled={submitting}>
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
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Commission and Quantity Row */}
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
                    disabled={submitting}
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
                    disabled={submitting}
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
                  disabled={submitting}
                />
              </div>

              {/* Product Variants Section */}
              <div className="border-t pt-4">
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowVariantsSection(!showVariantsSection)}
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    {showVariantsSection ? "Hide" : "Add"} Product Variants (Optional)
                  </button>
                  <p className="text-sm text-gray-500 mt-1">
                    Add product options like colors, sizes, or materials
                  </p>
                </div>

                {showVariantsSection && (
                  <div className="space-y-4 bg-emerald-50 p-4 rounded-lg">
                    {/* Variant Input */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="variant_type">Variant Type (e.g., Color, Size)</Label>
                        <Input
                          id="variant_type"
                          value={newVariantType}
                          onChange={(e) => setNewVariantType(e.target.value)}
                          placeholder="e.g., Color"
                          disabled={submitting}
                        />
                      </div>

                      <div>
                        <Label htmlFor="variant_values">
                          Variant Values (comma-separated)
                        </Label>
                        <Input
                          id="variant_values"
                          value={newVariantValues}
                          onChange={(e) => setNewVariantValues(e.target.value)}
                          placeholder="e.g., Red, Blue, Green"
                          disabled={submitting}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Separate values with commas
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={handleAddVariant}
                        disabled={submitting || !newVariantType.trim() || !newVariantValues.trim()}
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
                              className="flex items-start justify-between gap-2 bg-white p-3 rounded border border-emerald-200"
                            >
                              <div>
                                <p className="font-medium text-sm text-gray-800">
                                  {variant.type}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {variant.values.join(", ")}
                                </p>
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

              {/* Images Section */}
              <div className="space-y-4 border-t pt-4">
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
                        disabled={submitting || uploadingImages}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center cursor-pointer py-6"
                      >
                        <Upload className="h-8 w-8 text-emerald-600 mb-2" />
                        <p className="text-sm font-medium text-gray-700">
                          {uploadingImages ? "Uploading..." : "Click to upload images"}
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
                      
                      {compressionStatus && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-medium text-green-800 mb-2">{compressionStatus.message}</p>
                          <div className="grid grid-cols-3 gap-3 text-xs text-green-700">
                            <div>
                              <p className="font-semibold">Original</p>
                              <p>{(compressionStatus.originalSize / (1024 * 1024)).toFixed(2)}MB</p>
                            </div>
                            <div>
                              <p className="font-semibold">Compressed</p>
                              <p>{(compressionStatus.compressedSize / (1024 * 1024)).toFixed(2)}MB</p>
                            </div>
                            <div>
                              <p className="font-semibold">Saved</p>
                              <p className="text-green-600 font-bold">{compressionStatus.savings}</p>
                            </div>
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
                        disabled={submitting}
                      />
                      <Button
                        type="button"
                        onClick={handleAddImageUrl}
                        disabled={submitting || !newImageUrl.trim()}
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
                                src={url || "/placeholder.svg"}
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
              <DialogFooter className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Product
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

            {/* Publishing Rules Modal */}
            <PublishingRulesModal open={showRulesModal} onOpenChange={setShowRulesModal} />

            {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-md text-center">
            <DialogTitle className="sr-only">Product Submitted Successfully</DialogTitle>
            <div className="py-6 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Product Submitted!</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your product has been successfully submitted for admin review. Once the admin approves it, it will be listed on the{' '}
                  <span className="font-semibold text-emerald-600">Wholesale page</span> where other agents can view and purchase your products.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="text-sm text-blue-900 font-medium mb-2">What happens next:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Admin will review your product details</li>
                  <li>Ensure all images and info are accurate</li>
                  <li>Product will be activated once approved</li>
                  <li>You'll see it in the Wholesale page</li>
                </ul>
              </div>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Got It!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </TabsContent>

          {/* Edit/View Products Tab */}
          {agent && (
            <TabsContent value="edit" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <Edit className="h-6 w-6 text-blue-600" />
                    {canUpdateProducts ? 'Edit Your Products' : 'Your Products'}
                  </h2>
                  <p className="text-gray-700">
                    {canUpdateProducts 
                      ? 'Edit your submitted products. All changes will be submitted for admin approval. Note: You can only submit products, not publish them directly. Admin approval is required for publishing.'
                      : 'View the products you have submitted. You can delete products if needed. Contact admin to enable editing permissions.'}
                  </p>
                </div>
              </div>
              <AgentEditProducts agentId={agent.id} canUpdateProducts={canUpdateProducts} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

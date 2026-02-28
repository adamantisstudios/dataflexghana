"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, AlertCircle, Upload, Loader, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { uploadPropertyImage, deletePropertyImage } from "@/lib/property-image-upload"
import { compressImages, getFileSizeDisplay, calculateCompressionSavings } from "@/lib/image-compression"
import { toast } from "sonner"

interface AgentPublishNewPropertiesProps {
  agentId: string
}

const PROPERTY_CATEGORIES = [
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

export default function AgentPublishNewProperties({ agentId }: AgentPublishNewPropertiesProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [compressionStatus, setCompressionStatus] = useState<{
    message: string
    originalSize: number
    compressedSize: number
    savings: string
  } | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    currency: "GHS",
    location: "",
    bedrooms: "",
    bathrooms: "",
    square_feet: "",
    commission: "",
    image_urls: [] as string[],
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleCurrencyChange = (value: string) => {
    setFormData((prev) => ({ ...prev, currency: value }))
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
    if (!files || files.length === 0) return

    try {
      setUploadingImages(true)
      setUploadProgress(0)

      // Convert FileList to array
      const fileArray = Array.from(files)

      // Compress images first
      console.log("[v0] Starting compression of", fileArray.length, "images")
      const compressedFiles = await compressImages(fileArray, undefined, (current, total, filename) => {
        console.log(`[v0] Compressing: ${filename} (${current}/${total})`)
      })

      // Calculate compression stats
      const originalSize = fileArray.reduce((sum, f) => sum + f.size, 0)
      const compressedSize = compressedFiles.reduce((sum, f) => sum + f.size, 0)
      const savings = calculateCompressionSavings(originalSize, compressedSize)

      setCompressionStatus({
        message: `Compressed ${compressedFiles.length} images`,
        originalSize,
        compressedSize,
        savings: savings.percentage,
      })

      // Upload compressed images to agent bucket
      const uploadedUrls: string[] = []
      for (let i = 0; i < compressedFiles.length; i++) {
        try {
          console.log(`[v0] Uploading compressed image ${i + 1}/${compressedFiles.length} to agent bucket`)
          const progressCallback = (progress: number) => {
            setUploadProgress(Math.round(((i + progress / 100) / compressedFiles.length) * 100))
          }
          const url = await uploadPropertyImage(compressedFiles[i], "agent", progressCallback)
          uploadedUrls.push(url)
          toast.success(`✓ Uploaded ${compressedFiles[i].name}`)
        } catch (error) {
          console.error(`Error uploading ${compressedFiles[i].name}:`, error)
          toast.error(`Failed to upload ${compressedFiles[i].name}`)
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
      // Reset file input
      if (e.currentTarget) {
        e.currentTarget.value = ""
      }
    }
  }

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.title.trim()) {
        toast.error("Property title is required")
        return false
      }
      if (!formData.category) {
        toast.error("Please select a category")
        return false
      }
      return true
    }
    if (step === 2) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error("Valid price is required")
        return false
      }
      if (!formData.currency) {
        toast.error("Please select a currency")
        return false
      }
      if (!formData.location.trim()) {
        toast.error("Location is required")
        return false
      }
      return true
    }
    if (step === 3) {
      if (formData.image_urls.length === 0) {
        toast.error("At least one property image is required")
        return false
      }
      return true
    }
    return true
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation for final step
    if (!validateStep(3)) {
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        currency: formData.currency,
        location: formData.location,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        square_feet: formData.square_feet ? parseInt(formData.square_feet) : undefined,
        commission: formData.commission ? parseFloat(formData.commission) : undefined,
        image_urls: formData.image_urls,
        agent_id: agentId,
      }

      // Submit property via API route
      const response = await fetch("/api/agent/properties/submit-property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.details ? `${result.error} (${result.details})` : result.error || "Failed to submit property"
        throw new Error(errorMsg)
      }

      // Show success modal
      setShowSuccessModal(true)
      toast.success("Property submitted successfully!")

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        price: "",
        currency: "GHS",
        location: "",
        bedrooms: "",
        bathrooms: "",
        square_feet: "",
        commission: "",
        image_urls: [],
      })
      setShowDialog(false)
      setCurrentStep(1)
    } catch (error) {
      console.error("Error submitting property:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit property")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Add Property Button */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Button
          onClick={() => setShowDialog(true)}
          size="lg"
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Property
        </Button>
      </div>

      {/* Property Dialog - Multi-Step Form */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publish New Property</DialogTitle>
            <DialogDescription>
              Step {currentStep} of 3 - Complete all details to submit your property
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-orange-900 mb-1">Step 1: Basic Information</h3>
                  <p className="text-xs text-orange-700">Tell us about your property</p>
                </div>

                <div>
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., 3-Bedroom House in Tema"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the property and its features..."
                    disabled={submitting}
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={handleCategoryChange} disabled={submitting}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Pricing & Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-orange-900 mb-1">Step 2: Pricing & Details</h3>
                  <p className="text-xs text-orange-700">Set the price and provide property specifications</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price *</Label>
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
                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <Select value={formData.currency} onValueChange={handleCurrencyChange} disabled={submitting}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GHS">GHS (₵)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Area, Region"
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      placeholder="0"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      placeholder="0"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="square_feet">Square Feet</Label>
                    <Input
                      id="square_feet"
                      name="square_feet"
                      type="number"
                      value={formData.square_feet}
                      onChange={handleInputChange}
                      placeholder="0"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="commission">Commission (Optional)</Label>
                  <Input
                    id="commission"
                    name="commission"
                    type="number"
                    step="0.01"
                    value={formData.commission}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Commission amount in Ghana Cedis (GH¢) - This is what you will earn by selling/promoting this property</p>
                </div>
              </div>
            )}

            {/* Step 3: Images */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-orange-900 mb-1">Step 3: Property Images</h3>
                  <p className="text-xs text-orange-700">Upload at least one clear property image</p>
                </div>

                <div className="space-y-3">
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 bg-orange-50/50">
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
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      {uploadingImages ? (
                        <>
                          <Loader className="h-8 w-8 text-orange-600 mb-2 animate-spin" />
                          <p className="text-sm font-medium text-gray-700">
                            {uploadProgress}% Uploading...
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-orange-600 mb-2" />
                          <p className="text-sm font-medium text-gray-700">
                            Click to upload images
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, JPEG, WebP up to 5MB each
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Compression Status */}
                  {compressionStatus && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 ml-2 text-xs">
                        {compressionStatus.message} - Saved{" "}
                        <strong>{compressionStatus.savings}%</strong> ({getFileSizeDisplay(compressionStatus.originalSize - compressionStatus.compressedSize)})
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Images List */}
                  {formData.image_urls.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-medium">{formData.image_urls.length} image(s) uploaded</p>
                      <div className="grid grid-cols-2 gap-2">
                        {formData.image_urls.map((url, index) => (
                          <div
                            key={index}
                            className="relative group rounded border border-gray-200 overflow-hidden"
                          >
                            <img
                              src={url}
                              alt={`Property ${index + 1}`}
                              className="h-24 w-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveImage(index)}
                              disabled={submitting}
                              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual URL Entry */}
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-2">Or paste image URLs manually:</p>
                    <div className="flex gap-2">
                      <Input
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Enter image URL"
                        disabled={submitting}
                      />
                      <Button
                        type="button"
                        onClick={handleAddImageUrl}
                        variant="outline"
                        disabled={submitting || !newImageUrl.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning Alert */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 ml-2 text-sm">
                Your property will be submitted for admin review and set to <strong>Pending</strong> status. It will appear once approved.
              </AlertDescription>
            </Alert>

            {/* Navigation Buttons */}
            <div className="flex gap-2 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (currentStep > 1) {
                    handlePrevStep()
                  } else {
                    setShowDialog(false)
                  }
                }}
                disabled={submitting}
              >
                {currentStep > 1 ? "Back" : "Cancel"}
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={submitting}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                >
                  {submitting ? "Submitting..." : "Publish Property"}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Property Submitted!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-900">Submission Successful</p>
              <p className="text-sm text-gray-600 mt-2">
                Your property has been submitted for admin review.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3 text-sm text-amber-900">
                <p className="font-semibold mb-1">📌 Important:</p>
                <p className="text-xs leading-relaxed">
                  Your property will remain <strong>unpublished</strong> until our admin team reviews and approves it. You'll be notified when it's live and visible to other agents.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
            >
              Got It!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

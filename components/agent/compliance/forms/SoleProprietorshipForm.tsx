"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Upload, X, Building2, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { SignatureCanvas } from "../SignatureCanvas"
import { PaymentReminderModal } from "@/components/shared/PaymentReminderModal"
import { scrollToElement } from "@/lib/scroll-utils"

interface SoleProprietorshipFormProps {
  agentId: string
  onComplete: () => void
  onCancel: () => void
}

const GHANA_REGIONS = [
  "Greater Accra Region",
  "Ashanti Region",
  "Western Region",
  "Eastern Region",
  "Volta Region",
  "Northern Region",
  "Upper East Region",
  "Upper West Region",
  "Central Region",
  "Bono Region",
  "Bono East Region",
  "Ahafo Region",
  "Savannah Region",
  "North East Region",
  "Oti Region",
  "Western North Region",
]

const BUSINESS_SECTORS = [
  "Agriculture and Agribusiness",
  "Mining and Quarrying",
  "Oil and Gas",
  "ICT",
  "Financial Services",
  "Manufacturing",
  "Tourism and Hospitality",
  "Real Estate and Construction",
  "Transportation and Logistics",
  "Education and Training",
  "Healthcare and Pharmaceuticals",
  "Retail and Wholesale Trade",
  "Media and Entertainment",
  "Renewable Energy",
  "Textiles and Apparel",
  "Fisheries and Aquaculture",
  "Waste Management and Recycling",
  "Cosmetics and Personal Care",
  "Legal and Consultancy Services",
  "Food and Beverage Industry",
  "Other",
]

const TITLES = ["Mr.", "Mrs.", "Ms.", "Miss", "Dr.", "Prof.", "Rev.", "Pastor", "Imam", "Chief", "Hon.", "Nana"]

const OWNERSHIP_TYPES = ["Owned", "Rented", "Family Property", "Company Property", "Government Property"]

const POSTAL_TYPES = ["P.O. Box", "Private Bag", "LMB (Large Mail Box)", "PMB (Private Mail Bag)"]

const EMPLOYMENT_SIZES = [
  "1-5 employees",
  "6-10 employees",
  "11-20 employees",
  "21-50 employees",
  "51-100 employees",
  "101-250 employees",
  "251-500 employees",
  "Above 500 employees",
]

const REVENUE_RANGES = [
  "Below GHS 50,000",
  "GHS 50,000 - 100,000",
  "GHS 100,001 - 250,000",
  "GHS 250,001 - 500,000",
  "GHS 500,001 - 1,000,000",
  "GHS 1,000,001 - 2,500,000",
  "GHS 2,500,001 - 5,000,000",
  "GHS 5,000,001 - 10,000,000",
  "Above GHS 10,000,000",
]

const BOP_OPTIONS = ["Apply for BOP Now", "Apply for BOP Later", "Already have a BOP", "Not Required for my business"]

export function SoleProprietorshipForm({ agentId, onComplete, onCancel }: SoleProprietorshipFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [showCostPopup, setShowCostPopup] = useState(true)
  const [showPaymentReminder, setShowPaymentReminder] = useState(false)

  const [formData, setFormData] = useState({
    // Section 1: Business Information
    business_name: "",
    nature_of_business: "",
    isic_code_1: "",
    isic_code_2: "",
    isic_code_3: "",
    isic_code_4: "",
    isic_code_5: "",
    business_description: "",

    // Section 2: Address Information
    registered_digital_address: "",
    registered_house_number: "",
    registered_street_name: "",
    registered_city: "",
    registered_district: "",
    registered_region: "",
    ownership_type: "",
    landlord_name: "",
    same_as_registered: false,
    principal_digital_address: "",
    principal_house_number: "",
    principal_street_name: "",
    principal_city: "",
    principal_district: "",
    principal_region: "",

    // Section 3: Contact Information
    postal_type: "",
    postal_prefix: "",
    postal_number: "",
    box_region: "",
    box_town: "",
    box_location: "",
    primary_phone: "",
    secondary_phone: "",
    primary_mobile: "",
    secondary_mobile: "",
    fax_number: "",
    business_email: "",
    business_website: "",

    // Section 4: Proprietor Information
    title: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    former_name: "",
    gender: "",
    date_of_birth: "",
    nationality: "",
    occupation: "",
    tin_number: "",
    ghana_card_number: "",
    residential_digital_address: "",
    residential_house_number: "",
    residential_street_name: "",
    residential_city: "",
    residential_district: "",
    residential_region: "",
    residential_country: "",

    // Section 5: Additional Information
    employment_size: "",
    revenue_envisaged: "",
    bop_application: "",
    bop_reference_number: "",
  })

  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [ghanaCardFront, setGhanaCardFront] = useState<File | null>(null)
  const [ghanaCardFrontPreview, setGhanaCardFrontPreview] = useState<string | null>(null)
  const [ghanaCardBack, setGhanaCardBack] = useState<File | null>(null)
  const [ghanaCardBackPreview, setGhanaCardBackPreview] = useState<string | null>(null)

  useEffect(() => {
    setShowCostPopup(true)
  }, [])

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (submissionId) {
        saveProgress()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [formData, submissionId])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGhanaCardFrontChange = (file: File | null) => {
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setGhanaCardFront(file)
      setGhanaCardFrontPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleGhanaCardBackChange = (file: File | null) => {
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setGhanaCardBack(file)
      setGhanaCardBackPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeGhanaCardFront = () => {
    setGhanaCardFront(null)
    setGhanaCardFrontPreview(null)
  }

  const removeGhanaCardBack = () => {
    setGhanaCardBack(null)
    setGhanaCardBackPreview(null)
  }

  const uploadImage = async (file: File | string, type: string): Promise<string | null> => {
    try {
      let fileToUpload: File

      // Handle signature data URL
      if (typeof file === "string") {
        const response = await fetch(file)
        const blob = await response.blob()
        fileToUpload = new File([blob], `signature_${Date.now()}.png`, { type: "image/png" })
      } else {
        fileToUpload = file
      }

      const fileExt = fileToUpload.name.split(".").pop()
      const fileName = `${agentId}_${type}_${Date.now()}.${fileExt}`
      const filePath = `compliance/${fileName}`

      const { error: uploadError } = await supabase.storage.from("compliance-images").upload(filePath, fileToUpload)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("compliance-images").getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      return null
    }
  }

  const saveProgress = async () => {
    try {
      setIsSaving(true)

      if (submissionId) {
        // Update existing submission
        const { error } = await supabase
          .from("form_submissions")
          .update({
            form_data: formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId)

        if (error) throw error
      } else {
        // Create new submission
        const { data, error } = await supabase
          .from("form_submissions")
          .insert({
            agent_id: agentId,
            form_id: "sole-proprietorship",
            form_data: formData,
            status: "Pending",
          })
          .select()
          .single()

        if (error) throw error
        setSubmissionId(data.id)
      }

      toast.success("Progress saved")
    } catch (error) {
      console.error("Error saving progress:", error)
      toast.error("Failed to save progress")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!signatureDataUrl) {
      toast.error("Please capture your signature")
      return
    }

    if (!ghanaCardFront) {
      toast.error("Please upload the front of your Ghana Card")
      return
    }

    if (!ghanaCardBack) {
      toast.error("Please upload the back of your Ghana Card")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("[v0] Uploading images...")
      // Upload images
      const signatureUrl = await uploadImage(signatureDataUrl, "signature")
      const ghanaCardFrontUrl = ghanaCardFront ? await uploadImage(ghanaCardFront, "ghana_card_front") : null
      const ghanaCardBackUrl = ghanaCardBack ? await uploadImage(ghanaCardBack, "ghana_card_back") : null

      if (!signatureUrl || !ghanaCardFrontUrl || !ghanaCardBackUrl) {
        console.error("[v0] Failed to upload images", { signatureUrl, ghanaCardFrontUrl, ghanaCardBackUrl })
        throw new Error("Failed to upload images")
      }

      console.log("[v0] Images uploaded successfully", { signatureUrl, ghanaCardFrontUrl, ghanaCardBackUrl })

      // Create or update submission
      let finalSubmissionId = submissionId

      if (submissionId) {
        console.log("[v0] Updating existing submission", submissionId)
        // Update existing submission
        const { error } = await supabase
          .from("form_submissions")
          .update({
            form_data: formData,
            status: "Pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId)

        if (error) {
          console.error("[v0] Error updating submission:", error)
          console.error("[v0] Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          })
          throw error
        }
        console.log("[v0] Submission updated successfully")
      } else {
        console.log("[v0] Creating new submission")
        // Create new submission
        const { data, error } = await supabase
          .from("form_submissions")
          .insert({
            agent_id: agentId,
            form_id: "sole-proprietorship",
            form_data: formData,
            status: "Pending",
          })
          .select()
          .single()

        if (error) {
          console.error("[v0] Error creating submission:", error)
          console.error("[v0] Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          })
          throw error
        }
        finalSubmissionId = data.id
        console.log("[v0] Submission created with ID:", finalSubmissionId)
      }

      console.log("[v0] Inserting form images...")
      const { error: imagesError } = await supabase.from("form_images").insert([
        {
          submission_id: finalSubmissionId,
          image_type: "signature",
          image_url: signatureUrl,
        },
        {
          submission_id: finalSubmissionId,
          image_type: "ghana_card_front",
          image_url: ghanaCardFrontUrl,
        },
        {
          submission_id: finalSubmissionId,
          image_type: "ghana_card_back",
          image_url: ghanaCardBackUrl,
        },
      ])

      if (imagesError) {
        console.error("[v0] Error inserting images:", imagesError)
        console.error("[v0] Error details:", {
          message: imagesError.message,
          details: imagesError.details,
          hint: imagesError.hint,
          code: imagesError.code,
        })
        throw imagesError
      }

      console.log("[v0] Form submitted successfully!")
      toast.success(
        "Form submitted successfully! Your Sole Proprietorship application will be processed within 14 working days.",
        {
          duration: 6000,
        },
      )

      setShowPaymentReminder(true)
    } catch (error: any) {
      console.error("[v0] Error submitting form:", error)
      const errorMessage = error?.message || "Unknown error occurred"
      toast.error(`Failed to submit form: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const scrollToFormSection = () => {
    const formElement = document.querySelector("[data-form-section]")
    if (formElement) {
      scrollToElement(formElement as HTMLElement)
    }
  }

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1)
    setTimeout(scrollToFormSection, 100)
  }

  const prevStep = () => {
    if (currentStep === 1) {
      onCancel()
    } else {
      setCurrentStep((prev) => prev - 1)
      setTimeout(scrollToFormSection, 100)
    }
  }

  const totalSteps = 6 // 5 form sections + 1 documents section

return (
  <>
    {showCostPopup && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-300 bg-white shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-emerald-600" />
              <CardTitle className="text-emerald-600">Sole Proprietorship Fee</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-800">Processing Cost:</span>
                <span className="text-lg font-bold text-emerald-600">580 GHS</span>
              </div>
              
              {/* COMMISSION SECTION ADDED HERE */}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                <span className="text-sm font-medium text-amber-700">Your Commission:</span>
                <span className="text-lg font-bold text-amber-600">50 GHS</span>
              </div>
              
              <div className="border-t border-emerald-200 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Duration:</span>
                  <span className="text-sm font-medium text-emerald-800">14 Working Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Delivery:</span>
                  <span className="text-sm font-medium text-emerald-800">Free Delivery Nationwide</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              This fee covers processing, platform fees, and registration of your sole proprietorship.
            </p>
            <Button onClick={() => setShowCostPopup(false)} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )}

      <PaymentReminderModal
        isOpen={showPaymentReminder}
        onClose={() => {
          setShowPaymentReminder(false)
          onComplete()
        }}
        fee="580 GHS"
        serviceName="Sole Proprietorship Registration"
      />

      <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-emerald-800 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Sole Proprietorship Registration
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {totalSteps}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div data-form-section>
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800">Business Information</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Note:</strong> If you don't have information for any field (such as ISIC codes or other
                    optional details), you can skip it and continue filling the rest of the form. All required fields
                    are marked with an asterisk (*).
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Provide basic information about your business including the name and primary sector of operation
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="business_name">Business Name *</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => handleInputChange("business_name", e.target.value)}
                      placeholder="Enter business name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="nature_of_business">Nature of Business/Sector(s) *</Label>
                    <Select
                      value={formData.nature_of_business}
                      onValueChange={(value) => handleInputChange("nature_of_business", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_SECTORS.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="isic_code_1">ISIC Code 1</Label>
                    <Input
                      id="isic_code_1"
                      value={formData.isic_code_1}
                      onChange={(e) => handleInputChange("isic_code_1", e.target.value)}
                      placeholder="Enter ISIC code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="isic_code_2">ISIC Code 2</Label>
                    <Input
                      id="isic_code_2"
                      value={formData.isic_code_2}
                      onChange={(e) => handleInputChange("isic_code_2", e.target.value)}
                      placeholder="Enter ISIC code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="isic_code_3">ISIC Code 3</Label>
                    <Input
                      id="isic_code_3"
                      value={formData.isic_code_3}
                      onChange={(e) => handleInputChange("isic_code_3", e.target.value)}
                      placeholder="Enter ISIC code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="isic_code_4">ISIC Code 4</Label>
                    <Input
                      id="isic_code_4"
                      value={formData.isic_code_4}
                      onChange={(e) => handleInputChange("isic_code_4", e.target.value)}
                      placeholder="Enter ISIC code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="isic_code_5">ISIC Code 5</Label>
                    <Input
                      id="isic_code_5"
                      value={formData.isic_code_5}
                      onChange={(e) => handleInputChange("isic_code_5", e.target.value)}
                      placeholder="Enter ISIC code"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="business_description">Business Description (if ISIC codes unknown)</Label>
                    <Textarea
                      id="business_description"
                      value={formData.business_description}
                      onChange={(e) => handleInputChange("business_description", e.target.value)}
                      placeholder="Describe your business activities"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800">Address Information</h3>
                <p className="text-sm text-gray-600">
                  Provide your business registered office address and principal place of business
                </p>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-emerald-700 mb-3">Registered Office Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="registered_digital_address">Digital Address (Ghana Post GPS) *</Label>
                      <Input
                        id="registered_digital_address"
                        value={formData.registered_digital_address}
                        onChange={(e) => handleInputChange("registered_digital_address", e.target.value)}
                        placeholder="GX-XXX-XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="registered_house_number">House Number/Building Name *</Label>
                      <Input
                        id="registered_house_number"
                        value={formData.registered_house_number}
                        onChange={(e) => handleInputChange("registered_house_number", e.target.value)}
                        placeholder="Enter house number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="registered_street_name">Street Name *</Label>
                      <Input
                        id="registered_street_name"
                        value={formData.registered_street_name}
                        onChange={(e) => handleInputChange("registered_street_name", e.target.value)}
                        placeholder="Enter street name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="registered_city">City/Town *</Label>
                      <Input
                        id="registered_city"
                        value={formData.registered_city}
                        onChange={(e) => handleInputChange("registered_city", e.target.value)}
                        placeholder="Enter city/town"
                      />
                    </div>
                    <div>
                      <Label htmlFor="registered_district">District *</Label>
                      <Input
                        id="registered_district"
                        value={formData.registered_district}
                        onChange={(e) => handleInputChange("registered_district", e.target.value)}
                        placeholder="Enter district"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="registered_region">Region *</Label>
                      <Select
                        value={formData.registered_region}
                        onValueChange={(value) => handleInputChange("registered_region", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {GHANA_REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ownership_type">Ownership Type *</Label>
                      <Select
                        value={formData.ownership_type}
                        onValueChange={(value) => handleInputChange("ownership_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ownership type" />
                        </SelectTrigger>
                        <SelectContent>
                          {OWNERSHIP_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.ownership_type === "Rented" && (
                      <div>
                        <Label htmlFor="landlord_name">Landlord Full Name</Label>
                        <Input
                          id="landlord_name"
                          value={formData.landlord_name}
                          onChange={(e) => handleInputChange("landlord_name", e.target.value)}
                          placeholder="Enter landlord name"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="same_as_registered"
                      checked={formData.same_as_registered}
                      onCheckedChange={(checked) => handleInputChange("same_as_registered", checked as boolean)}
                    />
                    <Label htmlFor="same_as_registered" className="cursor-pointer">
                      Principal place same as registered office address
                    </Label>
                  </div>

                  {!formData.same_as_registered && (
                    <>
                      <h4 className="font-semibold text-emerald-700 mb-3">Principal Place of Business</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="principal_digital_address">Digital Address (Ghana Post GPS)</Label>
                          <Input
                            id="principal_digital_address"
                            value={formData.principal_digital_address}
                            onChange={(e) => handleInputChange("principal_digital_address", e.target.value)}
                            placeholder="GX-XXX-XXXX"
                          />
                        </div>
                        <div>
                          <Label htmlFor="principal_house_number">House Number/Building Name</Label>
                          <Input
                            id="principal_house_number"
                            value={formData.principal_house_number}
                            onChange={(e) => handleInputChange("principal_house_number", e.target.value)}
                            placeholder="Enter house number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="principal_street_name">Street Name</Label>
                          <Input
                            id="principal_street_name"
                            value={formData.principal_street_name}
                            onChange={(e) => handleInputChange("principal_street_name", e.target.value)}
                            placeholder="Enter street name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="principal_city">City/Town</Label>
                          <Input
                            id="principal_city"
                            value={formData.principal_city}
                            onChange={(e) => handleInputChange("principal_city", e.target.value)}
                            placeholder="Enter city/town"
                          />
                        </div>
                        <div>
                          <Label htmlFor="principal_district">District</Label>
                          <Input
                            id="principal_district"
                            value={formData.principal_district}
                            onChange={(e) => handleInputChange("principal_district", e.target.value)}
                            placeholder="Enter district"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="principal_region">Region</Label>
                          <Select
                            value={formData.principal_region}
                            onValueChange={(value) => handleInputChange("principal_region", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              {GHANA_REGIONS.map((region) => (
                                <SelectItem key={region} value={region}>
                                  {region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800">Contact Information</h3>
                <p className="text-sm text-gray-600">
                  Provide postal address and contact information for your business
                </p>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-emerald-700 mb-3">Postal Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postal_type">Postal Type</Label>
                      <Select
                        value={formData.postal_type}
                        onValueChange={(value) => handleInputChange("postal_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select postal type" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSTAL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="postal_prefix">Postal Prefix</Label>
                      <Input
                        id="postal_prefix"
                        value={formData.postal_prefix}
                        onChange={(e) => handleInputChange("postal_prefix", e.target.value)}
                        placeholder="Enter prefix"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postal_number">Postal Number</Label>
                      <Input
                        id="postal_number"
                        value={formData.postal_number}
                        onChange={(e) => handleInputChange("postal_number", e.target.value)}
                        placeholder="Enter postal number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="box_region">Box Region</Label>
                      <Input
                        id="box_region"
                        value={formData.box_region}
                        onChange={(e) => handleInputChange("box_region", e.target.value)}
                        placeholder="Enter region"
                      />
                    </div>
                    <div>
                      <Label htmlFor="box_town">Box Town</Label>
                      <Input
                        id="box_town"
                        value={formData.box_town}
                        onChange={(e) => handleInputChange("box_town", e.target.value)}
                        placeholder="Enter town"
                      />
                    </div>
                    <div>
                      <Label htmlFor="box_location">Box Location/Area</Label>
                      <Input
                        id="box_location"
                        value={formData.box_location}
                        onChange={(e) => handleInputChange("box_location", e.target.value)}
                        placeholder="Enter location"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-emerald-700 mb-3">Contact Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primary_phone">Primary Phone Number *</Label>
                      <Input
                        id="primary_phone"
                        value={formData.primary_phone}
                        onChange={(e) => handleInputChange("primary_phone", e.target.value)}
                        placeholder="0XX XXX XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondary_phone">Secondary Phone Number</Label>
                      <Input
                        id="secondary_phone"
                        value={formData.secondary_phone}
                        onChange={(e) => handleInputChange("secondary_phone", e.target.value)}
                        placeholder="0XX XXX XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="primary_mobile">Primary Mobile Number *</Label>
                      <Input
                        id="primary_mobile"
                        value={formData.primary_mobile}
                        onChange={(e) => handleInputChange("primary_mobile", e.target.value)}
                        placeholder="0XX XXX XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondary_mobile">Secondary Mobile Number</Label>
                      <Input
                        id="secondary_mobile"
                        value={formData.secondary_mobile}
                        onChange={(e) => handleInputChange("secondary_mobile", e.target.value)}
                        placeholder="0XX XXX XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fax_number">Fax Number</Label>
                      <Input
                        id="fax_number"
                        value={formData.fax_number}
                        onChange={(e) => handleInputChange("fax_number", e.target.value)}
                        placeholder="Enter fax number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business_email">Business Email Address *</Label>
                      <Input
                        id="business_email"
                        type="email"
                        value={formData.business_email}
                        onChange={(e) => handleInputChange("business_email", e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="business_website">Business Website</Label>
                      <Input
                        id="business_website"
                        type="url"
                        value={formData.business_website}
                        onChange={(e) => handleInputChange("business_website", e.target.value)}
                        placeholder="https://www.example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Proprietor Information */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800">Proprietor Information</h3>
                <p className="text-sm text-gray-600">
                  Provide personal information about the business owner/proprietor and their residential address
                </p>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-emerald-700 mb-3">Personal Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Select value={formData.title} onValueChange={(value) => handleInputChange("title", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select title" />
                        </SelectTrigger>
                        <SelectContent>
                          {TITLES.map((title) => (
                            <SelectItem key={title} value={title}>
                              {title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange("first_name", e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="middle_name">Middle Name</Label>
                      <Input
                        id="middle_name"
                        value={formData.middle_name}
                        onChange={(e) => handleInputChange("middle_name", e.target.value)}
                        placeholder="Enter middle name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name/Surname *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange("last_name", e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="former_name">Any Former Name</Label>
                      <Input
                        id="former_name"
                        value={formData.former_name}
                        onChange={(e) => handleInputChange("former_name", e.target.value)}
                        placeholder="Enter former name if any"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth *</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nationality *</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => handleInputChange("nationality", e.target.value)}
                        placeholder="Ghanaian"
                      />
                    </div>
                    <div>
                      <Label htmlFor="occupation">Occupation *</Label>
                      <Input
                        id="occupation"
                        value={formData.occupation}
                        onChange={(e) => handleInputChange("occupation", e.target.value)}
                        placeholder="Enter occupation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tin_number">TIN (Tax Identification Number)</Label>
                      <Input
                        id="tin_number"
                        value={formData.tin_number}
                        onChange={(e) => handleInputChange("tin_number", e.target.value)}
                        placeholder="Enter TIN if available"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ghana_card_number">Ghana Card Number *</Label>
                      <Input
                        id="ghana_card_number"
                        value={formData.ghana_card_number}
                        onChange={(e) => handleInputChange("ghana_card_number", e.target.value)}
                        placeholder="GHA-XXXXXXXXX-X"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-emerald-700 mb-3">Residential Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="residential_digital_address">Digital Address (Ghana Post GPS) *</Label>
                      <Input
                        id="residential_digital_address"
                        value={formData.residential_digital_address}
                        onChange={(e) => handleInputChange("residential_digital_address", e.target.value)}
                        placeholder="GX-XXX-XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="residential_house_number">House Number/Building Name *</Label>
                      <Input
                        id="residential_house_number"
                        value={formData.residential_house_number}
                        onChange={(e) => handleInputChange("residential_house_number", e.target.value)}
                        placeholder="Enter house number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="residential_street_name">Street Name *</Label>
                      <Input
                        id="residential_street_name"
                        value={formData.residential_street_name}
                        onChange={(e) => handleInputChange("residential_street_name", e.target.value)}
                        placeholder="Enter street name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="residential_city">City/Town *</Label>
                      <Input
                        id="residential_city"
                        value={formData.residential_city}
                        onChange={(e) => handleInputChange("residential_city", e.target.value)}
                        placeholder="Enter city/town"
                      />
                    </div>
                    <div>
                      <Label htmlFor="residential_district">District *</Label>
                      <Input
                        id="residential_district"
                        value={formData.residential_district}
                        onChange={(e) => handleInputChange("residential_district", e.target.value)}
                        placeholder="Enter district"
                      />
                    </div>
                    <div>
                      <Label htmlFor="residential_region">Region *</Label>
                      <Select
                        value={formData.residential_region}
                        onValueChange={(value) => handleInputChange("residential_region", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {GHANA_REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="residential_country">Country *</Label>
                      <Input
                        id="residential_country"
                        value={formData.residential_country}
                        onChange={(e) => handleInputChange("residential_country", e.target.value)}
                        placeholder="Ghana"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Additional Information */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800">Additional Information</h3>
                <p className="text-sm text-gray-600">
                  Provide MSME details, Business Operating Permit information, and complete the declaration
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="employment_size">Employment Size *</Label>
                    <Select
                      value={formData.employment_size}
                      onValueChange={(value) => handleInputChange("employment_size", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment size" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="revenue_envisaged">Revenue Envisaged (GHS) *</Label>
                    <Select
                      value={formData.revenue_envisaged}
                      onValueChange={(value) => handleInputChange("revenue_envisaged", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select revenue range" />
                      </SelectTrigger>
                      <SelectContent>
                        {REVENUE_RANGES.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="bop_application">Business Operating Permit (BOP) Application *</Label>
                    <Select
                      value={formData.bop_application}
                      onValueChange={(value) => handleInputChange("bop_application", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select BOP option" />
                      </SelectTrigger>
                      <SelectContent>
                        {BOP_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.bop_application === "Already have a BOP" && (
                    <div className="md:col-span-2">
                      <Label htmlFor="bop_reference_number">BOP Reference Number</Label>
                      <Input
                        id="bop_reference_number"
                        value={formData.bop_reference_number}
                        onChange={(e) => handleInputChange("bop_reference_number", e.target.value)}
                        placeholder="Enter BOP reference number"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Documents (Signature & Ghana Card) */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-emerald-800">Documents & Signature</h3>
                <p className="text-sm text-gray-600">
                  Capture your signature and upload both the front and back of your Ghana Card to complete the
                  application
                </p>

                {/* Signature Canvas */}
                <SignatureCanvas onSignatureCapture={setSignatureDataUrl} />

                {/* Ghana Card Front Upload */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Ghana Card - Front Side *</Label>
                  <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4">
                    {ghanaCardFrontPreview ? (
                      <div className="relative">
                        <img
                          src={ghanaCardFrontPreview || "/placeholder.svg"}
                          alt="Ghana Card Front"
                          className="max-h-48 mx-auto rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeGhanaCardFront}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer py-8">
                        <Upload className="h-12 w-12 text-emerald-600 mb-3" />
                        <span className="text-base font-medium text-emerald-600 mb-1">
                          Click to upload Ghana Card Front
                        </span>
                        <span className="text-sm text-gray-500">PNG, JPG up to 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleGhanaCardFrontChange(e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Ghana Card Back Upload */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Ghana Card - Back Side *</Label>
                  <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4">
                    {ghanaCardBackPreview ? (
                      <div className="relative">
                        <img
                          src={ghanaCardBackPreview || "/placeholder.svg"}
                          alt="Ghana Card Back"
                          className="max-h-48 mx-auto rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeGhanaCardBack}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer py-8">
                        <Upload className="h-12 w-12 text-emerald-600 mb-3" />
                        <span className="text-base font-medium text-emerald-600 mb-1">
                          Click to upload Ghana Card Back
                        </span>
                        <span className="text-sm text-gray-500">PNG, JPG up to 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleGhanaCardBackChange(e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-emerald-200">
            <Button
              variant="outline"
              onClick={prevStep}
              className="w-full sm:w-auto border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? "Cancel" : "Previous"}
            </Button>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {currentStep > 1 && currentStep < totalSteps && (
                <Button
                  variant="outline"
                  onClick={saveProgress}
                  disabled={isSaving}
                  className="w-full sm:w-auto border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Progress"}
                </Button>
              )}

              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

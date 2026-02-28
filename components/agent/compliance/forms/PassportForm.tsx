"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Upload, X, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { scrollToElement } from "@/lib/scroll-utils"

interface PassportFormProps {
  agentId: string
  onComplete: () => void
  onCancel: () => void
}

interface CostTier {
  id: string
  days: string
  cost: number
  delivery: string
  description: string
}

const PASSPORT_COST_TIERS: CostTier[] = [
  {
    id: "premium",
    days: "5 Days",
    cost: 2600,
    delivery: "Express Nationwide Delivery",
    description: "Premium Processing",
  },
  {
    id: "express",
    days: "3 Weeks",
    cost: 1700,
    delivery: "Standard Nationwide Delivery",
    description: "Express Processing",
  },
  {
    id: "standard",
    days: "6 Weeks",
    cost: 1100,
    delivery: "Standard Nationwide Delivery",
    description: "Standard Processing",
  },
]

const COMMISSION_AMOUNT = 100
const GHANA_REGIONS = [
  "Greater Accra Region", "Ashanti Region", "Western Region", "Eastern Region",
  "Volta Region", "Northern Region", "Upper East Region", "Upper West Region",
  "Central Region", "Bono Region", "Bono East Region", "Ahafo Region",
  "Savannah Region", "North East Region", "Oti Region", "Western North Region",
]

export function PassportForm({ agentId, onComplete, onCancel }: PassportFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCostPopup, setShowCostPopup] = useState(true)
  const [selectedCostTier, setSelectedCostTier] = useState<CostTier | null>(null)

  const [formData, setFormData] = useState({
    // Personal Information
    full_name: "",
    date_of_birth: "",
    place_of_birth: "",
    gender: "",
    nationality: "",
    ghana_card_number: "",
    nid_number: "",
    phone_number: "",
    email: "",

    // Current Address
    current_residential_address: "",
    current_digital_address: "",
    current_city: "",
    current_region: "",
    current_postal_address: "",

    // Permanent Address
    permanent_residential_address: "",
    permanent_digital_address: "",
    permanent_city: "",
    permanent_region: "",
    permanent_postal_address: "",

    // Occupation and Employment
    occupation: "",
    employer_name: "",
    employer_address: "",

    // Emergency Contact
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    emergency_contact_address: "",

    // Passport Details
    passport_type: "Regular",
    intended_use: "",
    travel_countries: "",

    // Signature
    signature_date: "",
    additional_notes: "",
  })

  const [passportPhotoFile, setPassportPhotoFile] = useState<File | null>(null)
  const [passportPhotoPreview, setPassportPhotoPreview] = useState<string | null>(null)
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (
    type: "passportPhoto" | "idFront" | "idBack",
    file: File | null,
  ) => {
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
      if (type === "passportPhoto") {
        setPassportPhotoFile(file)
        setPassportPhotoPreview(reader.result as string)
      } else if (type === "idFront") {
        setIdFrontFile(file)
        setIdFrontPreview(reader.result as string)
      } else {
        setIdBackFile(file)
        setIdBackPreview(reader.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeFile = (type: "passportPhoto" | "idFront" | "idBack") => {
    if (type === "passportPhoto") {
      setPassportPhotoFile(null)
      setPassportPhotoPreview(null)
    } else if (type === "idFront") {
      setIdFrontFile(null)
      setIdFrontPreview(null)
    } else {
      setIdBackFile(null)
      setIdBackPreview(null)
    }
  }

  const uploadImage = async (file: File, type: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${agentId}_${type}_${Date.now()}.${fileExt}`
      const filePath = `compliance/${fileName}`

      const { error: uploadError } = await supabase.storage.from("compliance-images").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from("compliance-images").getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      return null
    }
  }

  const handleSubmit = async () => {
    if (!selectedCostTier) {
      toast.error("Please select a service option before submitting")
      return
    }

    setIsSubmitting(true)

    try {
      const { data: submission, error: submissionError } = await supabase
        .from("form_submissions")
        .insert({
          agent_id: agentId,
          form_id: "passport",
          form_data: {
            ...formData,
            selected_cost_tier: selectedCostTier.id,
            selected_cost: selectedCostTier.cost,
          },
          status: "Pending",
        })
        .select()
        .single()

      if (submissionError) {
        console.error("Error creating submission:", submissionError)
        throw submissionError
      }

      const imagesToInsert = []

      if (passportPhotoFile) {
        const passportPhotoUrl = await uploadImage(passportPhotoFile, "passport_photo")
        if (passportPhotoUrl) {
          imagesToInsert.push({
            submission_id: submission.id,
            image_type: "passport_photo",
            image_url: passportPhotoUrl,
          })
        }
      }

      if (idFrontFile) {
        const idFrontUrl = await uploadImage(idFrontFile, "id_front")
        if (idFrontUrl) {
          imagesToInsert.push({
            submission_id: submission.id,
            image_type: "id_front",
            image_url: idFrontUrl,
          })
        }
      }

      if (idBackFile) {
        const idBackUrl = await uploadImage(idBackFile, "id_back")
        if (idBackUrl) {
          imagesToInsert.push({
            submission_id: submission.id,
            image_type: "id_back",
            image_url: idBackUrl,
          })
        }
      }

      if (imagesToInsert.length > 0) {
        const { error: imagesError } = await supabase.from("form_images").insert(imagesToInsert)
        if (imagesError) {
          console.error("Error inserting images:", imagesError)
        }
      }

      toast.success(
        "Form submitted successfully! Your passport application has been received and will be processed.",
        { duration: 5000 }
      )
      onComplete()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to submit form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalSteps = 5

  useEffect(() => {
    setShowCostPopup(true)
  }, [])

  useEffect(() => {
    const formElement = document.querySelector("[data-form-section]")
    scrollToElement(formElement as HTMLElement)
  }, [currentStep])

  return (
    <>
      {showCostPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-2xl border-blue-300 bg-white shadow-2xl max-h-[95vh] overflow-y-auto">
            <CardHeader className="pb-3 sticky top-0 bg-white border-b-2 border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl text-blue-600">Passport Processing Options</CardTitle>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Select your preferred processing speed to continue
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PASSPORT_COST_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedCostTier(tier)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col ${
                      selectedCostTier?.id === tier.id
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-300 shadow-md"
                        : "border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-sm sm:text-base text-blue-800">{tier.description}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">{tier.days}</p>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{tier.delivery}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <span className="text-2xl sm:text-3xl font-bold text-blue-600">₵{tier.cost}</span>
                      <p className="text-xs text-gray-500 mt-1">+ ₵{COMMISSION_AMOUNT} commission</p>
                    </div>
                    {selectedCostTier?.id === tier.id && (
                      <div className="mt-3 flex items-center justify-center gap-1 bg-blue-100 py-2 rounded-md">
                        <span className="text-xs sm:text-sm font-semibold text-blue-700">✓ Selected</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-4">
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-blue-800">Fee includes:</span> Processing, registration with government authorities, and nationwide delivery to your preferred location.
                </p>
              </div>

              <Button
                onClick={() => setShowCostPopup(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 mt-4 text-sm sm:text-base"
                disabled={!selectedCostTier}
              >
                {selectedCostTier
                  ? `Continue with ₵${selectedCostTier.cost}`
                  : "Please Select an Option"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-blue-200 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <FileText className="h-5 w-5" />
            Passport Application
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {totalSteps} - Republic of Ghana
          </CardDescription>
          <div className="mt-4 w-full bg-blue-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs sm:text-sm text-amber-900">
              <span className="font-semibold">Note:</span> Form sections are not mandatory. You can skip sections or leave fields blank if you don't have the information. Our team will assist you with any missing details.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6" data-form-section>
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-800">Section A: Personal Information</h3>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Optional</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    placeholder="Enter your full name"
                  />
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
                  <Label htmlFor="place_of_birth">Place of Birth</Label>
                  <Input
                    id="place_of_birth"
                    value={formData.place_of_birth}
                    onChange={(e) => handleInputChange("place_of_birth", e.target.value)}
                    placeholder="Enter place of birth"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange("nationality", e.target.value)}
                    placeholder="Enter nationality"
                  />
                </div>
                <div>
                  <Label htmlFor="ghana_card_number">Ghana Card Number</Label>
                  <Input
                    id="ghana_card_number"
                    value={formData.ghana_card_number}
                    onChange={(e) => handleInputChange("ghana_card_number", e.target.value)}
                    placeholder="Enter Ghana card number"
                  />
                </div>
                <div>
                  <Label htmlFor="nid_number">NID Number (if applicable)</Label>
                  <Input
                    id="nid_number"
                    value={formData.nid_number}
                    onChange={(e) => handleInputChange("nid_number", e.target.value)}
                    placeholder="Enter NID number"
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Current Address */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-800">Section B: Current Address</h3>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Optional</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="current_residential_address">Residential Address</Label>
                  <Textarea
                    id="current_residential_address"
                    value={formData.current_residential_address}
                    onChange={(e) => handleInputChange("current_residential_address", e.target.value)}
                    placeholder="Enter your residential address"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="current_digital_address">Digital Address</Label>
                  <Input
                    id="current_digital_address"
                    value={formData.current_digital_address}
                    onChange={(e) => handleInputChange("current_digital_address", e.target.value)}
                    placeholder="Enter digital address"
                  />
                </div>
                <div>
                  <Label htmlFor="current_city">City</Label>
                  <Input
                    id="current_city"
                    value={formData.current_city}
                    onChange={(e) => handleInputChange("current_city", e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="current_region">Region</Label>
                  <Select
                    value={formData.current_region}
                    onValueChange={(value) => handleInputChange("current_region", value)}
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
                  <Label htmlFor="current_postal_address">Postal Address</Label>
                  <Input
                    id="current_postal_address"
                    value={formData.current_postal_address}
                    onChange={(e) => handleInputChange("current_postal_address", e.target.value)}
                    placeholder="Enter postal address"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Permanent Address & Employment */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-800">Section C: Permanent Address</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Optional</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="permanent_residential_address">Residential Address</Label>
                    <Textarea
                      id="permanent_residential_address"
                      value={formData.permanent_residential_address}
                      onChange={(e) => handleInputChange("permanent_residential_address", e.target.value)}
                      placeholder="Enter your permanent residential address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="permanent_digital_address">Digital Address</Label>
                    <Input
                      id="permanent_digital_address"
                      value={formData.permanent_digital_address}
                      onChange={(e) => handleInputChange("permanent_digital_address", e.target.value)}
                      placeholder="Enter digital address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="permanent_city">City</Label>
                    <Input
                      id="permanent_city"
                      value={formData.permanent_city}
                      onChange={(e) => handleInputChange("permanent_city", e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="permanent_region">Region</Label>
                    <Select
                      value={formData.permanent_region}
                      onValueChange={(value) => handleInputChange("permanent_region", value)}
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
                    <Label htmlFor="permanent_postal_address">Postal Address</Label>
                    <Input
                      id="permanent_postal_address"
                      value={formData.permanent_postal_address}
                      onChange={(e) => handleInputChange("permanent_postal_address", e.target.value)}
                      placeholder="Enter postal address"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-800">Section D: Employment</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Optional</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) => handleInputChange("occupation", e.target.value)}
                      placeholder="Enter your occupation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employer_name">Employer Name</Label>
                    <Input
                      id="employer_name"
                      value={formData.employer_name}
                      onChange={(e) => handleInputChange("employer_name", e.target.value)}
                      placeholder="Enter employer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employer_address">Employer Address</Label>
                    <Input
                      id="employer_address"
                      value={formData.employer_address}
                      onChange={(e) => handleInputChange("employer_address", e.target.value)}
                      placeholder="Enter employer address"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Emergency Contact & Passport Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-800">Section E: Emergency Contact</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Optional</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergency_contact_name">Full Name</Label>
                    <Input
                      id="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                    <Input
                      id="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => handleInputChange("emergency_contact_relationship", e.target.value)}
                      placeholder="Enter relationship"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_phone">Phone Number</Label>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="emergency_contact_address">Address</Label>
                    <Textarea
                      id="emergency_contact_address"
                      value={formData.emergency_contact_address}
                      onChange={(e) => handleInputChange("emergency_contact_address", e.target.value)}
                      placeholder="Enter contact address"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-800">Section F: Passport Details</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Optional</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passport_type">Passport Type</Label>
                    <Select
                      value={formData.passport_type}
                      onValueChange={(value) => handleInputChange("passport_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select passport type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="Official">Official</SelectItem>
                        <SelectItem value="Diplomatic">Diplomatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="intended_use">Intended Use</Label>
                    <Input
                      id="intended_use"
                      value={formData.intended_use}
                      onChange={(e) => handleInputChange("intended_use", e.target.value)}
                      placeholder="e.g., Business, Tourism, Education"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="travel_countries">Countries You Plan to Visit</Label>
                    <Textarea
                      id="travel_countries"
                      value={formData.travel_countries}
                      onChange={(e) => handleInputChange("travel_countries", e.target.value)}
                      placeholder="Enter countries you plan to visit"
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="signature_date">Signature Date</Label>
                    <Input
                      id="signature_date"
                      type="date"
                      value={formData.signature_date}
                      onChange={(e) => handleInputChange("signature_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Document Upload */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-800">Section G: Required Documents</h3>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Optional</span>
              </div>

              {/* Passport Photo */}
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-4">
                <Label className="text-sm font-semibold text-blue-800 block mb-3">Passport Photo</Label>
                {passportPhotoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={passportPhotoPreview}
                      alt="Passport Photo Preview"
                      className="max-w-xs h-auto rounded-lg border border-blue-200"
                    />
                    <button
                      onClick={() => removeFile("passportPhoto")}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload passport photo</p>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileChange("passportPhoto", e.target.files?.[0] || null)}
                        accept="image/*"
                      />
                    </div>
                  </label>
                )}
              </div>

              {/* ID Front */}
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-4">
                <Label className="text-sm font-semibold text-blue-800 block mb-3">ID Front</Label>
                {idFrontPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={idFrontPreview}
                      alt="ID Front Preview"
                      className="max-w-xs h-auto rounded-lg border border-blue-200"
                    />
                    <button
                      onClick={() => removeFile("idFront")}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload ID front</p>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileChange("idFront", e.target.files?.[0] || null)}
                        accept="image/*"
                      />
                    </div>
                  </label>
                )}
              </div>

              {/* ID Back */}
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-4">
                <Label className="text-sm font-semibold text-blue-800 block mb-3">ID Back</Label>
                {idBackPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={idBackPreview}
                      alt="ID Back Preview"
                      className="max-w-xs h-auto rounded-lg border border-blue-200"
                    />
                    <button
                      onClick={() => removeFile("idBack")}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload ID back</p>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileChange("idBack", e.target.files?.[0] || null)}
                        accept="image/*"
                      />
                    </div>
                  </label>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={formData.additional_notes}
                  onChange={(e) => handleInputChange("additional_notes", e.target.value)}
                  placeholder="Any additional information or special requests"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 pt-6 border-t">
            <Button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep === totalSteps ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

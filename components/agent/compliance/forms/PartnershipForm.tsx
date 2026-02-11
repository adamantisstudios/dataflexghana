"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Upload, X, Handshake, Save, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { SignatureCanvas } from "../SignatureCanvas"
import { scrollToElement } from "@/lib/scroll-utils"

interface PartnershipFormProps {
  agentId: string
  onComplete: () => void
  onCancel: () => void
}

interface PartnerData {
  tin: string
  ghanaCard: string
  title: string
  firstName: string
  middleName: string
  lastName: string
  formerName: string
  gender: string
  dateOfBirth: string
  nationality: string
  occupation: string
  houseNumber: string
  streetName: string
  city: string
  district: string
  region: string
  mobileNo1: string
  mobileNo2: string
  email: string
  signatureDataUrl?: string | null
  ghanaCardFile?: File | null
  ghanaCardPreview?: string | null
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
  "Legal",
  "Estate/Housing",
  "Media",
  "Transport/Aerospace",
  "Utilities",
  "Education",
  "Shipping & Port",
  "Fashion/Beautification",
  "Tourism",
  "Quarry/Mining",
  "Hospitality",
  "Refinery of Minerals",
  "Insurance",
  "Entertainment",
  "Healthcare",
  "Securities/Brokers",
  "Agriculture",
  "Food Industry",
  "Commerce/Trading",
  "Banking/Finance",
  "Oil/Gas",
  "Manufacturing",
  "Pharmaceutical",
  "Telecom/ICT",
  "Construction",
  "Security",
  "Sanitation",
  "Other",
]

const TITLES = ["Mr.", "Mrs.", "Ms.", "Miss", "Dr.", "Prof.", "Rev.", "Pastor", "Imam", "Chief", "Hon.", "Nana"]

const initialPartnerData = (): PartnerData => ({
  tin: "",
  ghanaCard: "",
  title: "",
  firstName: "",
  middleName: "",
  lastName: "",
  formerName: "",
  gender: "",
  dateOfBirth: "",
  nationality: "",
  occupation: "",
  houseNumber: "",
  streetName: "",
  city: "",
  district: "",
  region: "",
  mobileNo1: "",
  mobileNo2: "",
  email: "",
  signatureDataUrl: null,
  ghanaCardFile: null,
  ghanaCardPreview: null,
})

export function PartnershipForm({ agentId, onComplete, onCancel }: PartnershipFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [showCostPopup, setShowCostPopup] = useState(true)
  const formRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    partnershipName: "",
    sectors: [] as string[],
    otherSector: "",
    isicCodes: ["", "", "", "", ""],
    businessDescription: "",
    digitalAddress: "",
    houseNumber: "",
    streetName: "",
    city: "",
    district: "",
    region: "",
    sameAsBusinessAddress: true,
    registeredDigitalAddress: "",
    registeredHouseNumber: "",
    registeredStreetName: "",
    registeredCity: "",
    registeredDistrict: "",
    registeredRegion: "",
    otherDigitalAddress: "",
    otherStreetName: "",
    otherCity: "",
    otherDistrict: "",
    otherRegion: "",
    postalType: "",
    postalNumber: "",
    postalTown: "",
    postalRegion: "",
    phoneNo1: "",
    mobileNo1: "",
    email: "",
    website: "",
    partners: [initialPartnerData(), initialPartnerData()],
    assetDescription: "",
    chargeCreationDate: "",
    chargeAmount: "",
    employmentSize: "",
    revenueEnvisaged: "",
    partnershipCategory: "",
    bopRequest: "",
    bopReferenceNo: "",
  })

  useEffect(() => {
    setShowCostPopup(true)
  }, [])

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (submissionId) {
        saveProgress()
      }
    }, 30000)
    return () => clearInterval(autoSaveInterval)
  }, [formData, submissionId])

  const scrollToFormSection = () => {
    scrollToElement(formRef.current)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSectorChange = (sector: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sectors: checked ? [...prev.sectors, sector] : prev.sectors.filter((s) => s !== sector),
    }))
  }

  const updatePartnerData = (index: number, field: keyof PartnerData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      partners: prev.partners.map((partner, i) => (i === index ? { ...partner, [field]: value } : partner)),
    }))
  }

  const handlePartnerGhanaCardChange = (index: number, file: File | null) => {
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
      updatePartnerData(index, "ghanaCardFile", file)
      updatePartnerData(index, "ghanaCardPreview", reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removePartnerGhanaCard = (index: number) => {
    updatePartnerData(index, "ghanaCardFile", null)
    updatePartnerData(index, "ghanaCardPreview", null)
  }

  const addPartner = () => {
    setFormData((prev) => ({
      ...prev,
      partners: [...prev.partners, initialPartnerData()],
    }))
  }

  const removePartner = (index: number) => {
    if (formData.partners.length > 2) {
      setFormData((prev) => ({
        ...prev,
        partners: prev.partners.filter((_, i) => i !== index),
      }))
    }
  }

  const uploadImage = async (file: File | string, type: string, partnerIndex?: number): Promise<string | null> => {
    try {
      let fileToUpload: File
      if (typeof file === "string") {
        const response = await fetch(file)
        const blob = await response.blob()
        fileToUpload = new File([blob], `signature_${Date.now()}.png`, { type: "image/png" })
      } else {
        fileToUpload = file
      }
      const fileExt = fileToUpload.name.split(".").pop()
      const fileName = `${agentId}_partnership_${type}${partnerIndex !== undefined ? `_partner${partnerIndex}` : ""}_${Date.now()}.${fileExt}`
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
        const { error } = await supabase
          .from("form_submissions")
          .update({
            form_data: formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("form_submissions")
          .insert({
            agent_id: agentId,
            form_id: "partnership",
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
    console.log("[v0] Starting partnership form submission", { agentId, formData })
    setIsSubmitting(true)
    try {
      console.log("[v0] Uploading partner documents...")
      let finalSubmissionId = submissionId
      if (submissionId) {
        const { error } = await supabase
          .from("form_submissions")
          .update({
            form_data: formData,
            status: "Pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("form_submissions")
          .insert({
            agent_id: agentId,
            form_id: "partnership",
            form_data: formData,
            status: "Pending",
          })
          .select()
          .single()
        if (error) throw error
        finalSubmissionId = data.id
      }
      const imageInserts = []
      for (let i = 0; i < formData.partners.length; i++) {
        const partner = formData.partners[i]
        if (partner.signatureDataUrl) {
          const signatureUrl = await uploadImage(partner.signatureDataUrl!, "signature", i)
          if (signatureUrl) {
            imageInserts.push({
              submission_id: finalSubmissionId,
              image_type: "signature",
              image_url: signatureUrl,
              partner_index: i,
            })
          }
        }
        if (partner.ghanaCardFile) {
          const ghanaCardUrl = await uploadImage(partner.ghanaCardFile, "ghana_card", i)
          if (ghanaCardUrl) {
            imageInserts.push({
              submission_id: finalSubmissionId,
              image_type: "ghana_card_front",
              image_url: ghanaCardUrl,
              partner_index: i,
            })
          }
        }
      }
      if (imageInserts.length > 0) {
        const { error: imagesError } = await supabase.from("form_images").insert(imageInserts)
        if (imagesError) throw imagesError
      }
      console.log("[v0] Partnership form submitted successfully!")
      toast.success(
        "Partnership form submitted successfully! Your application will be processed within 14 working days.",
        { duration: 6000 },
      )
      onComplete()
    } catch (error: any) {
      console.error("[v0] Error submitting form:", error)
      const errorMessage = error?.message || "Unknown error occurred"
      toast.error(`Failed to submit form: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalSteps = 6

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

  return (
  <>
    {showCostPopup && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
        <Card className="max-w-md w-full border-emerald-300 bg-white shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Handshake className="h-6 w-6 text-emerald-600" />
              <CardTitle className="text-emerald-600">Partnership Registration Fee</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-800">Processing Cost:</span>
                <span className="text-lg font-bold text-emerald-600">1,440 GHS</span>
              </div>
              
              {/* COMMISSION SECTION ADDED HERE */}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                <span className="text-sm font-medium text-amber-700">Your Commission:</span>
                <span className="text-lg font-bold text-amber-600">50 GHS</span>
              </div>
              
              <div className="border-t border-emerald-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-emerald-700">Duration:</span>
                  <span className="text-sm font-medium text-emerald-800">14 Working Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Delivery:</span>
                  <span className="text-sm font-medium text-emerald-800">Nationwide Delivery</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              This fee covers processing, platform fees, and registration of your partnership business.
            </p>
            <Button onClick={() => setShowCostPopup(false)} className="w-full bg-emerald-600 hover:bg-emerald-700">
              I Understand, Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )}

      <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm w-full mx-0 px-0 sm:px-4">
        <CardHeader className="px-2 sm:px-6">
          <CardTitle className="text-emerald-800 flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            Partnership Registration
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {totalSteps}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-2 sm:px-6" ref={formRef}>
          {/* Step 1: Partnership & Business Details */}
          {currentStep === 1 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-emerald-800">Partnership & Business Details</h3>
              <p className="text-sm text-gray-600">
                Provide basic information about your partnership including the name and business sectors
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="partnershipName">Partnership Name *</Label>
                  <Input
                    id="partnershipName"
                    value={formData.partnershipName}
                    onChange={(e) => handleInputChange("partnershipName", e.target.value)}
                    placeholder="Enter proposed partnership name"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="block text-xs font-medium text-gray-700 mb-1">
                    Nature of Business/Sector(s) * (Select all applicable)
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                    {BUSINESS_SECTORS.map((sector) => (
                      <label
                        key={sector}
                        className="flex items-center text-xs p-1 border border-gray-100 rounded-sm hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={formData.sectors.includes(sector)}
                          onCheckedChange={(checked) => handleSectorChange(sector, checked as boolean)}
                          className="mr-1.5 h-3 w-3"
                        />
                        <span className="truncate">{sector}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.sectors.includes("Other") && (
                  <div>
                    <Label htmlFor="otherSector">Specify Other Sector</Label>
                    <Input
                      id="otherSector"
                      value={formData.otherSector}
                      onChange={(e) => handleInputChange("otherSector", e.target.value)}
                      placeholder="Please specify other sector"
                      className="w-full"
                    />
                  </div>
                )}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Principal Business Activities - ISIC Codes
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Find ISIC codes at www.orc.gov.gh. If you cannot determine codes, provide description below.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {formData.isicCodes.map((code, index) => (
                      <div key={index}>
                        <Label htmlFor={`isic_${index}`} className="text-xs">
                          ISIC {index + 1}
                        </Label>
                        <Input
                          id={`isic_${index}`}
                          value={code}
                          onChange={(e) => {
                            const newCodes = [...formData.isicCodes]
                            newCodes[index] = e.target.value
                            handleInputChange("isicCodes", newCodes)
                          }}
                          placeholder={`ISIC ${index + 1}`}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="businessDescription">Business Description (if ISIC codes unknown)</Label>
                  <Textarea
                    id="businessDescription"
                    value={formData.businessDescription}
                    onChange={(e) => handleInputChange("businessDescription", e.target.value)}
                    placeholder="Brief description of partnership's business activities"
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-emerald-800">Address Information</h3>
              <p className="text-sm text-gray-600">
                Provide your business registered office address and principal place of business
              </p>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-emerald-700 mb-3">Principal Place of Business *</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="digitalAddress">Digital Address (Ghana Post GPS) *</Label>
                    <Input
                      id="digitalAddress"
                      value={formData.digitalAddress}
                      onChange={(e) => handleInputChange("digitalAddress", e.target.value)}
                      placeholder="e.g., GA-123-4567"
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="houseNumber">House/Building/Flat *</Label>
                      <Input
                        id="houseNumber"
                        value={formData.houseNumber}
                        onChange={(e) => handleInputChange("houseNumber", e.target.value)}
                        placeholder="House number or building name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="streetName">Street Name *</Label>
                      <Input
                        id="streetName"
                        value={formData.streetName}
                        onChange={(e) => handleInputChange("streetName", e.target.value)}
                        placeholder="Street name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="City"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="district">District *</Label>
                      <Input
                        id="district"
                        value={formData.district}
                        onChange={(e) => handleInputChange("district", e.target.value)}
                        placeholder="District"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="region">Region *</Label>
                      <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
                        <SelectTrigger className="w-full">
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
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="sameAsBusinessAddress"
                    checked={formData.sameAsBusinessAddress}
                    onCheckedChange={(checked) => handleInputChange("sameAsBusinessAddress", checked)}
                  />
                  <Label htmlFor="sameAsBusinessAddress" className="cursor-pointer">
                    Registered Office same as Principal Place of Business
                  </Label>
                </div>
                {!formData.sameAsBusinessAddress && (
                  <>
                    <h4 className="font-semibold text-emerald-700 mb-3">Registered Office Address</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="registeredDigitalAddress">Digital Address *</Label>
                        <Input
                          id="registeredDigitalAddress"
                          value={formData.registeredDigitalAddress}
                          onChange={(e) => handleInputChange("registeredDigitalAddress", e.target.value)}
                          placeholder="e.g., GA-123-4567"
                          className="w-full"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="registeredHouseNumber">House/Building/Flat *</Label>
                          <Input
                            id="registeredHouseNumber"
                            value={formData.registeredHouseNumber}
                            onChange={(e) => handleInputChange("registeredHouseNumber", e.target.value)}
                            placeholder="House number or building name"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="registeredStreetName">Street Name *</Label>
                          <Input
                            id="registeredStreetName"
                            value={formData.registeredStreetName}
                            onChange={(e) => handleInputChange("registeredStreetName", e.target.value)}
                            placeholder="Street name"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="registeredCity">City *</Label>
                          <Input
                            id="registeredCity"
                            value={formData.registeredCity}
                            onChange={(e) => handleInputChange("registeredCity", e.target.value)}
                            placeholder="City"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="registeredDistrict">District *</Label>
                          <Input
                            id="registeredDistrict"
                            value={formData.registeredDistrict}
                            onChange={(e) => handleInputChange("registeredDistrict", e.target.value)}
                            placeholder="District"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="registeredRegion">Region *</Label>
                          <Select
                            value={formData.registeredRegion}
                            onValueChange={(value) => handleInputChange("registeredRegion", value)}
                          >
                            <SelectTrigger className="w-full">
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
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Contact & Postal Details */}
          {currentStep === 3 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-emerald-800">Contact & Postal Details</h3>
              <p className="text-sm text-gray-600">
                Provide postal address and contact information for your partnership
              </p>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-emerald-700 mb-3">Postal Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="postalType">Postal Type</Label>
                    <Select
                      value={formData.postalType}
                      onValueChange={(value) => handleInputChange("postalType", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select postal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P.O. Box">P.O. Box</SelectItem>
                        <SelectItem value="Private Bag">Private Bag</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="postalNumber">Postal Number</Label>
                    <Input
                      id="postalNumber"
                      value={formData.postalNumber}
                      onChange={(e) => handleInputChange("postalNumber", e.target.value)}
                      placeholder="Postal number"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalTown">Town</Label>
                    <Input
                      id="postalTown"
                      value={formData.postalTown}
                      onChange={(e) => handleInputChange("postalTown", e.target.value)}
                      placeholder="Postal town"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalRegion">Region</Label>
                    <Input
                      id="postalRegion"
                      value={formData.postalRegion}
                      onChange={(e) => handleInputChange("postalRegion", e.target.value)}
                      placeholder="Postal region"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-emerald-700 mb-3">Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="phoneNo1">Phone No. 1</Label>
                    <Input
                      id="phoneNo1"
                      value={formData.phoneNo1}
                      onChange={(e) => handleInputChange("phoneNo1", e.target.value)}
                      placeholder="Primary phone number"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobileNo1">Mobile No. 1 *</Label>
                    <Input
                      id="mobileNo1"
                      value={formData.mobileNo1}
                      onChange={(e) => handleInputChange("mobileNo1", e.target.value)}
                      placeholder="Primary mobile number"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Partnership email address"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="Partnership website (optional)"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Partners Information */}
          {currentStep === 4 && (
            <div className="space-y-6 w-full">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-emerald-800">Partners Information</h3>
                <p className="text-sm text-gray-600">
                  Minimum of 2 partners required. All partners must provide complete information and documents.
                </p>
                <Button
                  onClick={addPartner}
                  className="w-full sm:w-auto flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Partner</span>
                </Button>
              </div>

              {formData.partners.map((partner, index) => (
                <div key={index} className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-semibold text-emerald-800">Partner {index + 1}</h4>
                    {formData.partners.length > 2 && (
                      <Button
                        onClick={() => removePartner(index)}
                        variant="destructive"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remove</span>
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`tin_${index}`}>TIN</Label>
                        <Input
                          id={`tin_${index}`}
                          value={partner.tin}
                          onChange={(e) => updatePartnerData(index, "tin", e.target.value)}
                          placeholder="Taxpayer Identification Number"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`ghanaCard_${index}`}>Ghana Card No. *</Label>
                        <Input
                          id={`ghanaCard_${index}`}
                          value={partner.ghanaCard}
                          onChange={(e) => updatePartnerData(index, "ghanaCard", e.target.value)}
                          placeholder="Ghana Card number"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <Label htmlFor={`title_${index}`}>Title</Label>
                        <Select
                          value={partner.title}
                          onValueChange={(value) => updatePartnerData(index, "title", value)}
                        >
                          <SelectTrigger className="w-full">
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
                        <Label htmlFor={`firstName_${index}`}>First Name *</Label>
                        <Input
                          id={`firstName_${index}`}
                          value={partner.firstName}
                          onChange={(e) => updatePartnerData(index, "firstName", e.target.value)}
                          placeholder="First name"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`middleName_${index}`}>Middle Name</Label>
                        <Input
                          id={`middleName_${index}`}
                          value={partner.middleName}
                          onChange={(e) => updatePartnerData(index, "middleName", e.target.value)}
                          placeholder="Middle name"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`lastName_${index}`}>Last Name *</Label>
                        <Input
                          id={`lastName_${index}`}
                          value={partner.lastName}
                          onChange={(e) => updatePartnerData(index, "lastName", e.target.value)}
                          placeholder="Last name"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor={`formerName_${index}`}>Former Name</Label>
                        <Input
                          id={`formerName_${index}`}
                          value={partner.formerName}
                          onChange={(e) => updatePartnerData(index, "formerName", e.target.value)}
                          placeholder="Former name (if applicable)"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-2">Gender *</Label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`gender_${index}`}
                              value="Male"
                              checked={partner.gender === "Male"}
                              onChange={(e) => updatePartnerData(index, "gender", e.target.value)}
                              className="mr-2"
                            />
                            Male
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`gender_${index}`}
                              value="Female"
                              checked={partner.gender === "Female"}
                              onChange={(e) => updatePartnerData(index, "gender", e.target.value)}
                              className="mr-2"
                            />
                            Female
                          </label>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`dateOfBirth_${index}`}>Date of Birth *</Label>
                        <Input
                          id={`dateOfBirth_${index}`}
                          type="date"
                          value={partner.dateOfBirth}
                          onChange={(e) => updatePartnerData(index, "dateOfBirth", e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`nationality_${index}`}>Nationality *</Label>
                        <Input
                          id={`nationality_${index}`}
                          value={partner.nationality}
                          onChange={(e) => updatePartnerData(index, "nationality", e.target.value)}
                          placeholder="Nationality"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`occupation_${index}`}>Occupation *</Label>
                        <Input
                          id={`occupation_${index}`}
                          value={partner.occupation}
                          onChange={(e) => updatePartnerData(index, "occupation", e.target.value)}
                          placeholder="Occupation"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-800 mb-3">Residential Address</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`houseNumber_${index}`}>House Number</Label>
                          <Input
                            id={`houseNumber_${index}`}
                            value={partner.houseNumber}
                            onChange={(e) => updatePartnerData(index, "houseNumber", e.target.value)}
                            placeholder="House number"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`streetName_${index}`}>Street Name</Label>
                          <Input
                            id={`streetName_${index}`}
                            value={partner.streetName}
                            onChange={(e) => updatePartnerData(index, "streetName", e.target.value)}
                            placeholder="Street name"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`city_${index}`}>City *</Label>
                          <Input
                            id={`city_${index}`}
                            value={partner.city}
                            onChange={(e) => updatePartnerData(index, "city", e.target.value)}
                            placeholder="City"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`district_${index}`}>District *</Label>
                          <Input
                            id={`district_${index}`}
                            value={partner.district}
                            onChange={(e) => updatePartnerData(index, "district", e.target.value)}
                            placeholder="District"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`region_${index}`}>Region *</Label>
                          <Select
                            value={partner.region}
                            onValueChange={(value) => updatePartnerData(index, "region", value)}
                          >
                            <SelectTrigger className="w-full">
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        <div>
                          <Label htmlFor={`mobileNo1_${index}`}>Mobile No. 1 *</Label>
                          <Input
                            id={`mobileNo1_${index}`}
                            value={partner.mobileNo1}
                            onChange={(e) => updatePartnerData(index, "mobileNo1", e.target.value)}
                            placeholder="Primary mobile number"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`mobileNo2_${index}`}>Mobile No. 2</Label>
                          <Input
                            id={`mobileNo2_${index}`}
                            value={partner.mobileNo2}
                            onChange={(e) => updatePartnerData(index, "mobileNo2", e.target.value)}
                            placeholder="Secondary mobile number"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`email_${index}`}>Email</Label>
                          <Input
                            id={`email_${index}`}
                            type="email"
                            value={partner.email}
                            onChange={(e) => updatePartnerData(index, "email", e.target.value)}
                            placeholder="Partner's email"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      <div>
                        <Label className="text-base font-semibold">Signature *</Label>
                        <div className="w-full">
                          <SignatureCanvas
                            onSignatureCapture={(dataUrl) => updatePartnerData(index, "signatureDataUrl", dataUrl)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Ghana Card *</Label>
                        <div className="border-2 border-dashed border-emerald-300 rounded-lg p-3 w-full">
                          {partner.ghanaCardPreview ? (
                            <div className="relative">
                              <img
                                src={partner.ghanaCardPreview || "/placeholder.svg"}
                                alt="Ghana Card"
                                className="max-h-48 mx-auto rounded w-full object-contain"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => removePartnerGhanaCard(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center cursor-pointer py-6 w-full">
                              <Upload className="h-10 w-10 text-emerald-600 mb-2" />
                              <span className="text-sm font-medium text-emerald-600 mb-1 text-center">
                                Click to upload Ghana Card
                              </span>
                              <span className="text-xs text-gray-500 text-center">PNG, JPG up to 5MB</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePartnerGhanaCardChange(index, e.target.files?.[0] || null)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Additional Information */}
          {currentStep === 5 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-emerald-800">Additional Information</h3>
              <p className="text-sm text-gray-600">Provide MSME details and Business Operating Permit information</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employmentSize">Employment Size *</Label>
                  <Select
                    value={formData.employmentSize}
                    onValueChange={(value) => handleInputChange("employmentSize", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select employment size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1-5 employees</SelectItem>
                      <SelectItem value="6-29">6-29 employees</SelectItem>
                      <SelectItem value="30-99">30-99 employees</SelectItem>
                      <SelectItem value="100+">100+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="revenueEnvisaged">Revenue Envisaged (GHS) *</Label>
                  <Select
                    value={formData.revenueEnvisaged}
                    onValueChange={(value) => handleInputChange("revenueEnvisaged", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select revenue range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Below 500,000">Below 500,000</SelectItem>
                      <SelectItem value="500,000 - 2,000,000">500,000 - 2,000,000</SelectItem>
                      <SelectItem value="2,000,001 - 10,000,000">2,000,001 - 10,000,000</SelectItem>
                      <SelectItem value="Above 10,000,000">Above 10,000,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="partnershipCategory">Partnership Category *</Label>
                  <Select
                    value={formData.partnershipCategory}
                    onValueChange={(value) => handleInputChange("partnershipCategory", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Micro">Micro</SelectItem>
                      <SelectItem value="Small">Small</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bopRequest">Do you want to request for BOP? *</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bopRequest"
                        value="Yes"
                        checked={formData.bopRequest === "Yes"}
                        onChange={(e) => handleInputChange("bopRequest", e.target.value)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="bopRequest"
                        value="No"
                        checked={formData.bopRequest === "No"}
                        onChange={(e) => handleInputChange("bopRequest", e.target.value)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                {formData.bopRequest === "Yes" && (
                  <div>
                    <Label htmlFor="bopReferenceNo">BOP Reference No. (if available)</Label>
                    <Input
                      id="bopReferenceNo"
                      value={formData.bopReferenceNo}
                      onChange={(e) => handleInputChange("bopReferenceNo", e.target.value)}
                      placeholder="BOP reference number"
                      className="w-full"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="assetDescription">Description of Asset (Optional)</Label>
                  <Textarea
                    id="assetDescription"
                    value={formData.assetDescription}
                    onChange={(e) => handleInputChange("assetDescription", e.target.value)}
                    placeholder="Description of asset subject to charge (if applicable)"
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review & Submit */}
          {currentStep === 6 && (
            <div className="space-y-6 w-full">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Your Partnership Registration</h3>
                <p className="text-gray-600 mb-6">
                  Please review all the information you've provided. When you click submit, your partnership
                  registration will be sent to our admin team for processing.
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-emerald-800 mb-3">✅ Submission Checklist</h4>
                <ul className="text-emerald-700 text-sm space-y-2">
                  <li>✓ Partnership name and business sectors provided</li>
                  <li>✓ Business and registered office addresses completed</li>
                  <li>✓ Contact and postal details provided</li>
                  <li>✓ All partners' information and documents uploaded</li>
                  <li>✓ Each partner has provided signature and Ghana Card</li>
                  <li>✓ Additional information and MSME classification completed</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-blue-800 mb-2">📋 Processing Information</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Processing time: 14 Working Days</li>
                  <li>• Cost: 1,410 GHS</li>
                  <li>• Delivery: Nationwide Delivery</li>
                  <li>• Your admin will review and contact you with updates</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-emerald-200 w-full">
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

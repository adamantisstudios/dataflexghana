"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Upload, X, Building2, Save, Check, RotateCcw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { SignatureCanvas } from "../SignatureCanvas"
import { scrollToElement } from "@/lib/scroll-utils"

interface CompanySharesFormProps {
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

interface PersonData {
  title: string
  first_name: string
  middle_name: string
  last_name: string
  gender: string
  date_of_birth: string
  nationality: string
  occupation: string
  tin_number: string
  ghana_card_number: string
  residential_digital_address: string
  residential_house_number: string
  residential_street_name: string
  residential_city: string
  residential_district: string
  residential_region: string
  residential_country: string
  signature_data_url?: string
  ghana_card_file?: File
}

const initialPersonData = (): PersonData => ({
  title: "",
  first_name: "",
  middle_name: "",
  last_name: "",
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
})

export function CompanySharesForm({ agentId, onComplete, onCancel }: CompanySharesFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [showCostPopup, setShowCostPopup] = useState(true)
  const formRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    company_name: "",
    presented_by: "",
    nature_of_business: "",
    objectives: "",
    stated_capital: "100",
    digital_address: "",
    house_number: "",
    street_name: "",
    city_district: "",
    contact_info: "",
    employment_size: "",
    revenue_envisaged: "",
    bop_application: "",
    bop_reference_number: "",
    director1: initialPersonData(),
    director2: initialPersonData(),
    secretary: initialPersonData(),
    subscriber1: initialPersonData(),
    subscriber2: initialPersonData(),
  })

  const [personSignatures, setPersonSignatures] = useState<Record<string, string>>({})
  const [personGhanaCards, setPersonGhanaCards] = useState<Record<string, { file: File; preview: string }>>({})

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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePersonChange = (person: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [person]: { ...prev[person as keyof typeof prev], [field]: value },
    }))
  }

  const handleGhanaCardChange = (person: string, file: File | null) => {
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
      setPersonGhanaCards((prev) => ({
        ...prev,
        [person]: { file, preview: reader.result as string },
      }))
    }
    reader.readAsDataURL(file)
  }

  const removeGhanaCard = (person: string) => {
    setPersonGhanaCards((prev) => {
      const updated = { ...prev }
      delete updated[person]
      return updated
    })
  }

  const uploadImage = async (file: File | string, type: string, personIndex?: string): Promise<string | null> => {
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
      const fileName = `${agentId}_${type}${personIndex ? `_${personIndex}` : ""}_${Date.now()}.${fileExt}`
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
            form_id: "company-shares",
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
    setIsSubmitting(true)
    try {
      const uploadedImages = []
      const people = ["director1", "director2", "secretary", "subscriber1", "subscriber2"]

      for (const person of people) {
        if (personSignatures[person]) {
          const signatureUrl = await uploadImage(personSignatures[person], "signature", person)
          if (signatureUrl) {
            uploadedImages.push({
              submission_id: "",
              image_type: "signature",
              image_url: signatureUrl,
              person_index: person,
            })
          }
        }
        if (personGhanaCards[person]) {
          const ghanaCardUrl = await uploadImage(personGhanaCards[person].file, "ghana_card", person)
          if (ghanaCardUrl) {
            uploadedImages.push({
              submission_id: "",
              image_type: "ghana_card",
              image_url: ghanaCardUrl,
              person_index: person,
            })
          }
        }
      }

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
            form_id: "company-shares",
            form_data: formData,
            status: "Pending",
          })
          .select()
          .single()
        if (error) throw error
        finalSubmissionId = data.id
      }

      if (uploadedImages.length > 0) {
        const imagesToInsert = uploadedImages.map((img) => ({
          submission_id: finalSubmissionId,
          image_type: img.image_type,
          image_url: img.image_url,
          person_index: img.person_index,
        }))
        const { error: imagesError } = await supabase.from("form_images").insert(imagesToInsert)
        if (imagesError) throw imagesError
      }

      toast.success(
        "Form submitted successfully! Your Company Limited by Shares application will be processed within 14 working days.",
        { duration: 6000 },
      )
      onComplete()
    } catch (error: any) {
      console.error("Error submitting form:", error)
      toast.error(`Failed to submit form: ${error?.message || "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPersonForm = (person: string, title: string) => (
    <div className="space-y-6 w-full" ref={formRef}>
      <h3 className="text-lg font-semibold text-blue-800">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${person}_title`} className="text-xs font-medium">
            Title *
          </Label>
          <Select
            value={formData[person as keyof typeof formData]?.title || ""}
            onValueChange={(value) => handlePersonChange(person, "title", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              {TITLES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${person}_first_name`} className="text-xs font-medium">
            First Name *
          </Label>
          <Input
            id={`${person}_first_name`}
            value={formData[person as keyof typeof formData]?.first_name || ""}
            onChange={(e) => handlePersonChange(person, "first_name", e.target.value)}
            placeholder="Enter first name"
            className="text-xs"
          />
        </div>
        <div>
          <Label htmlFor={`${person}_middle_name`} className="text-xs font-medium">
            Middle Name
          </Label>
          <Input
            id={`${person}_middle_name`}
            value={formData[person as keyof typeof formData]?.middle_name || ""}
            onChange={(e) => handlePersonChange(person, "middle_name", e.target.value)}
            placeholder="Enter middle name"
            className="text-xs"
          />
        </div>
        <div>
          <Label htmlFor={`${person}_last_name`} className="text-xs font-medium">
            Last Name/Surname *
          </Label>
          <Input
            id={`${person}_last_name`}
            value={formData[person as keyof typeof formData]?.last_name || ""}
            onChange={(e) => handlePersonChange(person, "last_name", e.target.value)}
            placeholder="Enter last name"
            className="text-xs"
          />
        </div>
        <div>
          <Label htmlFor={`${person}_gender`} className="text-xs font-medium">
            Gender *
          </Label>
          <Select
            value={formData[person as keyof typeof formData]?.gender || ""}
            onValueChange={(value) => handlePersonChange(person, "gender", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male" className="text-xs">
                Male
              </SelectItem>
              <SelectItem value="Female" className="text-xs">
                Female
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${person}_date_of_birth`} className="text-xs font-medium">
            Date of Birth *
          </Label>
          <Input
            id={`${person}_date_of_birth`}
            type="date"
            value={formData[person as keyof typeof formData]?.date_of_birth || ""}
            onChange={(e) => handlePersonChange(person, "date_of_birth", e.target.value)}
            className="text-xs"
          />
        </div>
        <div>
          <Label htmlFor={`${person}_nationality`} className="text-xs font-medium">
            Nationality *
          </Label>
          <Input
            id={`${person}_nationality`}
            value={formData[person as keyof typeof formData]?.nationality || ""}
            onChange={(e) => handlePersonChange(person, "nationality", e.target.value)}
            placeholder="Ghanaian"
            className="text-xs"
          />
        </div>
        <div>
          <Label htmlFor={`${person}_occupation`} className="text-xs font-medium">
            Occupation *
          </Label>
          <Input
            id={`${person}_occupation`}
            value={formData[person as keyof typeof formData]?.occupation || ""}
            onChange={(e) => handlePersonChange(person, "occupation", e.target.value)}
            placeholder="Enter occupation"
            className="text-xs"
          />
        </div>
        <div>
          <Label htmlFor={`${person}_tin_number`} className="text-xs font-medium">
            TIN (Tax Identification Number)
          </Label>
          <Input
            id={`${person}_tin_number`}
            value={formData[person as keyof typeof formData]?.tin_number || ""}
            onChange={(e) => handlePersonChange(person, "tin_number", e.target.value)}
            placeholder="Enter TIN if available"
            className="text-xs"
          />
        </div>
        <div>
          <Label htmlFor={`${person}_ghana_card_number`} className="text-xs font-medium">
            Ghana Card Number *
          </Label>
          <Input
            id={`${person}_ghana_card_number`}
            value={formData[person as keyof typeof formData]?.ghana_card_number || ""}
            onChange={(e) => handlePersonChange(person, "ghana_card_number", e.target.value)}
            placeholder="GHA-XXXXXXXXX-X"
            className="text-xs"
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-6">
        <h4 className="font-semibold text-blue-700 mb-3 text-sm">Residential Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor={`${person}_residential_digital_address`} className="text-xs font-medium">
              Digital Address (Ghana Post GPS) *
            </Label>
            <Input
              id={`${person}_residential_digital_address`}
              value={formData[person as keyof typeof formData]?.residential_digital_address || ""}
              onChange={(e) => handlePersonChange(person, "residential_digital_address", e.target.value)}
              placeholder="GX-XXX-XXXX"
              className="text-xs"
            />
          </div>
          <div>
            <Label htmlFor={`${person}_residential_house_number`} className="text-xs font-medium">
              House Number/Building Name *
            </Label>
            <Input
              id={`${person}_residential_house_number`}
              value={formData[person as keyof typeof formData]?.residential_house_number || ""}
              onChange={(e) => handlePersonChange(person, "residential_house_number", e.target.value)}
              placeholder="Enter house number"
              className="text-xs"
            />
          </div>
          <div>
            <Label htmlFor={`${person}_residential_street_name`} className="text-xs font-medium">
              Street Name *
            </Label>
            <Input
              id={`${person}_residential_street_name`}
              value={formData[person as keyof typeof formData]?.residential_street_name || ""}
              onChange={(e) => handlePersonChange(person, "residential_street_name", e.target.value)}
              placeholder="Enter street name"
              className="text-xs"
            />
          </div>
          <div>
            <Label htmlFor={`${person}_residential_city`} className="text-xs font-medium">
              City/Town *
            </Label>
            <Input
              id={`${person}_residential_city`}
              value={formData[person as keyof typeof formData]?.residential_city || ""}
              onChange={(e) => handlePersonChange(person, "residential_city", e.target.value)}
              placeholder="Enter city/town"
              className="text-xs"
            />
          </div>
          <div>
            <Label htmlFor={`${person}_residential_district`} className="text-xs font-medium">
              District *
            </Label>
            <Input
              id={`${person}_residential_district`}
              value={formData[person as keyof typeof formData]?.residential_district || ""}
              onChange={(e) => handlePersonChange(person, "residential_district", e.target.value)}
              placeholder="Enter district"
              className="text-xs"
            />
          </div>
          <div>
            <Label htmlFor={`${person}_residential_region`} className="text-xs font-medium">
              Region *
            </Label>
            <Select
              value={formData[person as keyof typeof formData]?.residential_region || ""}
              onValueChange={(value) => handlePersonChange(person, "residential_region", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {GHANA_REGIONS.map((region) => (
                  <SelectItem key={region} value={region} className="text-xs">
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`${person}_residential_country`} className="text-xs font-medium">
              Country *
            </Label>
            <Input
              id={`${person}_residential_country`}
              value={formData[person as keyof typeof formData]?.residential_country || ""}
              onChange={(e) => handlePersonChange(person, "residential_country", e.target.value)}
              placeholder="Ghana"
              className="text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const totalSteps = 8

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
        <Card className="max-w-md w-full border-blue-300 bg-white shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-blue-600">Company Limited by Shares Processing Fee</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Processing Cost:</span>
                <span className="text-lg font-bold text-blue-600">1,930 GHS</span>
              </div>
              
              {/* COMMISSION SECTION ADDED HERE */}
              <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                <span className="text-sm font-medium text-amber-700">Your Commission:</span>
                <span className="text-lg font-bold text-amber-600">70 GHS</span>
              </div>
              
              <div className="border-t border-blue-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-700">Duration:</span>
                  <span className="text-sm font-medium text-blue-800">14 Working Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Delivery:</span>
                  <span className="text-sm font-medium text-blue-800">Nationwide Delivery</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              This fee covers processing, platform fees, and registration of your company limited by shares.
            </p>
            <Button onClick={() => setShowCostPopup(false)} className="w-full bg-blue-600 hover:bg-blue-700">
              I Understand, Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )}

      <Card className="border-blue-200 bg-white/90 backdrop-blur-sm w-full mx-0 px-0 sm:px-2">
        <CardHeader className="px-2 sm:px-6">
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Limited by Shares Registration
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {totalSteps}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-2 sm:px-4" ref={formRef}>
          <div data-form-section>
            {/* Step 1: Company Details */}
            {currentStep === 1 && (
              <div className="space-y-6 w-full">
                <h3 className="text-lg font-semibold text-blue-800">Company Details</h3>
                <p className="text-sm text-gray-600">
                  Provide basic information about your company including the name, business nature, and objectives
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company_name" className="text-xs font-medium">
                      Company Name *
                    </Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange("company_name", e.target.value)}
                      placeholder="Enter the full company name"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="presented_by" className="text-xs font-medium">
                      Presented By *
                    </Label>
                    <Input
                      id="presented_by"
                      value={formData.presented_by}
                      onChange={(e) => handleInputChange("presented_by", e.target.value)}
                      placeholder="Name of person submitting this form"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nature_of_business" className="text-xs font-medium">
                      Nature of Business/Sector(s) *
                    </Label>
                    <Select
                      value={formData.nature_of_business}
                      onValueChange={(value) => handleInputChange("nature_of_business", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select business sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_SECTORS.map((sector) => (
                          <SelectItem key={sector} value={sector} className="text-xs">
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="objectives" className="text-xs font-medium">
                      Objectives of Company *
                    </Label>
                    <Textarea
                      id="objectives"
                      value={formData.objectives}
                      onChange={(e) => handleInputChange("objectives", e.target.value)}
                      placeholder="Describe the main objectives and purposes of the company..."
                      rows={4}
                      className="w-full text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="digital_address" className="text-xs font-medium">
                        Digital Address (Ghana Post GPS) *
                      </Label>
                      <Input
                        id="digital_address"
                        value={formData.digital_address}
                        onChange={(e) => handleInputChange("digital_address", e.target.value)}
                        placeholder="GX-XXX-XXXX"
                        className="w-full text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="house_number" className="text-xs font-medium">
                        House Number/Landmark
                      </Label>
                      <Input
                        id="house_number"
                        value={formData.house_number}
                        onChange={(e) => handleInputChange("house_number", e.target.value)}
                        placeholder="House number or landmark"
                        className="w-full text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="street_name" className="text-xs font-medium">
                        Street Name
                      </Label>
                      <Input
                        id="street_name"
                        value={formData.street_name}
                        onChange={(e) => handleInputChange("street_name", e.target.value)}
                        placeholder="Street name"
                        className="w-full text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city_district" className="text-xs font-medium">
                        City/District *
                      </Label>
                      <Input
                        id="city_district"
                        value={formData.city_district}
                        onChange={(e) => handleInputChange("city_district", e.target.value)}
                        placeholder="City or district"
                        className="w-full text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contact_info" className="text-xs font-medium">
                      P.O.Box/Email/Phone *
                    </Label>
                    <Input
                      id="contact_info"
                      value={formData.contact_info}
                      onChange={(e) => handleInputChange("contact_info", e.target.value)}
                      placeholder="Contact information"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stated_capital" className="text-xs font-medium">
                      Stated Capital (GHS) *
                    </Label>
                    <Input
                      id="stated_capital"
                      type="number"
                      value={formData.stated_capital}
                      onChange={(e) => handleInputChange("stated_capital", e.target.value)}
                      placeholder="100"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Steps 2-6: Directors, Secretary, Subscribers */}
            {currentStep === 2 && renderPersonForm("director1", "Director 1")}
            {currentStep === 3 && renderPersonForm("director2", "Director 2")}
            {currentStep === 4 && renderPersonForm("secretary", "Secretary")}
            {currentStep === 5 && renderPersonForm("subscriber1", "Subscriber 1")}
            {currentStep === 6 && renderPersonForm("subscriber2", "Subscriber 2")}

            {/* Step 7: Additional Information */}
            {currentStep === 7 && (
              <div className="space-y-6 w-full">
                <h3 className="text-lg font-semibold text-blue-800">Additional Information</h3>
                <p className="text-sm text-gray-600">Provide MSME details, Business Operating Permit information</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="employment_size" className="text-xs font-medium">
                      Employment Size *
                    </Label>
                    <Select
                      value={formData.employment_size}
                      onValueChange={(value) => handleInputChange("employment_size", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select employment size" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_SIZES.map((size) => (
                          <SelectItem key={size} value={size} className="text-xs">
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="revenue_envisaged" className="text-xs font-medium">
                      Revenue Envisaged (GHS) *
                    </Label>
                    <Select
                      value={formData.revenue_envisaged}
                      onValueChange={(value) => handleInputChange("revenue_envisaged", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select revenue range" />
                      </SelectTrigger>
                      <SelectContent>
                        {REVENUE_RANGES.map((range) => (
                          <SelectItem key={range} value={range} className="text-xs">
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bop_application" className="text-xs font-medium">
                      Business Operating Permit (BOP) Application *
                    </Label>
                    <Select
                      value={formData.bop_application}
                      onValueChange={(value) => handleInputChange("bop_application", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select BOP option" />
                      </SelectTrigger>
                      <SelectContent>
                        {BOP_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option} className="text-xs">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.bop_application === "Already have a BOP" && (
                    <div>
                      <Label htmlFor="bop_reference_number" className="text-xs font-medium">
                        BOP Reference Number
                      </Label>
                      <Input
                        id="bop_reference_number"
                        value={formData.bop_reference_number}
                        onChange={(e) => handleInputChange("bop_reference_number", e.target.value)}
                        placeholder="Enter BOP reference number"
                        className="w-full text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 8: Documents (Signatures & Ghana Cards) */}
            {currentStep === 8 && (
              <div className="space-y-6 w-full">
                <h3 className="text-lg font-semibold text-blue-800">Documents & Signatures</h3>
                <p className="text-sm text-gray-600">
                  Capture signatures and upload Ghana Cards for all directors, secretary, and subscribers
                </p>

                {["director1", "director2", "secretary", "subscriber1", "subscriber2"].map((person) => (
                  <div key={person} className="border-t pt-6 mt-4">
                    <h4 className="font-semibold text-blue-700 mb-4 text-sm">
                      {person
                        .replace(/([0-9])/g, " $1")
                        .trim()
                        .toUpperCase()}
                    </h4>

                    {/* Signature Section - Full Width */}
                    <div className="mb-6">
                      <Label className="text-sm font-medium mb-2 block">Signature *</Label>
                      {personSignatures[person] ? (
                        <div className="w-full border-2 border-green-300 rounded-lg p-4 bg-green-50">
                          <div className="text-sm text-green-600 font-medium mb-2 flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Signature captured
                          </div>
                          <div className="w-full h-48 flex items-center justify-center bg-white rounded mb-4">
                            <img
                              src={personSignatures[person] || "/placeholder.svg"}
                              alt={`${person} signature`}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const updated = { ...personSignatures }
                              delete updated[person]
                              setPersonSignatures(updated)
                            }}
                            className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 text-xs"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Redo Signature
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full border rounded-lg p-2 bg-gray-50">
                          <SignatureCanvas
                            onSignatureCapture={(dataUrl) =>
                              setPersonSignatures((prev) => ({ ...prev, [person]: dataUrl }))
                            }
                            canvasClassName="w-full h-48 border-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Ghana Card Upload Section - Full Width */}
                    <div className="mb-6">
                      <Label className="text-sm font-medium mb-2 block">Ghana Card *</Label>
                      <div className="w-full border-2 border-dashed border-blue-300 rounded-lg p-4">
                        {personGhanaCards[person] ? (
                          <div className="relative">
                            <div className="w-full h-48 flex items-center justify-center mb-4">
                              <img
                                src={personGhanaCards[person].preview || "/placeholder.svg"}
                                alt={`${person} Ghana Card`}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => removeGhanaCard(person)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center cursor-pointer py-6 w-full">
                            <Upload className="h-10 w-10 text-blue-600 mb-3" />
                            <span className="text-sm font-medium text-blue-600 mb-1 text-center">
                              Click to upload Ghana Card
                            </span>
                            <span className="text-xs text-gray-500 text-center">PNG, JPG up to 5MB</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleGhanaCardChange(person, e.target.files?.[0] || null)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-blue-200 w-full">
            <Button
              variant="outline"
              onClick={prevStep}
              className="w-full sm:w-auto border-blue-300 text-blue-600 hover:bg-blue-50 text-xs bg-transparent"
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
                  className="w-full sm:w-auto border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent text-xs"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Progress"}
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-xs"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-xs"
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

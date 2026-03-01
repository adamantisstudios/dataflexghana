"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Upload, X, Baby } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { scrollToElement } from "@/lib/scroll-utils"

interface BirthCertificateFormProps {
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

const BIRTH_CERT_COST_TIERS: CostTier[] = [
  {
    id: "express",
    days: "7 Days",
    cost: 960,
    delivery: "Nationwide Delivery",
    description: "Express Processing",
  },
  {
    id: "standard",
    days: "14 Days",
    cost: 660,
    delivery: "Nationwide Delivery",
    description: "Standard Processing",
  },
  {
    id: "economy",
    days: "1 Month",
    cost: 500,
    delivery: "Nationwide Delivery",
    description: "Economy Processing",
  },
]

const COMMISSION_AMOUNT = 50
const GHANA_REGIONS = [
  "Greater Accra Region", "Ashanti Region", "Western Region", "Eastern Region",
  "Volta Region", "Northern Region", "Upper East Region", "Upper West Region",
  "Central Region", "Bono Region", "Bono East Region", "Ahafo Region",
  "Savannah Region", "North East Region", "Oti Region", "Western North Region",
]

const BIRTH_TYPES = ["Single", "Twin", "Triplet", "Multiple Birth"]
const PLACE_OF_DELIVERY = ["Hospital", "Clinic", "Mat Home", "House", "Other"]
const ATTENDANT_AT_BIRTH = ["Doctor", "Registered Midwife", "TBA", "Other"]
const EDUCATION_LEVELS = [
  "None", "Primary", "Middle/JHS", "Secondary/SHS/Tech Vocational",
  "Tertiary (Teacher Training/Poly/University)",
]
const MARITAL_STATUS = ["Married", "Single", "Divorced", "Widowed"]
const RELATIONSHIP_TO_CHILD = [
  "Mother", "Father", "Guardian", "Grandparent", "Other Relative",
  "Hospital Staff", "Other",
]

export function BirthCertificateForm({ agentId, onComplete, onCancel }: BirthCertificateFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCostPopup, setShowCostPopup] = useState(true)
  const [selectedCostTier, setSelectedCostTier] = useState<CostTier | null>(null)
  const [isFormFilled, setIsFormFilled] = useState(false)

  const [formData, setFormData] = useState({
    registry_code: "",
    serial_number: "",
    child_first_name: "",
    child_middle_name: "",
    child_surname: "",
    sex: "",
    date_of_birth: "",
    nid_number: "",
    type_of_birth: "",
    place_of_delivery: "",
    place_of_delivery_other: "",
    attendant_at_birth: "",
    attendant_at_birth_other: "",
    hospital_name: "",
    house_number: "",
    street_name: "",
    town: "",
    district: "",
    region: "",
    mother_first_name: "",
    mother_middle_name: "",
    mother_surname: "",
    mother_age: "",
    mother_nationality: "",
    mother_nid: "",
    mother_house_no: "",
    mother_street_name: "",
    mother_town: "",
    mother_district: "",
    mother_region: "",
    mother_education: "",
    mother_marital_status: "",
    mother_occupation: "",
    mother_religion: "",
    mother_residential_address: "",
    father_first_name: "",
    father_middle_name: "",
    father_surname: "",
    father_age: "",
    father_nationality: "",
    father_nid: "",
    father_occupation: "",
    father_residential_address: "",
    urgent_processing: false,
    urgency_reason: "",
    additional_notes: "",
    informant_full_name: "",
    informant_relationship: "",
    informant_phone: "",
    informant_date: "",
    informant_address: "",
  })

  const [motherIdFrontFile, setMotherIdFrontFile] = useState<File | null>(null)
  const [motherIdFrontPreview, setMotherIdFrontPreview] = useState<string | null>(null)
  const [motherIdBackFile, setMotherIdBackFile] = useState<File | null>(null)
  const [motherIdBackPreview, setMotherIdBackPreview] = useState<string | null>(null)
  const [fatherIdFrontFile, setFatherIdFrontFile] = useState<File | null>(null)
  const [fatherIdFrontPreview, setFatherIdFrontPreview] = useState<string | null>(null)
  const [fatherIdBackFile, setFatherIdBackFile] = useState<File | null>(null)
  const [fatherIdBackPreview, setFatherIdBackPreview] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    checkIfFormFilled()
  }

  const checkIfFormFilled = () => {
    const hasEssentialData =
      formData.child_first_name.trim() !== "" &&
      formData.child_surname.trim() !== "" &&
      formData.mother_first_name.trim() !== ""
    setIsFormFilled(hasEssentialData)
  }

  const handleFileChange = (
    type: "motherIdFront" | "motherIdBack" | "fatherIdFront" | "fatherIdBack",
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
      if (type === "motherIdFront") {
        setMotherIdFrontFile(file)
        setMotherIdFrontPreview(reader.result as string)
      } else if (type === "motherIdBack") {
        setMotherIdBackFile(file)
        setMotherIdBackPreview(reader.result as string)
      } else if (type === "fatherIdFront") {
        setFatherIdFrontFile(file)
        setFatherIdFrontPreview(reader.result as string)
      } else {
        setFatherIdBackFile(file)
        setFatherIdBackPreview(reader.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeFile = (type: "motherIdFront" | "motherIdBack" | "fatherIdFront" | "fatherIdBack") => {
    if (type === "motherIdFront") {
      setMotherIdFrontFile(null)
      setMotherIdFrontPreview(null)
    } else if (type === "motherIdBack") {
      setMotherIdBackFile(null)
      setMotherIdBackPreview(null)
    } else if (type === "fatherIdFront") {
      setFatherIdFrontFile(null)
      setFatherIdFrontPreview(null)
    } else {
      setFatherIdBackFile(null)
      setFatherIdBackPreview(null)
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
          form_id: "birth-certificate",
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

      if (motherIdFrontFile) {
        const motherIdFrontUrl = await uploadImage(motherIdFrontFile, "mother_id_front")
        if (motherIdFrontUrl) {
          imagesToInsert.push({
            submission_id: submission.id,
            image_type: "mother_id_front",
            image_url: motherIdFrontUrl,
          })
        }
      }

      if (motherIdBackFile) {
        const motherIdBackUrl = await uploadImage(motherIdBackFile, "mother_id_back")
        if (motherIdBackUrl) {
          imagesToInsert.push({
            submission_id: submission.id,
            image_type: "mother_id_back",
            image_url: motherIdBackUrl,
          })
        }
      }

      if (fatherIdFrontFile) {
        const fatherIdFrontUrl = await uploadImage(fatherIdFrontFile, "father_id_front")
        if (fatherIdFrontUrl) {
          imagesToInsert.push({
            submission_id: submission.id,
            image_type: "father_id_front",
            image_url: fatherIdFrontUrl,
          })
        }
      }

      if (fatherIdBackFile) {
        const fatherIdBackUrl = await uploadImage(fatherIdBackFile, "father_id_back")
        if (fatherIdBackUrl) {
          imagesToInsert.push({
            submission_id: submission.id,
            image_type: "father_id_back",
            image_url: fatherIdBackUrl,
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
        "Form submitted successfully! Your Birth Certificate application has been received and will be processed.",
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <Card className="relative max-w-sm w-full border-emerald-300 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowCostPopup(false)}
              className="absolute right-2 top-2 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <CardHeader className="p-3 pb-1">
              <div className="flex items-start gap-2">
                <Baby className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <CardTitle className="text-emerald-600 text-base">Birth Certificate</CardTitle>
                  <p className="text-xs text-gray-600 mt-0.5">Select processing option</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="space-y-2">
                <p className="text-xs text-gray-700 font-medium">Choose your speed:</p>
                {BIRTH_CERT_COST_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedCostTier(tier)}
                    className={`p-2 rounded border-2 cursor-pointer transition-all ${
                      selectedCostTier?.id === tier.id
                        ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-300"
                        : "border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-emerald-800 text-sm truncate">{tier.description}</h4>
                        <p className="text-xs text-gray-600">{tier.days}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-bold text-emerald-600">₵{tier.cost}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-600">{tier.delivery}</span>
                      {selectedCostTier?.id === tier.id && (
                        <span className="text-emerald-700 font-medium">✓ Selected</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">+ ₵{COMMISSION_AMOUNT} commission</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Fee covers processing and registration. Delivery nationwide.
              </p>

              <Button
                onClick={() => setShowCostPopup(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 h-auto"
                disabled={!selectedCostTier}
              >
                {selectedCostTier
                  ? `Continue (₵${selectedCostTier.cost} + ₵${COMMISSION_AMOUNT})`
                  : "Select an Option"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-emerald-800 flex items-center gap-2">
            <Baby className="h-5 w-5" />
            Birth Certificate Application (Form A)
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {totalSteps} - Republic of Ghana
          </CardDescription>
          <div className="mt-4 w-full bg-emerald-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6" data-form-section>
          {/* Step 1: Child Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-800">Section A: Particulars of Child</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="registry_code">Registry Code</Label>
                  <Input
                    id="registry_code"
                    value={formData.registry_code}
                    onChange={(e) => handleInputChange("registry_code", e.target.value)}
                    placeholder="Leave blank if unknown"
                  />
                </div>
                <div>
                  <Label htmlFor="serial_number">Serial Number in Register</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => handleInputChange("serial_number", e.target.value)}
                    placeholder="Leave blank if unknown"
                  />
                </div>
                <div>
                  <Label htmlFor="child_first_name">First Name *</Label>
                  <Input
                    id="child_first_name"
                    value={formData.child_first_name}
                    onChange={(e) => handleInputChange("child_first_name", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="child_middle_name">Middle Name</Label>
                  <Input
                    id="child_middle_name"
                    value={formData.child_middle_name}
                    onChange={(e) => handleInputChange("child_middle_name", e.target.value)}
                    placeholder="Enter middle name"
                  />
                </div>
                <div>
                  <Label htmlFor="child_surname">Surname *</Label>
                  <Input
                    id="child_surname"
                    value={formData.child_surname}
                    onChange={(e) => handleInputChange("child_surname", e.target.value)}
                    placeholder="Enter surname"
                  />
                </div>
                <div>
                  <Label htmlFor="sex">Sex *</Label>
                  <Select value={formData.sex} onValueChange={(value) => handleInputChange("sex", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
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
                  <Label htmlFor="nid_number">NID No. (if applicable)</Label>
                  <Input
                    id="nid_number"
                    value={formData.nid_number}
                    onChange={(e) => handleInputChange("nid_number", e.target.value)}
                    placeholder="For children 15 years and above"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="type_of_birth">Type of Birth</Label>
                  <Select
                    value={formData.type_of_birth}
                    onValueChange={(value) => handleInputChange("type_of_birth", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type of birth" />
                    </SelectTrigger>
                    <SelectContent>
                      {BIRTH_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Place of Delivery */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-800">Place of Delivery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="place_of_delivery">Place of Delivery *</Label>
                  <Select
                    value={formData.place_of_delivery}
                    onValueChange={(value) => handleInputChange("place_of_delivery", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select place" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLACE_OF_DELIVERY.map((place) => (
                        <SelectItem key={place} value={place}>
                          {place}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.place_of_delivery === "Other" && (
                  <div>
                    <Label htmlFor="place_of_delivery_other">Specify Other</Label>
                    <Input
                      id="place_of_delivery_other"
                      value={formData.place_of_delivery_other}
                      onChange={(e) => handleInputChange("place_of_delivery_other", e.target.value)}
                      placeholder="Specify place"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="attendant_at_birth">Attendant at Birth *</Label>
                  <Select
                    value={formData.attendant_at_birth}
                    onValueChange={(value) => handleInputChange("attendant_at_birth", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select attendant" />
                    </SelectTrigger>
                    <SelectContent>
                      {ATTENDANT_AT_BIRTH.map((attendant) => (
                        <SelectItem key={attendant} value={attendant}>
                          {attendant}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.attendant_at_birth === "Other" && (
                  <div>
                    <Label htmlFor="attendant_at_birth_other">Specify Other</Label>
                    <Input
                      id="attendant_at_birth_other"
                      value={formData.attendant_at_birth_other}
                      onChange={(e) => handleInputChange("attendant_at_birth_other", e.target.value)}
                      placeholder="Specify attendant"
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-emerald-700 mb-3">Detailed Address of Place of Delivery</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="hospital_name">Name of Hospital/Clinic/Maternity Home</Label>
                    <Input
                      id="hospital_name"
                      value={formData.hospital_name}
                      onChange={(e) => handleInputChange("hospital_name", e.target.value)}
                      placeholder="Enter facility name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="house_number">House Number</Label>
                    <Input
                      id="house_number"
                      value={formData.house_number}
                      onChange={(e) => handleInputChange("house_number", e.target.value)}
                      placeholder="Enter house number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="street_name">Street Name</Label>
                    <Input
                      id="street_name"
                      value={formData.street_name}
                      onChange={(e) => handleInputChange("street_name", e.target.value)}
                      placeholder="Enter street name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="town">Town *</Label>
                    <Input
                      id="town"
                      value={formData.town}
                      onChange={(e) => handleInputChange("town", e.target.value)}
                      placeholder="Enter town"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">District *</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => handleInputChange("district", e.target.value)}
                      placeholder="Enter district"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="region">Region *</Label>
                    <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
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
              </div>
            </div>
          )}

          {/* Step 3: Mother Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-800">Section B: Particulars of Mother</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mother_first_name">First Name *</Label>
                  <Input
                    id="mother_first_name"
                    value={formData.mother_first_name}
                    onChange={(e) => handleInputChange("mother_first_name", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="mother_middle_name">Middle Name</Label>
                  <Input
                    id="mother_middle_name"
                    value={formData.mother_middle_name}
                    onChange={(e) => handleInputChange("mother_middle_name", e.target.value)}
                    placeholder="Enter middle name"
                  />
                </div>
                <div>
                  <Label htmlFor="mother_surname">Surname (Maiden Name) *</Label>
                  <Input
                    id="mother_surname"
                    value={formData.mother_surname}
                    onChange={(e) => handleInputChange("mother_surname", e.target.value)}
                    placeholder="Enter surname"
                  />
                </div>
                <div>
                  <Label htmlFor="mother_age">Age (in completed years) *</Label>
                  <Input
                    id="mother_age"
                    type="number"
                    value={formData.mother_age}
                    onChange={(e) => handleInputChange("mother_age", e.target.value)}
                    placeholder="Enter age"
                  />
                </div>
                <div>
                  <Label htmlFor="mother_nationality">Nationality *</Label>
                  <Input
                    id="mother_nationality"
                    value={formData.mother_nationality}
                    onChange={(e) => handleInputChange("mother_nationality", e.target.value)}
                    placeholder="Ghanaian"
                  />
                </div>
                <div>
                  <Label htmlFor="mother_nid">NID No.</Label>
                  <Input
                    id="mother_nid"
                    value={formData.mother_nid}
                    onChange={(e) => handleInputChange("mother_nid", e.target.value)}
                    placeholder="Enter NID number"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-emerald-700 mb-3">Place and Address of Mother's Usual Residence</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mother_house_no">House No.</Label>
                    <Input
                      id="mother_house_no"
                      value={formData.mother_house_no}
                      onChange={(e) => handleInputChange("mother_house_no", e.target.value)}
                      placeholder="Enter house number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_street_name">Street Name</Label>
                    <Input
                      id="mother_street_name"
                      value={formData.mother_street_name}
                      onChange={(e) => handleInputChange("mother_street_name", e.target.value)}
                      placeholder="Enter street name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_town">Town/Village *</Label>
                    <Input
                      id="mother_town"
                      value={formData.mother_town}
                      onChange={(e) => handleInputChange("mother_town", e.target.value)}
                      placeholder="Enter town/village"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_district">District *</Label>
                    <Input
                      id="mother_district"
                      value={formData.mother_district}
                      onChange={(e) => handleInputChange("mother_district", e.target.value)}
                      placeholder="Enter district"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="mother_region">Region *</Label>
                    <Select
                      value={formData.mother_region}
                      onValueChange={(value) => handleInputChange("mother_region", value)}
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
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-emerald-700 mb-3">Additional Mother Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mother_education">Level of Formal Education Attained</Label>
                    <Select
                      value={formData.mother_education}
                      onValueChange={(value) => handleInputChange("mother_education", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mother_marital_status">Marital Status</Label>
                    <Select
                      value={formData.mother_marital_status}
                      onValueChange={(value) => handleInputChange("mother_marital_status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        {MARITAL_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mother_occupation">Occupation</Label>
                    <Input
                      id="mother_occupation"
                      value={formData.mother_occupation}
                      onChange={(e) => handleInputChange("mother_occupation", e.target.value)}
                      placeholder="Enter occupation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mother_religion">Religion</Label>
                    <Input
                      id="mother_religion"
                      value={formData.mother_religion}
                      onChange={(e) => handleInputChange("mother_religion", e.target.value)}
                      placeholder="Enter religion"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="mother_residential_address">Residential Address (Full Address)</Label>
                    <Textarea
                      id="mother_residential_address"
                      value={formData.mother_residential_address}
                      onChange={(e) => handleInputChange("mother_residential_address", e.target.value)}
                      placeholder="Enter full residential address"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Father Information & Additional Details */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-emerald-800">Father's Information (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="father_first_name">First Name</Label>
                  <Input
                    id="father_first_name"
                    value={formData.father_first_name}
                    onChange={(e) => handleInputChange("father_first_name", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="father_middle_name">Middle Name</Label>
                  <Input
                    id="father_middle_name"
                    value={formData.father_middle_name}
                    onChange={(e) => handleInputChange("father_middle_name", e.target.value)}
                    placeholder="Enter middle name"
                  />
                </div>
                <div>
                  <Label htmlFor="father_surname">Surname</Label>
                  <Input
                    id="father_surname"
                    value={formData.father_surname}
                    onChange={(e) => handleInputChange("father_surname", e.target.value)}
                    placeholder="Enter surname"
                  />
                </div>
                <div>
                  <Label htmlFor="father_age">Age (in completed years)</Label>
                  <Input
                    id="father_age"
                    type="number"
                    value={formData.father_age}
                    onChange={(e) => handleInputChange("father_age", e.target.value)}
                    placeholder="Enter age"
                  />
                </div>
                <div>
                  <Label htmlFor="father_nationality">Nationality</Label>
                  <Input
                    id="father_nationality"
                    value={formData.father_nationality}
                    onChange={(e) => handleInputChange("father_nationality", e.target.value)}
                    placeholder="Ghanaian"
                  />
                </div>
                <div>
                  <Label htmlFor="father_nid">NID No.</Label>
                  <Input
                    id="father_nid"
                    value={formData.father_nid}
                    onChange={(e) => handleInputChange("father_nid", e.target.value)}
                    placeholder="Enter NID number"
                  />
                </div>
                <div>
                  <Label htmlFor="father_occupation">Occupation</Label>
                  <Input
                    id="father_occupation"
                    value={formData.father_occupation}
                    onChange={(e) => handleInputChange("father_occupation", e.target.value)}
                    placeholder="Enter occupation"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="father_residential_address">Residential Address</Label>
                  <Textarea
                    id="father_residential_address"
                    value={formData.father_residential_address}
                    onChange={(e) => handleInputChange("father_residential_address", e.target.value)}
                    placeholder="Enter full residential address"
                    rows={2}
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-emerald-700 mb-3">Additional Information</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="urgent_processing"
                      checked={formData.urgent_processing}
                      onCheckedChange={(checked) => handleInputChange("urgent_processing", checked as boolean)}
                    />
                    <Label htmlFor="urgent_processing" className="cursor-pointer">
                      Urgent Processing Required?
                    </Label>
                  </div>
                  {formData.urgent_processing && (
                    <div>
                      <Label htmlFor="urgency_reason">Reason for Urgency</Label>
                      <Textarea
                        id="urgency_reason"
                        value={formData.urgency_reason}
                        onChange={(e) => handleInputChange("urgency_reason", e.target.value)}
                        placeholder="Explain why urgent processing is needed"
                        rows={2}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="additional_notes">Additional Notes</Label>
                    <Textarea
                      id="additional_notes"
                      value={formData.additional_notes}
                      onChange={(e) => handleInputChange("additional_notes", e.target.value)}
                      placeholder="Any additional information"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-emerald-700 mb-3">Informant Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="informant_full_name">Informant's Full Name *</Label>
                    <Input
                      id="informant_full_name"
                      value={formData.informant_full_name}
                      onChange={(e) => handleInputChange("informant_full_name", e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="informant_relationship">Relationship to Child *</Label>
                    <Select
                      value={formData.informant_relationship}
                      onValueChange={(value) => handleInputChange("informant_relationship", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_TO_CHILD.map((rel) => (
                          <SelectItem key={rel} value={rel}>
                            {rel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="informant_phone">Informant's Phone Number *</Label>
                    <Input
                      id="informant_phone"
                      value={formData.informant_phone}
                      onChange={(e) => handleInputChange("informant_phone", e.target.value)}
                      placeholder="0XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="informant_date">Date of Information Provided *</Label>
                    <Input
                      id="informant_date"
                      type="date"
                      value={formData.informant_date}
                      onChange={(e) => handleInputChange("informant_date", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="informant_address">Informant's Address *</Label>
                    <Textarea
                      id="informant_address"
                      value={formData.informant_address}
                      onChange={(e) => handleInputChange("informant_address", e.target.value)}
                      placeholder="Enter full address"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Document Uploads (Optional) */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-emerald-800">Document Uploads (Optional)</h3>
              <p className="text-sm text-gray-600">
                You can upload ID cards for both mother and father (both sides) if available.
              </p>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Mother's ID Card (Front)</Label>
                <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4">
                  {motherIdFrontPreview ? (
                    <div className="relative">
                      <img
                        src={motherIdFrontPreview || "/placeholder.svg"}
                        alt="Mother ID Front"
                        className="max-h-48 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeFile("motherIdFront")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-8">
                      <Upload className="h-12 w-12 text-emerald-600 mb-3" />
                      <span className="text-base font-medium text-emerald-600 mb-1">
                        Click to upload Mother's ID (Front)
                      </span>
                      <span className="text-sm text-gray-500">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange("motherIdFront", e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Mother's ID Card (Back)</Label>
                <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4">
                  {motherIdBackPreview ? (
                    <div className="relative">
                      <img
                        src={motherIdBackPreview || "/placeholder.svg"}
                        alt="Mother ID Back"
                        className="max-h-48 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeFile("motherIdBack")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-8">
                      <Upload className="h-12 w-12 text-emerald-600 mb-3" />
                      <span className="text-base font-medium text-emerald-600 mb-1">
                        Click to upload Mother's ID (Back)
                      </span>
                      <span className="text-sm text-gray-500">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange("motherIdBack", e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Father's ID Card (Front) - Optional</Label>
                <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4">
                  {fatherIdFrontPreview ? (
                    <div className="relative">
                      <img
                        src={fatherIdFrontPreview || "/placeholder.svg"}
                        alt="Father ID Front"
                        className="max-h-48 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeFile("fatherIdFront")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-8">
                      <Upload className="h-12 w-12 text-emerald-600 mb-3" />
                      <span className="text-base font-medium text-emerald-600 mb-1">
                        Click to upload Father's ID (Front)
                      </span>
                      <span className="text-sm text-gray-500">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange("fatherIdFront", e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Father's ID Card (Back) - Optional</Label>
                <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4">
                  {fatherIdBackPreview ? (
                    <div className="relative">
                      <img
                        src={fatherIdBackPreview || "/placeholder.svg"}
                        alt="Father ID Back"
                        className="max-h-48 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeFile("fatherIdBack")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-8">
                      <Upload className="h-12 w-12 text-emerald-600 mb-3" />
                      <span className="text-base font-medium text-emerald-600 mb-1">
                        Click to upload Father's ID (Back)
                      </span>
                      <span className="text-sm text-gray-500">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange("fatherIdBack", e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-emerald-200">
            <Button
              variant="outline"
              onClick={() => (currentStep === 1 ? onCancel() : setCurrentStep((prev) => prev - 1))}
              className="w-full sm:w-auto border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? "Cancel" : "Previous"}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 transition-all duration-300"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedCostTier}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 transition-all duration-300"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

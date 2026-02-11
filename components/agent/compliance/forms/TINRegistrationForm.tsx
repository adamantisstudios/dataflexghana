"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Upload, X, CreditCard } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { scrollToElement } from "@/lib/scroll-utils"

interface TINRegistrationFormProps {
  agentId: string
  onComplete: () => void
  onCancel: () => void
}

export function TINRegistrationForm({ agentId, onComplete, onCancel }: TINRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCostPopup, setShowCostPopup] = useState(true)

  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    ghanaCardNumber: "",
    phoneNumber: "",
    email: "",

    // Address Information
    residentialAddress: "",
    digitalAddress: "",
    city: "",
    region: "",
    postalAddress: "",

    // Employment/Business Information
    employmentStatus: "",
    employerName: "",
    employerAddress: "",
    occupation: "",
    businessName: "",
    businessAddress: "",
    businessType: "",

    // Additional Information
    previousTIN: "",
    reasonForRegistration: "",
  })

  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [ghanaCardFile, setGhanaCardFile] = useState<File | null>(null)
  const [ghanaCardPreview, setGhanaCardPreview] = useState<string | null>(null)

  useEffect(() => {
    setShowCostPopup(true)
  }, [])

  useEffect(() => {
    const formElement = document.querySelector("[data-form-section]")
    scrollToElement(formElement as HTMLElement)
  }, [currentStep])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (type: "signature" | "ghanaCard", file: File | null) => {
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
      if (type === "signature") {
        setSignatureFile(file)
        setSignaturePreview(reader.result as string)
      } else {
        setGhanaCardFile(file)
        setGhanaCardPreview(reader.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeFile = (type: "signature" | "ghanaCard") => {
    if (type === "signature") {
      setSignatureFile(null)
      setSignaturePreview(null)
    } else {
      setGhanaCardFile(null)
      setGhanaCardPreview(null)
    }
  }

  const uploadImage = async (file: File, type: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${agentId}_${type}_${Date.now()}.${fileExt}`
      const filePath = `compliance/${fileName}`

      const { error: uploadError } = await supabase.storage.from("compliance-images").upload(filePath, file)

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

  const handleSubmit = async () => {
    // Only check for required uploads
    if (!signatureFile || !ghanaCardFile) {
      toast.error("Please upload both signature and Ghana Card images")
      return
    }

    setIsSubmitting(true)

    try {
      const signatureUrl = await uploadImage(signatureFile, "signature")
      const ghanaCardUrl = await uploadImage(ghanaCardFile, "ghana_card")

      if (!signatureUrl || !ghanaCardUrl) {
        throw new Error("Failed to upload images")
      }

      const { data: submission, error: submissionError } = await supabase
        .from("form_submissions")
        .insert({
          agent_id: agentId,
          form_id: "tin-registration",
          form_data: formData,
          status: "Pending",
        })
        .select()
        .single()

      if (submissionError) throw submissionError

      await supabase.from("form_images").insert([
        {
          submission_id: submission.id,
          image_type: "signature",
          image_url: signatureUrl,
        },
        {
          submission_id: submission.id,
          image_type: "ghana_card",
          image_url: ghanaCardUrl,
        },
      ])

      toast.success(
        "Form submitted successfully! Your TIN Registration application has been received and will be processed.",
        {
          duration: 5000,
        },
      )
      onComplete()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to submit form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalSteps = 4

  return (
  <>
    {showCostPopup && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-300 bg-white shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-emerald-600" />
              <CardTitle className="text-emerald-600">TIN Registration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-800">Cost:</span>
                <span className="text-lg font-bold text-emerald-600">150 GHS</span>
              </div>
              
              {/* COMMISSION SECTION ADDED HERE */}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                <span className="text-sm font-medium text-amber-700">Your Commission:</span>
                <span className="text-lg font-bold text-amber-600">20 GHS</span>
              </div>
              
              <div className="border-t border-emerald-200 pt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Duration:</span>
                  <span className="text-sm font-medium text-emerald-800">1 Day</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700">Delivery:</span>
                  <span className="text-sm font-medium text-emerald-800">WhatsApp</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              TIN registration costs 150 GHS and is processed within 1 day. Your Tax Identification Number will be delivered via WhatsApp.
            </p>
            <Button onClick={() => setShowCostPopup(false)} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )}

      <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-emerald-800 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            TIN Registration Application
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {totalSteps}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div data-form-section>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="Enter full name as on Ghana Card"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="ghanaCardNumber">Ghana Card Number *</Label>
                    <Input
                      id="ghanaCardNumber"
                      value={formData.ghanaCardNumber}
                      onChange={(e) => handleInputChange("ghanaCardNumber", e.target.value)}
                      placeholder="GHA-XXXXXXXXX-X"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      placeholder="0XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="residentialAddress">Residential Address *</Label>
                    <Input
                      id="residentialAddress"
                      value={formData.residentialAddress}
                      onChange={(e) => handleInputChange("residentialAddress", e.target.value)}
                      placeholder="Enter residential address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="digitalAddress">Digital Address (Ghana Post GPS)</Label>
                    <Input
                      id="digitalAddress"
                      value={formData.digitalAddress}
                      onChange={(e) => handleInputChange("digitalAddress", e.target.value)}
                      placeholder="GX-XXX-XXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City/Town *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Enter city/town"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Region *</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => handleInputChange("region", e.target.value)}
                      placeholder="Enter region"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalAddress">Postal Address</Label>
                    <Input
                      id="postalAddress"
                      value={formData.postalAddress}
                      onChange={(e) => handleInputChange("postalAddress", e.target.value)}
                      placeholder="P.O. Box"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Employment/Business Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800">Employment/Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="employmentStatus">Employment Status *</Label>
                    <Select
                      value={formData.employmentStatus}
                      onValueChange={(value) => handleInputChange("employmentStatus", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="self-employed">Self-Employed</SelectItem>
                        <SelectItem value="business-owner">Business Owner</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.employmentStatus === "employed" && (
                    <>
                      <div className="md:col-span-2">
                        <Label htmlFor="employerName">Employer Name</Label>
                        <Input
                          id="employerName"
                          value={formData.employerName}
                          onChange={(e) => handleInputChange("employerName", e.target.value)}
                          placeholder="Enter employer name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="employerAddress">Employer Address</Label>
                        <Input
                          id="employerAddress"
                          value={formData.employerAddress}
                          onChange={(e) => handleInputChange("employerAddress", e.target.value)}
                          placeholder="Enter employer address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) => handleInputChange("occupation", e.target.value)}
                          placeholder="Enter occupation"
                        />
                      </div>
                    </>
                  )}

                  {(formData.employmentStatus === "self-employed" ||
                    formData.employmentStatus === "business-owner") && (
                    <>
                      <div className="md:col-span-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => handleInputChange("businessName", e.target.value)}
                          placeholder="Enter business name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="businessAddress">Business Address</Label>
                        <Input
                          id="businessAddress"
                          value={formData.businessAddress}
                          onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                          placeholder="Enter business address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessType">Business Type</Label>
                        <Input
                          id="businessType"
                          value={formData.businessType}
                          onChange={(e) => handleInputChange("businessType", e.target.value)}
                          placeholder="e.g., Retail, Services"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <Label htmlFor="reasonForRegistration">Reason for Registration *</Label>
                    <Select
                      value={formData.reasonForRegistration}
                      onValueChange={(value) => handleInputChange("reasonForRegistration", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-employment">New Employment</SelectItem>
                        <SelectItem value="business-registration">Business Registration</SelectItem>
                        <SelectItem value="tax-compliance">Tax Compliance</SelectItem>
                        <SelectItem value="bank-requirement">Bank Requirement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="previousTIN">Previous TIN (if any)</Label>
                    <Input
                      id="previousTIN"
                      value={formData.previousTIN}
                      onChange={(e) => handleInputChange("previousTIN", e.target.value)}
                      placeholder="Enter previous TIN if applicable"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Document Uploads */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800">Document Uploads</h3>

                <div className="space-y-2">
                  <Label>Signature *</Label>
                  <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4">
                    {signaturePreview ? (
                      <div className="relative">
                        <img
                          src={signaturePreview || "/placeholder.svg"}
                          alt="Signature"
                          className="max-h-40 mx-auto"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeFile("signature")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer">
                        <Upload className="h-8 w-8 text-emerald-600 mb-2" />
                        <span className="text-sm text-emerald-600">Click to upload signature</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange("signature", e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ghana Card *</Label>
                  <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4">
                    {ghanaCardPreview ? (
                      <div className="relative">
                        <img
                          src={ghanaCardPreview || "/placeholder.svg"}
                          alt="Ghana Card"
                          className="max-h-40 mx-auto"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeFile("ghanaCard")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer">
                        <Upload className="h-8 w-8 text-emerald-600 mb-2" />
                        <span className="text-sm text-emerald-600">Click to upload Ghana Card</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange("ghanaCard", e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-emerald-200">
            <Button
              variant="outline"
              onClick={() => (currentStep === 1 ? onCancel() : setCurrentStep((prev) => prev - 1))}
              className="border-emerald-300 text-emerald-600"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? "Cancel" : "Previous"}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
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

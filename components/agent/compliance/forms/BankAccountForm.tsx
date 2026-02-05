"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Upload, X, CreditCard, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { SignatureCanvas } from "../SignatureCanvas"
import { scrollToElement } from "@/lib/scroll-utils"

interface BankAccountFormProps {
  agentId: string
  onComplete: () => void
  onCancel: () => void
}

const ACCOUNT_TYPES = ["Current Account", "Savings Account", "Fixed Deposit Account"]
const APPLICANT_TYPES = ["Individual", "Sole Proprietor", "Company"]
const CURRENCIES = ["GHS - Ghanaian Cedi", "USD - US Dollar", "EUR - Euro", "GBP - British Pound"]
const ID_TYPES = ["Passport", "Driver's License", "National ID Card", "Voter's ID"]
const CARD_PREFERENCES = ["Master Card", "Master Card Platinum", "Visa Gold", "Visa Card", "Mobile Banking"]
const BANKS = [
  "GCB Bank PLC",
  "Ecobank Ghana PLC",
  "Absa Bank Ghana",
  "Access Bank Ghana PLC",
  "Fidelity Bank Ghana",
  "Standard Chartered Bank Ghana",
  "Stanbic Bank Ghana",
  "Zenith Bank Ghana",
  "CAL Bank Limited",
  "Republic Bank Ghana",
  "National Investment Bank (NIB)",
  "Prudential Bank Limited",
  "First Atlantic Bank",
  "United Bank for Africa (UBA) Ghana",
]

export function BankAccountForm({ agentId, onComplete, onCancel }: BankAccountFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [showCostPopup, setShowCostPopup] = useState(true)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [ghanaCardFile, setGhanaCardFile] = useState<File | null>(null)
  const [ghanaCardPreview, setGhanaCardPreview] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    bank_name: "",
    applicant_type: "",
    account_type: "",
    currency: "",
    purpose_of_account: "",
    branch: "",
    company_name: "",
    registration_number: "",
    jurisdiction: "",
    incorporation_date: "",
    source_of_funds: "",
    business_type: "",
    sector: "",
    business_address: "",
    business_email: "",
    business_phone1: "",
    business_phone2: "",
    tin: "",
    annual_turnover: "",
    surname: "",
    other_names: "",
    date_of_birth: "",
    gender: "",
    nationality: "",
    residence_permit: "",
    id_type: "",
    id_number: "",
    id_issue_date: "",
    id_expiry_date: "",
    id_place_issue: "",
    us_citizen: "",
    us_address: "",
    residential_address: "",
    landmark: "",
    city: "",
    region: "",
    phone1: "",
    phone2: "",
    ubo_company_name: "",
    credit_disclosure: false,
    general_declaration: false,
    risk_profile: "",
    pep: "",
    pep_details: [] as Array<{ name: string; position: string }>,

    card_pickup: "",
    card_delivery_address: "",
    card_preferences: [] as string[],
    internet_banking: "",
    preferred_username: "",
    cheque_book: "",
    email_statement: "",
    statement_frequency: "",
    sms_alert: "",
    email_alert_frequency: "",
    mandate_account_name: "",
    mandate_authorization: "",
    signatory_specification: "",
    cheque_confirm: "",
    confirmation_threshold: "",
    signatory_surname: "",
    signatory_firstname: "",
    signatory_othername: "",
    signatory_class: "",
    signatory_id_type: "",
    signatory_id_number: "",
    signatory_phone: "",
    signatory_address: "",
    referee_name: "",
    referee_address: "",
    reference_applicant_name: "",
    referee_bank: "",
    referee_account: "",
    referee_branch: "",
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

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGhanaCardChange = (file: File | null) => {
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
      setGhanaCardFile(file)
      setGhanaCardPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeGhanaCard = () => {
    setGhanaCardFile(null)
    setGhanaCardPreview(null)
  }

  const uploadImage = async (file: File | string, type: string): Promise<string | null> => {
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
            form_id: "bank-account",
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

      // Upload signature if provided
      if (signatureDataUrl) {
        const signatureUrl = await uploadImage(signatureDataUrl, "signature")
        if (signatureUrl) {
          uploadedImages.push({
            submission_id: "",
            image_type: "signature",
            image_url: signatureUrl,
          })
        }
      }

      // Upload Ghana card if provided
      if (ghanaCardFile) {
        const ghanaCardUrl = await uploadImage(ghanaCardFile, "ghana_card")
        if (ghanaCardUrl) {
          uploadedImages.push({
            submission_id: "",
            image_type: "ghana_card_front",
            image_url: ghanaCardUrl,
          })
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
            form_id: "bank-account",
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
        }))
        const { error: imagesError } = await supabase.from("form_images").insert(imagesToInsert)
        if (imagesError) throw imagesError
      }

      toast.success("Bank Account form submitted successfully! Processing will take 1 working day.", {
        duration: 6000,
      })
      onComplete()
    } catch (error: any) {
      console.error("Error submitting form:", error)
      toast.error(`Failed to submit form: ${error?.message || "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

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
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
        <Card className="max-w-[95vw] sm:max-w-sm w-full border-blue-300 bg-white shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-600 text-lg">Bank Account Opening</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-800">Processing Cost:</span>
                <span className="font-bold text-blue-600">FREE</span>
              </div>
              
              {/* COMMISSION SECTION ADDED HERE */}
              <div className="flex items-center justify-between text-sm pt-2 mt-2 border-t border-blue-200">
                <span className="font-medium text-amber-700">Your Commission:</span>
                <span className="font-bold text-amber-600">N/A</span>
              </div>
              
              <div className="border-t border-blue-200 mt-2 pt-2">
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-blue-700">Duration:</span>
                  <span className="font-medium text-blue-800">1 Working Day</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">Delivery:</span>
                  <span className="font-medium text-blue-800">Email/WhatsApp</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Open a bank account with complete details delivered within 1 working day.
            </p>
            <Button
              onClick={() => setShowCostPopup(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-2"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )}

      <Card className="border-blue-200 bg-white/90 backdrop-blur-sm w-full mx-0 px-0 sm:px-2">
        <CardHeader className="px-2 sm:px-6">
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Account Opening
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {totalSteps}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-2 sm:px-4" ref={formRef}>
          {/* Step 1: Account Information */}
          {currentStep === 1 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-blue-800">Account Information</h3>
              <p className="text-sm text-gray-600">Select your bank, account type and currency preference</p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="bank_name" className="text-xs font-medium">
                    Select Bank *
                  </Label>
                  <Select value={formData.bank_name} onValueChange={(value) => handleInputChange("bank_name", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose your preferred bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank} className="text-xs">
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="applicant_type" className="text-xs font-medium">
                    Applicant Type *
                  </Label>
                  <Select
                    value={formData.applicant_type}
                    onValueChange={(value) => handleInputChange("applicant_type", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select applicant type" />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICANT_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="text-xs">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="account_type" className="text-xs font-medium">
                      Account Type *
                    </Label>
                    <Select
                      value={formData.account_type}
                      onValueChange={(value) => handleInputChange("account_type", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="text-xs">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-xs font-medium">
                      Currency *
                    </Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr} value={curr} className="text-xs">
                            {curr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="purpose_of_account" className="text-xs font-medium">
                    Purpose of Account *
                  </Label>
                  <Input
                    id="purpose_of_account"
                    value={formData.purpose_of_account}
                    onChange={(e) => handleInputChange("purpose_of_account", e.target.value)}
                    placeholder="e.g., Business operations, Personal savings"
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="branch" className="text-xs font-medium">
                    Preferred Branch *
                  </Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) => handleInputChange("branch", e.target.value)}
                    placeholder="Enter branch name or location"
                    className="w-full text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Details (if applicable) */}
          {currentStep === 2 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-blue-800">Business Details</h3>
              <p className="text-sm text-gray-600">Provide information about your business or company</p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="company_name" className="text-xs font-medium">
                    Company/Business Name
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    placeholder="Enter company name"
                    className="w-full text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="registration_number" className="text-xs font-medium">
                      Registration Number
                    </Label>
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => handleInputChange("registration_number", e.target.value)}
                      placeholder="Enter registration number"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="jurisdiction" className="text-xs font-medium">
                      Jurisdiction
                    </Label>
                    <Input
                      id="jurisdiction"
                      value={formData.jurisdiction}
                      onChange={(e) => handleInputChange("jurisdiction", e.target.value)}
                      placeholder="Enter jurisdiction"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="incorporation_date" className="text-xs font-medium">
                    Date of Incorporation
                  </Label>
                  <Input
                    id="incorporation_date"
                    type="date"
                    value={formData.incorporation_date}
                    onChange={(e) => handleInputChange("incorporation_date", e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="source_of_funds" className="text-xs font-medium">
                    Source of Funds
                  </Label>
                  <Input
                    id="source_of_funds"
                    value={formData.source_of_funds}
                    onChange={(e) => handleInputChange("source_of_funds", e.target.value)}
                    placeholder="e.g., Business revenue, Investment"
                    className="w-full text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="business_type" className="text-xs font-medium">
                      Type of Business
                    </Label>
                    <Input
                      id="business_type"
                      value={formData.business_type}
                      onChange={(e) => handleInputChange("business_type", e.target.value)}
                      placeholder="Enter business type"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sector" className="text-xs font-medium">
                      Sector/Industry
                    </Label>
                    <Input
                      id="sector"
                      value={formData.sector}
                      onChange={(e) => handleInputChange("sector", e.target.value)}
                      placeholder="Enter sector"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="business_address" className="text-xs font-medium">
                    Business Address
                  </Label>
                  <Textarea
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => handleInputChange("business_address", e.target.value)}
                    placeholder="Enter full business address"
                    rows={2}
                    className="w-full text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="business_email" className="text-xs font-medium">
                      Business Email
                    </Label>
                    <Input
                      id="business_email"
                      type="email"
                      value={formData.business_email}
                      onChange={(e) => handleInputChange("business_email", e.target.value)}
                      placeholder="email@business.com"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_phone1" className="text-xs font-medium">
                      Phone Number 1
                    </Label>
                    <Input
                      id="business_phone1"
                      value={formData.business_phone1}
                      onChange={(e) => handleInputChange("business_phone1", e.target.value)}
                      placeholder="0XX XXX XXXX"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="business_phone2" className="text-xs font-medium">
                      Phone Number 2
                    </Label>
                    <Input
                      id="business_phone2"
                      value={formData.business_phone2}
                      onChange={(e) => handleInputChange("business_phone2", e.target.value)}
                      placeholder="0XX XXX XXXX"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tin" className="text-xs font-medium">
                      TIN (Tax Identification Number)
                    </Label>
                    <Input
                      id="tin"
                      value={formData.tin}
                      onChange={(e) => handleInputChange("tin", e.target.value)}
                      placeholder="Enter TIN"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="annual_turnover" className="text-xs font-medium">
                    Annual Turnover
                  </Label>
                  <Input
                    id="annual_turnover"
                    value={formData.annual_turnover}
                    onChange={(e) => handleInputChange("annual_turnover", e.target.value)}
                    placeholder="e.g., GHS 100,000"
                    className="w-full text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Owner/Individual Details */}
          {currentStep === 3 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-blue-800">Owner/Individual Details</h3>
              <p className="text-sm text-gray-600">Provide your personal information</p>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="surname" className="text-xs font-medium">
                      Surname *
                    </Label>
                    <Input
                      id="surname"
                      value={formData.surname}
                      onChange={(e) => handleInputChange("surname", e.target.value)}
                      placeholder="Enter surname"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="other_names" className="text-xs font-medium">
                      Other Names *
                    </Label>
                    <Input
                      id="other_names"
                      value={formData.other_names}
                      onChange={(e) => handleInputChange("other_names", e.target.value)}
                      placeholder="Enter other names"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date_of_birth" className="text-xs font-medium">
                      Date of Birth *
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender" className="text-xs font-medium">
                      Gender *
                    </Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
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
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="nationality" className="text-xs font-medium">
                      Nationality *
                    </Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange("nationality", e.target.value)}
                      placeholder="Ghanaian"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="residence_permit" className="text-xs font-medium">
                      Residence Permit No.
                    </Label>
                    <Input
                      id="residence_permit"
                      value={formData.residence_permit}
                      onChange={(e) => handleInputChange("residence_permit", e.target.value)}
                      placeholder="Enter permit number"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="id_type" className="text-xs font-medium">
                      Means of Identification *
                    </Label>
                    <Select value={formData.id_type} onValueChange={(value) => handleInputChange("id_type", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="text-xs">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="id_number" className="text-xs font-medium">
                      ID Number *
                    </Label>
                    <Input
                      id="id_number"
                      value={formData.id_number}
                      onChange={(e) => handleInputChange("id_number", e.target.value)}
                      placeholder="Enter ID number"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="id_issue_date" className="text-xs font-medium">
                      ID Issue Date
                    </Label>
                    <Input
                      id="id_issue_date"
                      type="date"
                      value={formData.id_issue_date}
                      onChange={(e) => handleInputChange("id_issue_date", e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="id_expiry_date" className="text-xs font-medium">
                      ID Expiry Date
                    </Label>
                    <Input
                      id="id_expiry_date"
                      type="date"
                      value={formData.id_expiry_date}
                      onChange={(e) => handleInputChange("id_expiry_date", e.target.value)}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="id_place_issue" className="text-xs font-medium">
                    Place of Issue
                  </Label>
                  <Input
                    id="id_place_issue"
                    value={formData.id_place_issue}
                    onChange={(e) => handleInputChange("id_place_issue", e.target.value)}
                    placeholder="Enter place of issue"
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="us_citizen" className="text-xs font-medium">
                    US Citizen?
                  </Label>
                  <Select value={formData.us_citizen} onValueChange={(value) => handleInputChange("us_citizen", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes" className="text-xs">
                        Yes
                      </SelectItem>
                      <SelectItem value="No" className="text-xs">
                        No
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.us_citizen === "Yes" && (
                  <div>
                    <Label htmlFor="us_address" className="text-xs font-medium">
                      US Address
                    </Label>
                    <Input
                      id="us_address"
                      value={formData.us_address}
                      onChange={(e) => handleInputChange("us_address", e.target.value)}
                      placeholder="Enter US address"
                      className="w-full text-xs"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="residential_address" className="text-xs font-medium">
                    Residential Address *
                  </Label>
                  <Textarea
                    id="residential_address"
                    value={formData.residential_address}
                    onChange={(e) => handleInputChange("residential_address", e.target.value)}
                    placeholder="Enter full residential address"
                    rows={2}
                    className="w-full text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="landmark" className="text-xs font-medium">
                      Nearest Landmark
                    </Label>
                    <Input
                      id="landmark"
                      value={formData.landmark}
                      onChange={(e) => handleInputChange("landmark", e.target.value)}
                      placeholder="Enter landmark"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-xs font-medium">
                      City/Town *
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Enter city/town"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="region" className="text-xs font-medium">
                      Region *
                    </Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => handleInputChange("region", e.target.value)}
                      placeholder="Enter region"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone1" className="text-xs font-medium">
                      Phone Number 1 *
                    </Label>
                    <Input
                      id="phone1"
                      value={formData.phone1}
                      onChange={(e) => handleInputChange("phone1", e.target.value)}
                      placeholder="0XX XXX XXXX"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone2" className="text-xs font-medium">
                    Phone Number 2
                  </Label>
                  <Input
                    id="phone2"
                    value={formData.phone2}
                    onChange={(e) => handleInputChange("phone2", e.target.value)}
                    placeholder="0XX XXX XXXX"
                    className="w-full text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: UBO & KYC */}
          {currentStep === 4 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-blue-800">UBO & KYC Information</h3>
              <p className="text-sm text-gray-600">Provide UBO declaration and KYC details</p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ubo_company_name" className="text-xs font-medium">
                    Company Name
                  </Label>
                  <Input
                    id="ubo_company_name"
                    value={formData.ubo_company_name}
                    onChange={(e) => handleInputChange("ubo_company_name", e.target.value)}
                    placeholder="Enter company name"
                    className="w-full text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="credit_disclosure"
                      checked={formData.credit_disclosure}
                      onCheckedChange={(checked) => handleInputChange("credit_disclosure", checked as boolean)}
                      className="h-3 w-3"
                    />
                    <Label htmlFor="credit_disclosure" className="cursor-pointer text-xs">
                      I acknowledge credit reference bureau disclosure
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="general_declaration"
                      checked={formData.general_declaration}
                      onCheckedChange={(checked) => handleInputChange("general_declaration", checked as boolean)}
                      className="h-3 w-3"
                    />
                    <Label htmlFor="general_declaration" className="cursor-pointer text-xs">
                      I agree to the general declaration
                    </Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="risk_profile" className="text-xs font-medium">
                    KYC Risk Profile
                  </Label>
                  <Select
                    value={formData.risk_profile}
                    onValueChange={(value) => handleInputChange("risk_profile", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select risk profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low" className="text-xs">
                        Low
                      </SelectItem>
                      <SelectItem value="Medium" className="text-xs">
                        Medium
                      </SelectItem>
                      <SelectItem value="High" className="text-xs">
                        High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pep" className="text-xs font-medium">
                    Politically Exposed Person (PEP)?
                  </Label>
                  <Select value={formData.pep} onValueChange={(value) => handleInputChange("pep", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes" className="text-xs">
                        Yes
                      </SelectItem>
                      <SelectItem value="No" className="text-xs">
                        No
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Services & Mandate */}
          {currentStep === 5 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-blue-800">Account Services & Mandate</h3>
              <p className="text-sm text-gray-600">Select services and set up your account mandate</p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="card_pickup" className="text-xs font-medium">
                    Card Delivery
                  </Label>
                  <Select
                    value={formData.card_pickup}
                    onValueChange={(value) => handleInputChange("card_pickup", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select delivery option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pick up at Bank" className="text-xs">
                        Pick up at Bank
                      </SelectItem>
                      <SelectItem value="Delivery" className="text-xs">
                        Delivery
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.card_pickup === "Delivery" && (
                  <div>
                    <Label htmlFor="card_delivery_address" className="text-xs font-medium">
                      Delivery Address
                    </Label>
                    <Textarea
                      id="card_delivery_address"
                      value={formData.card_delivery_address}
                      onChange={(e) => handleInputChange("card_delivery_address", e.target.value)}
                      placeholder="Enter delivery address with GPS coordinates"
                      rows={2}
                      className="w-full text-xs"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-xs font-medium">Card Preferences</Label>
                  <div className="space-y-1.5 mt-1.5">
                    {CARD_PREFERENCES.map((pref) => (
                      <div key={pref} className="flex items-center space-x-2">
                        <Checkbox
                          id={pref}
                          checked={formData.card_preferences.includes(pref)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleInputChange("card_preferences", [...formData.card_preferences, pref])
                            } else {
                              handleInputChange(
                                "card_preferences",
                                formData.card_preferences.filter((p) => p !== pref),
                              )
                            }
                          }}
                          className="h-3 w-3"
                        />
                        <Label htmlFor={pref} className="cursor-pointer text-xs">
                          {pref}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="internet_banking" className="text-xs font-medium">
                      Internet Banking?
                    </Label>
                    <Select
                      value={formData.internet_banking}
                      onValueChange={(value) => handleInputChange("internet_banking", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes" className="text-xs">
                          Yes
                        </SelectItem>
                        <SelectItem value="No" className="text-xs">
                          No
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.internet_banking === "Yes" && (
                    <div>
                      <Label htmlFor="preferred_username" className="text-xs font-medium">
                        Preferred Username
                      </Label>
                      <Input
                        id="preferred_username"
                        value={formData.preferred_username}
                        onChange={(e) => handleInputChange("preferred_username", e.target.value)}
                        placeholder="Enter preferred username"
                        className="w-full text-xs"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cheque_book" className="text-xs font-medium">
                      Cheque Book Required?
                    </Label>
                    <Select
                      value={formData.cheque_book}
                      onValueChange={(value) => handleInputChange("cheque_book", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes" className="text-xs">
                          Yes
                        </SelectItem>
                        <SelectItem value="No" className="text-xs">
                          No
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="email_statement" className="text-xs font-medium">
                      Email Statement?
                    </Label>
                    <Select
                      value={formData.email_statement}
                      onValueChange={(value) => handleInputChange("email_statement", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes" className="text-xs">
                          Yes
                        </SelectItem>
                        <SelectItem value="No" className="text-xs">
                          No
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="sms_alert" className="text-xs font-medium">
                    SMS Alert Required?
                  </Label>
                  <Select value={formData.sms_alert} onValueChange={(value) => handleInputChange("sms_alert", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes" className="text-xs">
                        Yes
                      </SelectItem>
                      <SelectItem value="No" className="text-xs">
                        No
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Signatory Details */}
          {currentStep === 6 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-blue-800">Signatory Details</h3>
              <p className="text-sm text-gray-600">Provide authorized signatory information</p>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="signatory_surname" className="text-xs font-medium">
                      Surname *
                    </Label>
                    <Input
                      id="signatory_surname"
                      value={formData.signatory_surname}
                      onChange={(e) => handleInputChange("signatory_surname", e.target.value)}
                      placeholder="Enter surname"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signatory_firstname" className="text-xs font-medium">
                      First Name *
                    </Label>
                    <Input
                      id="signatory_firstname"
                      value={formData.signatory_firstname}
                      onChange={(e) => handleInputChange("signatory_firstname", e.target.value)}
                      placeholder="Enter first name"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="signatory_othername" className="text-xs font-medium">
                      Other Name
                    </Label>
                    <Input
                      id="signatory_othername"
                      value={formData.signatory_othername}
                      onChange={(e) => handleInputChange("signatory_othername", e.target.value)}
                      placeholder="Enter other name"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signatory_class" className="text-xs font-medium">
                      Class of Signatory
                    </Label>
                    <Input
                      id="signatory_class"
                      value={formData.signatory_class}
                      onChange={(e) => handleInputChange("signatory_class", e.target.value)}
                      placeholder="e.g., Director, Manager"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="signatory_id_type" className="text-xs font-medium">
                      Identification Type
                    </Label>
                    <Select
                      value={formData.signatory_id_type}
                      onValueChange={(value) => handleInputChange("signatory_id_type", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="text-xs">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="signatory_id_number" className="text-xs font-medium">
                      Identification No.
                    </Label>
                    <Input
                      id="signatory_id_number"
                      value={formData.signatory_id_number}
                      onChange={(e) => handleInputChange("signatory_id_number", e.target.value)}
                      placeholder="Enter ID number"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="signatory_phone" className="text-xs font-medium">
                      Telephone Number
                    </Label>
                    <Input
                      id="signatory_phone"
                      value={formData.signatory_phone}
                      onChange={(e) => handleInputChange("signatory_phone", e.target.value)}
                      placeholder="0XX XXX XXXX"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signatory_address" className="text-xs font-medium">
                      Address
                    </Label>
                    <Textarea
                      id="signatory_address"
                      value={formData.signatory_address}
                      onChange={(e) => handleInputChange("signatory_address", e.target.value)}
                      placeholder="Enter full address"
                      rows={2}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Reference */}
          {currentStep === 7 && (
            <div className="space-y-4 w-full">
              <h3 className="text-lg font-semibold text-blue-800">Reference Information</h3>
              <p className="text-sm text-gray-600">Provide referee details for verification</p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="referee_name" className="text-xs font-medium">
                    Referee Name *
                  </Label>
                  <Input
                    id="referee_name"
                    value={formData.referee_name}
                    onChange={(e) => handleInputChange("referee_name", e.target.value)}
                    placeholder="Enter referee name"
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="referee_address" className="text-xs font-medium">
                    Referee Address *
                  </Label>
                  <Textarea
                    id="referee_address"
                    value={formData.referee_address}
                    onChange={(e) => handleInputChange("referee_address", e.target.value)}
                    placeholder="Enter referee address"
                    rows={2}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="reference_applicant_name" className="text-xs font-medium">
                    Applicant Name (as known to referee) *
                  </Label>
                  <Input
                    id="reference_applicant_name"
                    value={formData.reference_applicant_name}
                    onChange={(e) => handleInputChange("reference_applicant_name", e.target.value)}
                    placeholder="Enter applicant name"
                    className="w-full text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="referee_bank" className="text-xs font-medium">
                      Referee's Bank Name
                    </Label>
                    <Input
                      id="referee_bank"
                      value={formData.referee_bank}
                      onChange={(e) => handleInputChange("referee_bank", e.target.value)}
                      placeholder="Enter bank name"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="referee_account" className="text-xs font-medium">
                      Referee's Account Number
                    </Label>
                    <Input
                      id="referee_account"
                      value={formData.referee_account}
                      onChange={(e) => handleInputChange("referee_account", e.target.value)}
                      placeholder="Enter account number"
                      className="w-full text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="referee_branch" className="text-xs font-medium">
                    Referee's Bank Branch
                  </Label>
                  <Input
                    id="referee_branch"
                    value={formData.referee_branch}
                    onChange={(e) => handleInputChange("referee_branch", e.target.value)}
                    placeholder="Enter branch name"
                    className="w-full text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Documents (Signature & Ghana Card) */}
          {currentStep === 8 && (
            <div className="space-y-6 w-full">
              <h3 className="text-lg font-semibold text-blue-800">Documents & Signature</h3>
              <p className="text-sm text-gray-600">Capture your signature and upload your Ghana Card</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium">Signature *</Label>
                  <div className="w-full">
                    <SignatureCanvas onSignatureCapture={setSignatureDataUrl} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Ghana Card *</Label>
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 w-full">
                    {ghanaCardPreview ? (
                      <div className="relative">
                        <img
                          src={ghanaCardPreview || "/placeholder.svg"}
                          alt="Ghana Card"
                          className="max-h-48 mx-auto rounded w-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeGhanaCard}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer py-6 w-full">
                        <Upload className="h-10 w-10 text-blue-600 mb-2" />
                        <span className="text-xs font-medium text-blue-600 mb-1 text-center">
                          Click to upload Ghana Card
                        </span>
                        <span className="text-xs text-gray-500 text-center">PNG, JPG up to 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleGhanaCardChange(e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-xs"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-xs"
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

"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Send, Lightbulb } from "lucide-react"
import FormProgress from "@/components/FormProgress"
import FormField from "@/components/FormField"
import PersonForm from "@/components/PersonForm"
import SidebarAd from "@/components/SidebarAd"
import { formatWhatsAppMessage } from "@/lib/whatsapp"

interface CompanySharesFormProps {
  onSubmitSuccess: () => void
}

interface CompanyData {
  companyName: string
  presentedBy: string
  natureOfBusiness: string
  objectives: string
  digitalAddress: string
  houseNumber: string
  streetName: string
  cityDistrict: string
  contactInfo: string
  statedCapital: string
}

interface PersonData {
  fullName: string
  dateOfBirth: string
  placeOfBirth: string
  occupation: string
  mobileNumber: string
  email: string
  tinNumber: string
  residentialAddress: {
    digitalAddress: string
    houseNumber: string
    streetName: string
    cityDistrict: string
  }
  occupationalAddress: {
    digitalAddress: string
    houseNumber: string
    streetName: string
    cityDistrict: string
  }
}

const initialPersonData = (): PersonData => ({
  fullName: "",
  dateOfBirth: "",
  placeOfBirth: "",
  occupation: "",
  mobileNumber: "",
  email: "",
  tinNumber: "",
  residentialAddress: {
    digitalAddress: "",
    houseNumber: "",
    streetName: "",
    cityDistrict: "",
  },
  occupationalAddress: {
    digitalAddress: "",
    houseNumber: "",
    streetName: "",
    cityDistrict: "",
  },
})

export default function CompanySharesForm({ onSubmitSuccess }: CompanySharesFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showSidebarAd, setShowSidebarAd] = useState(true)
  const [formData, setFormData] = useState({
    company: {
      companyName: "",
      presentedBy: "",
      natureOfBusiness: "",
      objectives: "",
      digitalAddress: "",
      houseNumber: "",
      streetName: "",
      cityDistrict: "",
      contactInfo: "",
      statedCapital: "100",
    } as CompanyData,
    director1: initialPersonData(),
    director2: initialPersonData(),
    secretary: initialPersonData(),
    subscriber1: initialPersonData(),
    subscriber2: initialPersonData(),
  })

  const steps = [
    { title: "Company Details", component: "company" },
    { title: "Director 1", component: "director1" },
    { title: "Director 2", component: "director2" },
    { title: "Secretary", component: "secretary" },
    { title: "Subscriber 1", component: "subscriber1" },
    { title: "Subscriber 2", component: "subscriber2" },
    { title: "Review & Submit", component: "submit" },
  ]

  // Scroll to progress bar when step changes
  useEffect(() => {
    const progressElement = document.querySelector(".form-progress-container")
    if (progressElement) {
      progressElement.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    const message = formatWhatsAppMessage(formData, "Company Limited by Shares")
    const whatsappUrl = `https://wa.me/233242799990?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    setTimeout(() => {
      onSubmitSuccess()
    }, 1000)
  }

  const updateCompanyData = (field: keyof CompanyData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      company: { ...prev.company, [field]: value },
    }))
  }

  const updatePersonData = (person: keyof typeof formData, data: Partial<PersonData>) => {
    if (person === "company") return
    setFormData((prev) => ({
      ...prev,
      [person]: { ...prev[person], ...data },
    }))
  }

  const renderStep = () => {
    const step = steps[currentStep]

    switch (step.component) {
      case "company":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                Company Limited by Shares Registration
              </h3>
              <div className="space-y-3 text-sm text-blue-700">
                <p>
                  <strong>Limited Liability (by Shares) Company:</strong> This type of business has between two to fifty
                  members and debenture holders with set objectives for profit.
                </p>
                <div>
                  <strong>Requirements:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Ghana Card for all persons</li>
                    <li>TIN (We can assist if you don't have it for free)</li>
                    <li>At least two directors, a secretary (We assist) and a shareholder</li>
                    <li>Auditor (We assist)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Company Name"
                value={formData.company.companyName}
                onChange={(value) => updateCompanyData("companyName", value)}
                placeholder="Enter the full company name"
                helpText="The exact name you want to register (e.g., 'ABC Trading Limited')"
                required
              />
              <FormField
                label="Presented By"
                value={formData.company.presentedBy}
                onChange={(value) => updateCompanyData("presentedBy", value)}
                placeholder="Name of person submitting this form"
                helpText="Full name of the person filling this form"
                required
              />
              <FormField
                label="Nature of Business"
                value={formData.company.natureOfBusiness}
                onChange={(value) => updateCompanyData("natureOfBusiness", value)}
                placeholder="e.g., Trading, Manufacturing, Consultancy"
                helpText="Primary business activity"
                required
              />
              <FormField
                label="Digital Address"
                value={formData.company.digitalAddress}
                onChange={(value) => updateCompanyData("digitalAddress", value)}
                placeholder="e.g., GA-123-4567"
                helpText="Ghana Post GPS address"
                required
              />
              <FormField
                label="House Number/Landmark"
                value={formData.company.houseNumber}
                onChange={(value) => updateCompanyData("houseNumber", value)}
                placeholder="House number or landmark"
                helpText="Physical location identifier"
              />
              <FormField
                label="Street Name"
                value={formData.company.streetName}
                onChange={(value) => updateCompanyData("streetName", value)}
                placeholder="Street name"
                helpText="Name of the street"
              />
              <FormField
                label="City/District"
                value={formData.company.cityDistrict}
                onChange={(value) => updateCompanyData("cityDistrict", value)}
                placeholder="City or district"
                helpText="Location within the region"
                required
              />
              <FormField
                label="P.O.Box/Email/Phone"
                value={formData.company.contactInfo}
                onChange={(value) => updateCompanyData("contactInfo", value)}
                placeholder="Contact information"
                helpText="Primary contact details"
                required
              />
              <FormField
                label="Stated Capital (GHS)"
                type="number"
                value={formData.company.statedCapital}
                onChange={(value) => updateCompanyData("statedCapital", value)}
                placeholder="100"
                helpText="Minimum GHS 100 for private companies"
                required
              />
            </div>
            <FormField
              label="Objectives of Company"
              type="textarea"
              rows={4}
              value={formData.company.objectives}
              onChange={(value) => updateCompanyData("objectives", value)}
              placeholder="Describe the main objectives and purposes of the company..."
              helpText="Detailed description of what the company will do"
              required
            />
          </div>
        )

      case "director1":
      case "director2":
      case "secretary":
      case "subscriber1":
      case "subscriber2":
        return (
          <PersonForm
            title={step.title}
            data={formData[step.component as keyof typeof formData] as PersonData}
            onChange={(data) => updatePersonData(step.component as keyof typeof formData, data)}
            showDigitalAddress={true}
          />
        )

      case "submit":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Your Information</h3>
              <p className="text-gray-600 mb-6">
                Please review all the information you've provided. When you click submit, you'll be redirected to
                WhatsApp to complete your registration.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-red-800 mb-4">📸 Required Documents</h4>
              <div className="space-y-3 text-sm text-red-700">
                <div className="flex items-start space-x-3">
                  <span className="font-bold">1.</span>
                  <p>
                    <strong>Ghana Card Photos:</strong> Clear photos of front and back of each person's Ghana Card (or
                    International Passport for non-Ghanaians)
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-bold">2.</span>
                  <p>
                    <strong>Signatures:</strong> Each person must sign on plain white paper and take a clear photo
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-800 mb-2">📱 Submission Process</h4>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-2">
                <li>Click "Submit via WhatsApp" below</li>
                <li>Send the pre-filled form data message</li>
                <li>Follow up with required document photos</li>
                <li>Wait for confirmation from our team</li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-amber-800 mb-2">⚠️ Important Reminder</h4>
              <p className="text-amber-700 text-sm">
                Please cross-check all information before sharing. Remember to have clear photos of Ghana Cards and
                signatures ready to share via WhatsApp after submitting this form.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative">
      {/* Sidebar Ad */}
      {showSidebarAd && <SidebarAd onDismiss={() => setShowSidebarAd(false)} />}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="form-progress-container px-6 py-4 bg-gray-50 border-b">
          <FormProgress currentStep={currentStep} totalSteps={steps.length} />
        </div>

        <div className="px-6 py-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{steps[currentStep].title}</h2>
          </div>
          {renderStep()}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </span>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>Submit via WhatsApp</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

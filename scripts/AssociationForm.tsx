"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Send } from "lucide-react"
import FormProgress from "@/components/FormProgress"
import FormField from "@/components/FormField"
import PersonForm from "@/components/PersonForm"
import { formatWhatsAppMessage } from "@/lib/whatsapp"

interface AssociationFormProps {
  onSubmitSuccess: () => void
}

interface AssociationData {
  // Association Information
  associationName: string
  associationType: string
  otherType: string
  presentedBy: string
  objectives: string
  activities: string

  // Address Information
  digitalAddress: string
  houseNumber: string
  streetName: string
  cityDistrict: string
  region: string
  contactInfo: string

  // Registration Details
  membershipType: string
  initialMembers: string
  governingDocument: string
  registrationPurpose: string

  // Financial Information
  membershipFees: string
  fundingSources: string
  expectedBudget: string
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
    houseNumber: string
    streetName: string
    cityDistrict: string
  }
  occupationalAddress: {
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
    houseNumber: "",
    streetName: "",
    cityDistrict: "",
  },
  occupationalAddress: {
    houseNumber: "",
    streetName: "",
    cityDistrict: "",
  },
})

export default function AssociationForm({ onSubmitSuccess }: AssociationFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    association: {
      associationName: "",
      associationType: "",
      otherType: "",
      presentedBy: "",
      objectives: "",
      activities: "",
      digitalAddress: "",
      houseNumber: "",
      streetName: "",
      cityDistrict: "",
      region: "",
      contactInfo: "",
      membershipType: "",
      initialMembers: "",
      governingDocument: "",
      registrationPurpose: "",
      membershipFees: "",
      fundingSources: "",
      expectedBudget: "",
    } as AssociationData,
    founder1: initialPersonData(),
    founder2: initialPersonData(),
    founder3: initialPersonData(),
    chairperson: initialPersonData(),
    secretary: initialPersonData(),
  })

  const steps = [
    { title: "Association Details", component: "association" },
    { title: "Founder 1", component: "founder1" },
    { title: "Founder 2", component: "founder2" },
    { title: "Founder 3", component: "founder3" },
    { title: "Chairperson", component: "chairperson" },
    { title: "Secretary", component: "secretary" },
    { title: "Review & Submit", component: "submit" },
  ]

  const regions = [
    "Greater Accra",
    "Ashanti",
    "Western",
    "Central",
    "Eastern",
    "Volta",
    "Northern",
    "Upper East",
    "Upper West",
    "Brong Ahafo",
  ]

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
    const message = formatWhatsAppMessage(formData, "Association")
    const whatsappUrl = `https://wa.me/233242799990?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    setTimeout(() => {
      onSubmitSuccess()
    }, 1000)
  }

  const updateAssociationData = (field: keyof AssociationData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      association: { ...prev.association, [field]: value },
    }))
  }

  const updatePersonData = (person: keyof typeof formData, data: Partial<PersonData>) => {
    if (person === "association") return
    setFormData((prev) => ({
      ...prev,
      [person]: { ...prev[person], ...data },
    }))
  }

  const renderStep = () => {
    const step = steps[currentStep]

    switch (step.component) {
      case "association":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Association Name"
                value={formData.association.associationName}
                onChange={(value) => updateAssociationData("associationName", value)}
                placeholder="Enter the full association name"
              />
              <FormField
                label="Association Type"
                type="select"
                value={formData.association.associationType}
                onChange={(value) => updateAssociationData("associationType", value)}
                options={[
                  { value: "", label: "Select association type" },
                  { value: "Religious Organization", label: "Religious Organization (Church, Mosque, etc.)" },
                  { value: "Social Club", label: "Social Club" },
                  { value: "Sports Club", label: "Sports Club" },
                  { value: "Professional Association", label: "Professional Association" },
                  { value: "Community Group", label: "Community Group" },
                  { value: "Cultural Association", label: "Cultural Association" },
                  { value: "Youth Group", label: "Youth Group" },
                  { value: "Women's Group", label: "Women's Group" },
                  { value: "Cooperative Society", label: "Cooperative Society" },
                  { value: "Other", label: "Other" },
                ]}
              />
              {formData.association.associationType === "Other" && (
                <FormField
                  label="Please specify type"
                  value={formData.association.otherType}
                  onChange={(value) => updateAssociationData("otherType", value)}
                  placeholder="Describe your association type"
                />
              )}
              <FormField
                label="Presented By"
                value={formData.association.presentedBy}
                onChange={(value) => updateAssociationData("presentedBy", value)}
                placeholder="Name of person submitting this form"
              />
              <FormField
                label="Membership Type"
                type="select"
                value={formData.association.membershipType}
                onChange={(value) => updateAssociationData("membershipType", value)}
                options={[
                  { value: "", label: "Select membership type" },
                  { value: "Open Membership", label: "Open Membership" },
                  { value: "Restricted Membership", label: "Restricted Membership" },
                  { value: "Invitation Only", label: "Invitation Only" },
                ]}
              />
              <FormField
                label="Initial Number of Members"
                value={formData.association.initialMembers}
                onChange={(value) => updateAssociationData("initialMembers", value)}
                placeholder="e.g., 25"
              />
            </div>

            <FormField
              label="Objectives of Association"
              type="textarea"
              rows={4}
              value={formData.association.objectives}
              onChange={(value) => updateAssociationData("objectives", value)}
              placeholder="Describe the main objectives and purposes of the association..."
            />

            <FormField
              label="Main Activities"
              type="textarea"
              rows={3}
              value={formData.association.activities}
              onChange={(value) => updateAssociationData("activities", value)}
              placeholder="Describe the main activities the association will undertake..."
            />

            <h3 className="text-lg font-medium text-gray-900 mt-8">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Digital Address"
                value={formData.association.digitalAddress}
                onChange={(value) => updateAssociationData("digitalAddress", value)}
                placeholder="e.g., GA-123-4567"
              />
              <FormField
                label="House Number/Building Name"
                value={formData.association.houseNumber}
                onChange={(value) => updateAssociationData("houseNumber", value)}
                placeholder="House number or building name"
              />
              <FormField
                label="Street Name"
                value={formData.association.streetName}
                onChange={(value) => updateAssociationData("streetName", value)}
                placeholder="Street name"
              />
              <FormField
                label="City/District"
                value={formData.association.cityDistrict}
                onChange={(value) => updateAssociationData("cityDistrict", value)}
                placeholder="City or district"
              />
              <FormField
                label="Region"
                type="select"
                value={formData.association.region}
                onChange={(value) => updateAssociationData("region", value)}
                options={[
                  { value: "", label: "Select Region" },
                  ...regions.map((region) => ({ value: region, label: region })),
                ]}
              />
              <FormField
                label="Contact Information"
                value={formData.association.contactInfo}
                onChange={(value) => updateAssociationData("contactInfo", value)}
                placeholder="Phone, email, or P.O. Box"
              />
            </div>

            <h3 className="text-lg font-medium text-gray-900 mt-8">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Governing Document"
                type="select"
                value={formData.association.governingDocument}
                onChange={(value) => updateAssociationData("governingDocument", value)}
                options={[
                  { value: "", label: "Select document type" },
                  { value: "Constitution", label: "Constitution" },
                  { value: "Articles of Association", label: "Articles of Association" },
                  { value: "Bylaws", label: "Bylaws" },
                  { value: "Rules and Regulations", label: "Rules and Regulations" },
                ]}
              />
              <FormField
                label="Registration Purpose"
                type="select"
                value={formData.association.registrationPurpose}
                onChange={(value) => updateAssociationData("registrationPurpose", value)}
                options={[
                  { value: "", label: "Select purpose" },
                  { value: "Legal Recognition", label: "Legal Recognition" },
                  { value: "Bank Account Opening", label: "Bank Account Opening" },
                  { value: "Grant Applications", label: "Grant Applications" },
                  { value: "Tax Exemption", label: "Tax Exemption" },
                  { value: "Property Acquisition", label: "Property Acquisition" },
                  { value: "Other", label: "Other" },
                ]}
              />
              <FormField
                label="Membership Fees (GHS)"
                value={formData.association.membershipFees}
                onChange={(value) => updateAssociationData("membershipFees", value)}
                placeholder="e.g., 50 per year"
              />
              <FormField
                label="Expected Annual Budget (GHS)"
                value={formData.association.expectedBudget}
                onChange={(value) => updateAssociationData("expectedBudget", value)}
                placeholder="e.g., 10000"
              />
            </div>

            <FormField
              label="Funding Sources"
              type="textarea"
              rows={3}
              value={formData.association.fundingSources}
              onChange={(value) => updateAssociationData("fundingSources", value)}
              placeholder="Describe how the association will be funded (membership fees, donations, grants, etc.)..."
            />
          </div>
        )

      case "founder1":
      case "founder2":
      case "founder3":
      case "chairperson":
      case "secretary":
        return (
          <PersonForm
            title={step.title}
            data={formData[step.component as keyof typeof formData] as PersonData}
            onChange={(data) => updatePersonData(step.component as keyof typeof formData, data)}
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
                <div className="flex items-start space-x-3">
                  <span className="font-bold">3.</span>
                  <p>
                    <strong>Constitution/Governing Document:</strong> A copy of your association's constitution or
                    governing document
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
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
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
  )
}

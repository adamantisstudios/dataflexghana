"use client"
import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight, Upload, AlertCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SignatureCanvas } from "@/components/agent/compliance/SignatureCanvas"
import { scrollToElement } from "@/lib/scroll-utils"

interface AssociationFormProps {
  agentId: string
  onComplete: () => void
  onCancel: () => void
}

interface AssociationData {
  associationName: string
  associationType: string
  otherType: string
  presentedBy: string
  objectives: string
  activities: string
  digitalAddress: string
  houseNumber: string
  streetName: string
  cityDistrict: string
  region: string
  contactInfo: string
  membershipType: string
  initialMembers: string
  governingDocument: string
  registrationPurpose: string
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

export function AssociationForm({ agentId, onComplete, onCancel }: AssociationFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCostPopup, setShowCostPopup] = useState(true)
  const formRef = useRef<HTMLDivElement>(null)

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

  const [signatures, setSignatures] = useState({
    founder1: "",
    founder2: "",
    founder3: "",
    chairperson: "",
    secretary: "",
  })

  const [ghanaCards, setGhanaCards] = useState({
    founder1: null as File | null,
    founder2: null as File | null,
    founder3: null as File | null,
    chairperson: null as File | null,
    secretary: null as File | null,
  })

  const steps = [
    { title: "Association Details", component: "association" },
    { title: "Founder 1", component: "founder1" },
    { title: "Founder 2", component: "founder2" },
    { title: "Founder 3", component: "founder3" },
    { title: "Chairperson", component: "chairperson" },
    { title: "Secretary", component: "secretary" },
    { title: "Signatures & Documents", component: "signatures" },
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

  const scrollToFormSection = () => {
    scrollToElement(formRef.current)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setTimeout(scrollToFormSection, 100)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setTimeout(scrollToFormSection, 100)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const formDataToSubmit = new FormData()
      formDataToSubmit.append("agentId", agentId)
      formDataToSubmit.append("formType", "association-registration")
      formDataToSubmit.append("formData", JSON.stringify(formData))

      Object.entries(signatures).forEach(([key, value]) => {
        if (value) {
          formDataToSubmit.append(`signature_${key}`, value)
        }
      })

      Object.entries(ghanaCards).forEach(([key, file]) => {
        if (file) {
          formDataToSubmit.append(`ghanacard_${key}`, file)
        }
      })

      const response = await fetch("/api/agent/compliance/submit", {
        method: "POST",
        body: formDataToSubmit,
      })
      if (response.ok) {
        onComplete()
      } else {
        alert("Error submitting form. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Error submitting form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateAssociationData = (field: keyof AssociationData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      association: { ...prev.association, [field]: value },
    }))
  }

  const updatePersonData = (person: string, data: Partial<PersonData>) => {
    setFormData((prev) => ({
      ...prev,
      [person]: { ...prev[person as keyof typeof prev], ...data },
    }))
  }

  const renderStep = () => {
    const step = steps[currentStep]
    switch (step.component) {
      case "association":
        return (
          <div className="space-y-6 w-full" ref={formRef}>
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Association Name</label>
                <input
                  type="text"
                  value={formData.association.associationName}
                  onChange={(e) => updateAssociationData("associationName", e.target.value)}
                  placeholder="Enter the full association name"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Association Type</label>
                <select
                  value={formData.association.associationType}
                  onChange={(e) => updateAssociationData("associationType", e.target.value)}
                  className="w-full p-2 border rounded text-xs"
                >
                  <option value="">Select association type</option>
                  <option value="Religious Organization">Religious Organization</option>
                  <option value="Social Club">Social Club</option>
                  <option value="Sports Club">Sports Club</option>
                  <option value="Professional Association">Professional Association</option>
                  <option value="Community Group">Community Group</option>
                  <option value="Cultural Association">Cultural Association</option>
                  <option value="Youth Group">Youth Group</option>
                  <option value="Women's Group">Women's Group</option>
                  <option value="Cooperative Society">Cooperative Society</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {formData.association.associationType === "Other" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Please specify type</label>
                  <input
                    type="text"
                    value={formData.association.otherType}
                    onChange={(e) => updateAssociationData("otherType", e.target.value)}
                    placeholder="Describe your association type"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Presented By</label>
                <input
                  type="text"
                  value={formData.association.presentedBy}
                  onChange={(e) => updateAssociationData("presentedBy", e.target.value)}
                  placeholder="Name of person submitting this form"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Membership Type</label>
                <select
                  value={formData.association.membershipType}
                  onChange={(e) => updateAssociationData("membershipType", e.target.value)}
                  className="w-full p-2 border rounded text-xs"
                >
                  <option value="">Select membership type</option>
                  <option value="Open Membership">Open Membership</option>
                  <option value="Restricted Membership">Restricted Membership</option>
                  <option value="Invitation Only">Invitation Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Initial Number of Members</label>
                <input
                  type="text"
                  value={formData.association.initialMembers}
                  onChange={(e) => updateAssociationData("initialMembers", e.target.value)}
                  placeholder="e.g., 25"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Objectives of Association</label>
              <textarea
                value={formData.association.objectives}
                onChange={(e) => updateAssociationData("objectives", e.target.value)}
                placeholder="Describe the main objectives and purposes of the association..."
                rows={4}
                className="w-full p-2 border rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Main Activities</label>
              <textarea
                value={formData.association.activities}
                onChange={(e) => updateAssociationData("activities", e.target.value)}
                placeholder="Describe the main activities the association will undertake..."
                rows={3}
                className="w-full p-2 border rounded text-xs"
              />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-6">Address Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Digital Address</label>
                <input
                  type="text"
                  value={formData.association.digitalAddress}
                  onChange={(e) => updateAssociationData("digitalAddress", e.target.value)}
                  placeholder="e.g., GA-123-4567"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">House Number/Building Name</label>
                  <input
                    type="text"
                    value={formData.association.houseNumber}
                    onChange={(e) => updateAssociationData("houseNumber", e.target.value)}
                    placeholder="House number or building name"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Street Name</label>
                  <input
                    type="text"
                    value={formData.association.streetName}
                    onChange={(e) => updateAssociationData("streetName", e.target.value)}
                    placeholder="Street name"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City/District</label>
                  <input
                    type="text"
                    value={formData.association.cityDistrict}
                    onChange={(e) => updateAssociationData("cityDistrict", e.target.value)}
                    placeholder="City or district"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
                  <select
                    value={formData.association.region}
                    onChange={(e) => updateAssociationData("region", e.target.value)}
                    className="w-full p-2 border rounded text-xs"
                  >
                    <option value="">Select Region</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contact Information</label>
                <input
                  type="text"
                  value={formData.association.contactInfo}
                  onChange={(e) => updateAssociationData("contactInfo", e.target.value)}
                  placeholder="Phone, email, or P.O. Box"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-6">Additional Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Governing Document</label>
                  <select
                    value={formData.association.governingDocument}
                    onChange={(e) => updateAssociationData("governingDocument", e.target.value)}
                    className="w-full p-2 border rounded text-xs"
                  >
                    <option value="">Select document type</option>
                    <option value="Constitution">Constitution</option>
                    <option value="Articles of Association">Articles of Association</option>
                    <option value="Bylaws">Bylaws</option>
                    <option value="Rules and Regulations">Rules and Regulations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Registration Purpose</label>
                  <select
                    value={formData.association.registrationPurpose}
                    onChange={(e) => updateAssociationData("registrationPurpose", e.target.value)}
                    className="w-full p-2 border rounded text-xs"
                  >
                    <option value="">Select purpose</option>
                    <option value="Legal Recognition">Legal Recognition</option>
                    <option value="Bank Account Opening">Bank Account Opening</option>
                    <option value="Grant Applications">Grant Applications</option>
                    <option value="Tax Exemption">Tax Exemption</option>
                    <option value="Property Acquisition">Property Acquisition</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Membership Fees (GHS)</label>
                  <input
                    type="text"
                    value={formData.association.membershipFees}
                    onChange={(e) => updateAssociationData("membershipFees", e.target.value)}
                    placeholder="e.g., 50 per year"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expected Annual Budget (GHS)</label>
                  <input
                    type="text"
                    value={formData.association.expectedBudget}
                    onChange={(e) => updateAssociationData("expectedBudget", e.target.value)}
                    placeholder="e.g., 10000"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Funding Sources</label>
                <textarea
                  value={formData.association.fundingSources}
                  onChange={(e) => updateAssociationData("fundingSources", e.target.value)}
                  placeholder="Describe how the association will be funded..."
                  rows={3}
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
            </div>
          </div>
        )
      case "founder1":
      case "founder2":
      case "founder3":
      case "chairperson":
      case "secretary":
        const personKey = step.component as keyof typeof formData
        const personData = formData[personKey] as PersonData
        return (
          <div className="space-y-6 w-full" ref={formRef}>
            <h3 className="text-lg font-medium text-gray-900">{step.title} Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={personData.fullName}
                    onChange={(e) => updatePersonData(step.component, { fullName: e.target.value })}
                    placeholder="Full name"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={personData.dateOfBirth}
                    onChange={(e) => updatePersonData(step.component, { dateOfBirth: e.target.value })}
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Place of Birth</label>
                  <input
                    type="text"
                    value={personData.placeOfBirth}
                    onChange={(e) => updatePersonData(step.component, { placeOfBirth: e.target.value })}
                    placeholder="Place of birth"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={personData.occupation}
                    onChange={(e) => updatePersonData(step.component, { occupation: e.target.value })}
                    placeholder="Occupation"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={personData.mobileNumber}
                    onChange={(e) => updatePersonData(step.component, { mobileNumber: e.target.value })}
                    placeholder="Mobile number"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={personData.email}
                    onChange={(e) => updatePersonData(step.component, { email: e.target.value })}
                    placeholder="Email address"
                    className="w-full p-2 border rounded text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">TIN Number</label>
                <input
                  type="text"
                  value={personData.tinNumber}
                  onChange={(e) => updatePersonData(step.component, { tinNumber: e.target.value })}
                  placeholder="Tax Identification Number"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-6">Residential Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">House Number</label>
                <input
                  type="text"
                  value={personData.residentialAddress.houseNumber}
                  onChange={(e) =>
                    updatePersonData(step.component, {
                      residentialAddress: { ...personData.residentialAddress, houseNumber: e.target.value },
                    })
                  }
                  placeholder="House number"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Street Name</label>
                <input
                  type="text"
                  value={personData.residentialAddress.streetName}
                  onChange={(e) =>
                    updatePersonData(step.component, {
                      residentialAddress: { ...personData.residentialAddress, streetName: e.target.value },
                    })
                  }
                  placeholder="Street name"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City/District</label>
                <input
                  type="text"
                  value={personData.residentialAddress.cityDistrict}
                  onChange={(e) =>
                    updatePersonData(step.component, {
                      residentialAddress: { ...personData.residentialAddress, cityDistrict: e.target.value },
                    })
                  }
                  placeholder="City/District"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-6">Occupational Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">House Number</label>
                <input
                  type="text"
                  value={personData.occupationalAddress.houseNumber}
                  onChange={(e) =>
                    updatePersonData(step.component, {
                      occupationalAddress: { ...personData.occupationalAddress, houseNumber: e.target.value },
                    })
                  }
                  placeholder="House number"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Street Name</label>
                <input
                  type="text"
                  value={personData.occupationalAddress.streetName}
                  onChange={(e) =>
                    updatePersonData(step.component, {
                      occupationalAddress: { ...personData.occupationalAddress, streetName: e.target.value },
                    })
                  }
                  placeholder="Street name"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City/District</label>
                <input
                  type="text"
                  value={personData.occupationalAddress.cityDistrict}
                  onChange={(e) =>
                    updatePersonData(step.component, {
                      occupationalAddress: { ...personData.occupationalAddress, cityDistrict: e.target.value },
                    })
                  }
                  placeholder="City/District"
                  className="w-full p-2 border rounded text-xs"
                />
              </div>
            </div>
          </div>
        )
      case "signatures":
        return (
          <div className="space-y-6 w-full" ref={formRef}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 text-sm">Signature & Document Collection</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Each person must provide their signature and Ghana Card/ID card upload
                  </p>
                </div>
              </div>
            </div>

            {["founder1", "founder2", "founder3", "chairperson", "secretary"].map((person) => (
              <div key={person} className="mb-8">
                <h4 className="font-medium text-gray-900 mb-4 text-base">
                  {person === "founder1"
                    ? "Founder 1"
                    : person === "founder2"
                      ? "Founder 2"
                      : person === "founder3"
                        ? "Founder 3"
                        : person === "chairperson"
                          ? "Chairperson"
                          : "Secretary"}
                </h4>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
                  <div className="w-full bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <SignatureCanvas
                      onSave={(signature) =>
                        setSignatures((prev) => ({
                          ...prev,
                          [person]: signature,
                        }))
                      }
                      canvasClassName="w-full h-48"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghana Card / ID Card</label>
                  <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setGhanaCards((prev) => ({
                            ...prev,
                            [person]: e.target.files![0],
                          }))
                        }
                      }}
                      className="hidden"
                      id={`ghana-card-${person}`}
                    />
                    <label htmlFor={`ghana-card-${person}`} className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700">
                          {ghanaCards[person as keyof typeof ghanaCards]
                            ? ghanaCards[person as keyof typeof ghanaCards]?.name
                            : "Click to upload Ghana Card"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border-b border-gray-200 my-6"></div>
              </div>
            ))}
          </div>
        )
      case "submit":
        return (
          <div className="space-y-6 w-full" ref={formRef}>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Your Information</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Please review all the information you've provided. Click submit to complete your registration.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-lg font-medium text-green-800 mb-3 text-sm">✓ Form Complete</h4>
              <p className="text-xs text-green-700">
                All required information has been collected. Your association registration will be processed within 14
                working days.
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (showCostPopup) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-emerald-200">
        <div className="px-4 sm:px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Association Registration Fee</h3>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-6 space-y-4">
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-800">Registration Cost:</span>
              <span className="text-base sm:text-lg font-bold text-blue-600">1,444 GHS</span>
            </div>
            
            {/* COMMISSION SECTION ADDED HERE */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
              <span className="text-sm font-medium text-amber-700">Your Commission:</span>
              <span className="text-base sm:text-lg font-bold text-amber-600">50 GHS</span>
            </div>
            
            <div className="border-t border-emerald-200 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700">Duration:</span>
                <span className="text-sm font-medium text-purple-600">14 Working Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700">Delivery:</span>
                <span className="text-sm font-medium text-green-600">Nationwide</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Complete registration of your association with all required documentation and certificates delivered within 14 working days.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs py-2 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowCostPopup(false)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2"
            >
              Proceed
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full mx-0">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <div className="flex justify-between items-center text-xs">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="font-medium">{steps[currentStep].title}</span>
        </div>
      </div>
      <div className="px-4 py-6" ref={formRef}>
        {renderStep()}
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center space-x-2 text-xs bg-transparent"
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
        <span className="text-xs text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </span>
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext} className="flex items-center space-x-2 text-xs">
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center space-x-2 text-xs">
            <span>{isSubmitting ? "Submitting..." : "Submit"}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

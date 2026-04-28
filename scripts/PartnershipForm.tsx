"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Send, Handshake, Plus, Trash2 } from "lucide-react"
import FormProgress from "@/components/FormProgress"
import FormField from "@/components/FormField"
import SidebarAd from "@/components/SidebarAd"
import { formatPartnershipWhatsAppMessage } from "@/lib/whatsapp"

interface PartnershipFormProps {
  onSubmitSuccess: () => void
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
}

interface PartnershipFormData {
  // Section A: Partnership Name
  partnershipName: string

  // Section B: Nature of Business/Sectors
  sectors: string[]
  otherSector: string

  // Section C: Principal Business Activities
  isicCodes: string[]
  businessDescription: string

  // Section D: Business Address Information
  digitalAddress: string
  houseNumber: string
  streetName: string
  city: string
  district: string
  region: string

  // Section E: Registered Office Address
  sameAsBusinessAddress: boolean
  registeredDigitalAddress: string
  registeredHouseNumber: string
  registeredStreetName: string
  registeredCity: string
  registeredDistrict: string
  registeredRegion: string

  // Section F: Other Place of Business
  otherDigitalAddress: string
  otherStreetName: string
  otherCity: string
  otherDistrict: string
  otherRegion: string

  // Section G: Postal Address
  postalType: string
  postalNumber: string
  postalTown: string
  postalRegion: string

  // Section H: Contact Details
  phoneNo1: string
  mobileNo1: string
  email: string
  website: string

  // Partners Details
  partners: PartnerData[]

  // Section I: Particulars of Charges
  assetDescription: string
  chargeCreationDate: string
  chargeAmount: string

  // Section J: MSME Classification
  employmentSize: string
  revenueEnvisaged: string
  partnershipCategory: string

  // Section K: BOP
  bopRequest: string
  bopReferenceNo: string
}

const businessSectors = [
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
]

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
})

const initialFormData: PartnershipFormData = {
  partnershipName: "",
  sectors: [],
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
}

export default function PartnershipForm({ onSubmitSuccess }: PartnershipFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showSidebarAd, setShowSidebarAd] = useState(true)
  const [formData, setFormData] = useState<PartnershipFormData>(initialFormData)

  const steps = [
    { title: "Partnership & Business Details", component: "business" },
    { title: "Address Information", component: "address" },
    { title: "Contact & Postal Details", component: "contact" },
    { title: "Partners Information", component: "partners" },
    { title: "Additional Information", component: "additional" },
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
    const message = formatPartnershipWhatsAppMessage(formData)
    const whatsappUrl = `https://wa.me/233242799990?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    setTimeout(() => {
      onSubmitSuccess()
    }, 1000)
  }

  const updateFormData = (field: keyof PartnershipFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSectorChange = (sector: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sectors: checked ? [...prev.sectors, sector] : prev.sectors.filter((s) => s !== sector),
    }))
  }

  const updatePartnerData = (index: number, field: keyof PartnerData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      partners: prev.partners.map((partner, i) => (i === index ? { ...partner, [field]: value } : partner)),
    }))
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

  const renderStep = () => {
    const step = steps[currentStep]

    switch (step.component) {
      case "business":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                <Handshake className="h-5 w-5 mr-2" />
                Partnership Registration - Incorporated Private Partnerships Act, 1962 (Act 152)
              </h3>
              <p className="text-blue-700 text-sm">
                Complete this form to register an incorporated private partnership. All fields marked with * are
                mandatory.
              </p>
            </div>

            <FormField
              label="Partnership Name *"
              value={formData.partnershipName}
              onChange={(value) => updateFormData("partnershipName", value)}
              placeholder="Enter proposed partnership name"
              helpText="Name should not be duplicated, similar, misleading or undesirable"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Nature of Business/Sector(s) * (Select all applicable)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {businessSectors.map((sector) => (
                  <label key={sector} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.sectors.includes(sector)}
                      onChange={(e) => handleSectorChange(sector, e.target.checked)}
                      className="mr-2"
                    />
                    {sector}
                  </label>
                ))}
              </div>

              {formData.sectors.includes("Others") && (
                <div className="mt-4">
                  <FormField
                    label="Specify Other Sector"
                    value={formData.otherSector}
                    onChange={(value) => updateFormData("otherSector", value)}
                    placeholder="Please specify other sector"
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Principal Business Activities - ISIC Codes
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Find ISIC codes at www.orc.gov.gh. If you cannot determine codes, provide description below.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {formData.isicCodes.map((code, index) => (
                  <FormField
                    key={index}
                    label={`ISIC ${index + 1}`}
                    value={code}
                    onChange={(value) => {
                      const newCodes = [...formData.isicCodes]
                      newCodes[index] = value
                      updateFormData("isicCodes", newCodes)
                    }}
                    placeholder={`ISIC ${index + 1}`}
                  />
                ))}
              </div>

              <FormField
                label="Business Description (if ISIC codes unknown)"
                type="textarea"
                rows={3}
                value={formData.businessDescription}
                onChange={(value) => updateFormData("businessDescription", value)}
                placeholder="Brief description of partnership's business activities"
                helpText="Provide this if you cannot determine ISIC codes"
              />
            </div>
          </div>
        )

      case "address":
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-green-800 mb-4">Principal Place of Business *</h4>
              <p className="text-sm text-green-700 mb-4">
                Obtain a digital address by downloading the Ghana Post GPS app onto any smart phone.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Digital Address *"
                  value={formData.digitalAddress}
                  onChange={(value) => updateFormData("digitalAddress", value)}
                  placeholder="e.g., GA-123-4567"
                  required
                />
                <FormField
                  label="House/Building/Flat *"
                  value={formData.houseNumber}
                  onChange={(value) => updateFormData("houseNumber", value)}
                  placeholder="House number or building name"
                  required
                />
              </div>

              <FormField
                label="Street Name *"
                value={formData.streetName}
                onChange={(value) => updateFormData("streetName", value)}
                placeholder="Street name"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="City *"
                  value={formData.city}
                  onChange={(value) => updateFormData("city", value)}
                  placeholder="City"
                  required
                />
                <FormField
                  label="District *"
                  value={formData.district}
                  onChange={(value) => updateFormData("district", value)}
                  placeholder="District"
                  required
                />
                <FormField
                  label="Region *"
                  value={formData.region}
                  onChange={(value) => updateFormData("region", value)}
                  placeholder="Region"
                  required
                />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-purple-800 mb-4">Registered Office Address</h4>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sameAsBusinessAddress}
                    onChange={(e) => updateFormData("sameAsBusinessAddress", e.target.checked)}
                    className="mr-2"
                  />
                  Same as Principal Place of Business
                </label>
              </div>

              {!formData.sameAsBusinessAddress && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Digital Address *"
                      value={formData.registeredDigitalAddress}
                      onChange={(value) => updateFormData("registeredDigitalAddress", value)}
                      placeholder="e.g., GA-123-4567"
                      required
                    />
                    <FormField
                      label="House/Building/Flat *"
                      value={formData.registeredHouseNumber}
                      onChange={(value) => updateFormData("registeredHouseNumber", value)}
                      placeholder="House number or building name"
                      required
                    />
                  </div>

                  <FormField
                    label="Street Name *"
                    value={formData.registeredStreetName}
                    onChange={(value) => updateFormData("registeredStreetName", value)}
                    placeholder="Street name"
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      label="City *"
                      value={formData.registeredCity}
                      onChange={(value) => updateFormData("registeredCity", value)}
                      placeholder="City"
                      required
                    />
                    <FormField
                      label="District *"
                      value={formData.registeredDistrict}
                      onChange={(value) => updateFormData("registeredDistrict", value)}
                      placeholder="District"
                      required
                    />
                    <FormField
                      label="Region *"
                      value={formData.registeredRegion}
                      onChange={(value) => updateFormData("registeredRegion", value)}
                      placeholder="Region"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-orange-800 mb-4">Other Place of Business (Optional)</h4>

              <FormField
                label="Digital Address"
                value={formData.otherDigitalAddress}
                onChange={(value) => updateFormData("otherDigitalAddress", value)}
                placeholder="e.g., GA-123-4567"
              />

              <FormField
                label="Street Name"
                value={formData.otherStreetName}
                onChange={(value) => updateFormData("otherStreetName", value)}
                placeholder="Street name"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="City"
                  value={formData.otherCity}
                  onChange={(value) => updateFormData("otherCity", value)}
                  placeholder="City"
                />
                <FormField
                  label="District"
                  value={formData.otherDistrict}
                  onChange={(value) => updateFormData("otherDistrict", value)}
                  placeholder="District"
                />
                <FormField
                  label="Region"
                  value={formData.otherRegion}
                  onChange={(value) => updateFormData("otherRegion", value)}
                  placeholder="Region"
                />
              </div>
            </div>
          </div>
        )

      case "contact":
        return (
          <div className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-teal-800 mb-4">Postal Address</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Postal Type</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="postalType"
                        value="P.O. Box"
                        checked={formData.postalType === "P.O. Box"}
                        onChange={(e) => updateFormData("postalType", e.target.value)}
                        className="mr-2"
                      />
                      P.O. Box
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="postalType"
                        value="Private Bag"
                        checked={formData.postalType === "Private Bag"}
                        onChange={(e) => updateFormData("postalType", e.target.value)}
                        className="mr-2"
                      />
                      Private Bag
                    </label>
                  </div>
                </div>

                <FormField
                  label="Postal Number"
                  value={formData.postalNumber}
                  onChange={(value) => updateFormData("postalNumber", value)}
                  placeholder="Postal number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Town"
                  value={formData.postalTown}
                  onChange={(value) => updateFormData("postalTown", value)}
                  placeholder="Postal town"
                />
                <FormField
                  label="Region"
                  value={formData.postalRegion}
                  onChange={(value) => updateFormData("postalRegion", value)}
                  placeholder="Postal region"
                />
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-indigo-800 mb-4">Contact Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Phone No. 1"
                  value={formData.phoneNo1}
                  onChange={(value) => updateFormData("phoneNo1", value)}
                  placeholder="Primary phone number"
                />
                <FormField
                  label="Mobile No. 1 *"
                  value={formData.mobileNo1}
                  onChange={(value) => updateFormData("mobileNo1", value)}
                  placeholder="Primary mobile number"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(value) => updateFormData("email", value)}
                  placeholder="Partnership email address"
                  required
                />
                <FormField
                  label="Website"
                  value={formData.website}
                  onChange={(value) => updateFormData("website", value)}
                  placeholder="Partnership website (optional)"
                />
              </div>
            </div>
          </div>
        )

      case "partners":
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-yellow-800">Partners Information</h4>
                <button
                  onClick={addPartner}
                  className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Partner</span>
                </button>
              </div>
              <p className="text-yellow-700 text-sm mb-4">
                Minimum of 2 partners required. All partners must provide complete information.
              </p>

              {formData.partners.map((partner, index) => (
                <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="text-md font-medium text-gray-800">Partner {index + 1}</h5>
                    {formData.partners.length > 2 && (
                      <button
                        onClick={() => removePartner(index)}
                        className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="TIN"
                      value={partner.tin}
                      onChange={(value) => updatePartnerData(index, "tin", value)}
                      placeholder="Taxpayer Identification Number"
                    />
                    <FormField
                      label="Ghana Card No. *"
                      value={partner.ghanaCard}
                      onChange={(value) => updatePartnerData(index, "ghanaCard", value)}
                      placeholder="Ghana Card number"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <FormField
                      label="Title"
                      type="select"
                      value={partner.title}
                      onChange={(value) => updatePartnerData(index, "title", value)}
                      options={[
                        { value: "", label: "Select title" },
                        { value: "Mr.", label: "Mr." },
                        { value: "Mrs.", label: "Mrs." },
                        { value: "Miss", label: "Miss" },
                        { value: "Ms.", label: "Ms." },
                        { value: "Dr.", label: "Dr." },
                        { value: "Prof.", label: "Prof." },
                        { value: "Rev.", label: "Rev." },
                        { value: "Hon.", label: "Hon." },
                      ]}
                    />
                    <FormField
                      label="First Name *"
                      value={partner.firstName}
                      onChange={(value) => updatePartnerData(index, "firstName", value)}
                      placeholder="First name"
                      required
                    />
                    <FormField
                      label="Middle Name"
                      value={partner.middleName}
                      onChange={(value) => updatePartnerData(index, "middleName", value)}
                      placeholder="Middle name"
                    />
                    <FormField
                      label="Last Name *"
                      value={partner.lastName}
                      onChange={(value) => updatePartnerData(index, "lastName", value)}
                      placeholder="Last name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      label="Former Name"
                      value={partner.formerName}
                      onChange={(value) => updatePartnerData(index, "formerName", value)}
                      placeholder="Former name (if applicable)"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Gender *</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`gender-${index}`}
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
                            name={`gender-${index}`}
                            value="Female"
                            checked={partner.gender === "Female"}
                            onChange={(e) => updatePartnerData(index, "gender", e.target.value)}
                            className="mr-2"
                          />
                          Female
                        </label>
                      </div>
                    </div>
                    <FormField
                      label="Date of Birth *"
                      type="date"
                      value={partner.dateOfBirth}
                      onChange={(value) => updatePartnerData(index, "dateOfBirth", value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Nationality *"
                      value={partner.nationality}
                      onChange={(value) => updatePartnerData(index, "nationality", value)}
                      placeholder="Nationality"
                      required
                    />
                    <FormField
                      label="Occupation *"
                      value={partner.occupation}
                      onChange={(value) => updatePartnerData(index, "occupation", value)}
                      placeholder="Occupation"
                      required
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <h6 className="text-sm font-medium text-gray-800 mb-3">Residential Address</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        label="House Number"
                        value={partner.houseNumber}
                        onChange={(value) => updatePartnerData(index, "houseNumber", value)}
                        placeholder="House number"
                      />
                      <FormField
                        label="Street Name"
                        value={partner.streetName}
                        onChange={(value) => updatePartnerData(index, "streetName", value)}
                        placeholder="Street name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        label="City *"
                        value={partner.city}
                        onChange={(value) => updatePartnerData(index, "city", value)}
                        placeholder="City"
                        required
                      />
                      <FormField
                        label="District *"
                        value={partner.district}
                        onChange={(value) => updatePartnerData(index, "district", value)}
                        placeholder="District"
                        required
                      />
                      <FormField
                        label="Region *"
                        value={partner.region}
                        onChange={(value) => updatePartnerData(index, "region", value)}
                        placeholder="Region"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        label="Mobile No. 1 *"
                        value={partner.mobileNo1}
                        onChange={(value) => updatePartnerData(index, "mobileNo1", value)}
                        placeholder="Primary mobile number"
                        required
                      />
                      <FormField
                        label="Mobile No. 2"
                        value={partner.mobileNo2}
                        onChange={(value) => updatePartnerData(index, "mobileNo2", value)}
                        placeholder="Secondary mobile number"
                      />
                      <FormField
                        label="Email"
                        type="email"
                        value={partner.email}
                        onChange={(value) => updatePartnerData(index, "email", value)}
                        placeholder="Partner's email"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case "additional":
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-red-800 mb-4">Particulars of Charges (Optional)</h4>
              <p className="text-red-700 text-sm mb-4">
                Complete this section if the partnership has any charges on its assets.
              </p>

              <FormField
                label="Description of Asset"
                type="textarea"
                rows={3}
                value={formData.assetDescription}
                onChange={(value) => updateFormData("assetDescription", value)}
                placeholder="Description of asset subject to charge"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Date of Creation of Charge"
                  type="date"
                  value={formData.chargeCreationDate}
                  onChange={(value) => updateFormData("chargeCreationDate", value)}
                />
                <FormField
                  label="Amount of Charge (GHS)"
                  type="number"
                  value={formData.chargeAmount}
                  onChange={(value) => updateFormData("chargeAmount", value)}
                  placeholder="Amount in Ghana Cedis"
                />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-green-800 mb-4">MSME Classification</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Employment Size</label>
                  <div className="space-y-2">
                    {["1-5", "6-29", "30-99", "100+"].map((size) => (
                      <label key={size} className="flex items-center">
                        <input
                          type="radio"
                          name="employmentSize"
                          value={size}
                          checked={formData.employmentSize === size}
                          onChange={(e) => updateFormData("employmentSize", e.target.value)}
                          className="mr-2"
                        />
                        {size} employees
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Revenue Envisaged (GHS)</label>
                  <div className="space-y-2">
                    {["Below 500,000", "500,000 - 2,000,000", "2,000,001 - 10,000,000", "Above 10,000,000"].map(
                      (revenue) => (
                        <label key={revenue} className="flex items-center">
                          <input
                            type="radio"
                            name="revenueEnvisaged"
                            value={revenue}
                            checked={formData.revenueEnvisaged === revenue}
                            onChange={(e) => updateFormData("revenueEnvisaged", e.target.value)}
                            className="mr-2"
                          />
                          {revenue}
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Partnership Category</label>
                <div className="space-y-2">
                  {["Micro", "Small", "Medium", "Large"].map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="radio"
                        name="partnershipCategory"
                        value={category}
                        checked={formData.partnershipCategory === category}
                        onChange={(e) => updateFormData("partnershipCategory", e.target.value)}
                        className="mr-2"
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-800 mb-4">BOP (Business Operating Permit)</h4>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Do you want to request for BOP?</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bopRequest"
                      value="Yes"
                      checked={formData.bopRequest === "Yes"}
                      onChange={(e) => updateFormData("bopRequest", e.target.value)}
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
                      onChange={(e) => updateFormData("bopRequest", e.target.value)}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              {formData.bopRequest === "Yes" && (
                <FormField
                  label="BOP Reference No. (if available)"
                  value={formData.bopReferenceNo}
                  onChange={(value) => updateFormData("bopReferenceNo", value)}
                  placeholder="BOP reference number"
                />
              )}
            </div>
          </div>
        )

      case "submit":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Your Partnership Registration</h3>
              <p className="text-gray-600 mb-6">
                Please review all the information you've provided. When you click submit, you'll be redirected to
                WhatsApp to complete your partnership registration.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-red-800 mb-4">📸 Required Documents</h4>
              <div className="space-y-3 text-sm text-red-700">
                <div className="flex items-start space-x-3">
                  <span className="font-bold">1.</span>
                  <p>
                    <strong>Partners' Ghana Cards:</strong> Clear photos of all partners' Ghana Cards (front and back)
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-bold">2.</span>
                  <p>
                    <strong>Partners' Passport Photos:</strong> Recent passport-sized photographs of all partners
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-bold">3.</span>
                  <p>
                    <strong>Signatures:</strong> All partners must sign on plain white paper and take clear photos
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-bold">4.</span>
                  <p>
                    <strong>Thumbprints:</strong> All partners' thumbprints on plain white paper (clear photos)
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-bold">5.</span>
                  <p>
                    <strong>Partnership Agreement:</strong> Signed partnership agreement or deed (if available)
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-bold">6.</span>
                  <p>
                    <strong>Business Premises:</strong> Photos of business premises or lease agreement
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
                <li>Provide all partners' signatures and thumbprints</li>
                <li>Submit partnership agreement (if available)</li>
                <li>Wait for processing confirmation</li>
                <li>Receive partnership certificate when ready</li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-amber-800 mb-2">⚠️ Important Notes</h4>
              <ul className="text-amber-700 text-sm space-y-1">
                <li>• Partnership name must be unique and not misleading</li>
                <li>• Minimum of 2 partners required for registration</li>
                <li>• All partners must be 18 years or older</li>
                <li>• Processing time: 5-10 working days</li>
                <li>• Registration fees apply as per current rates</li>
                <li>• All documents must be clear and legible</li>
                <li>• Partnership agreement recommended but not mandatory</li>
                <li>• BOP application processed separately if requested</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-green-800 mb-2">✅ After Registration</h4>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Partnership certificate will be issued</li>
                <li>• TIN registration can be done separately</li>
                <li>• Bank account can be opened with certificate</li>
                <li>• Annual returns must be filed</li>
                <li>• Changes must be reported to Registrar</li>
              </ul>
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

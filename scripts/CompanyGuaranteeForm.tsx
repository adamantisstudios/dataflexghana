"use client"

import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight, Send } from "lucide-react"
import FormProgress from "@/components/FormProgress"
import FormField from "@/components/FormField"
import { formatWhatsAppMessage } from "@/lib/whatsapp"

interface CompanyGuaranteeFormProps {
  onSubmitSuccess: () => void
}

interface CompanyGuaranteeData {
  // Company Information
  companyName: string
  sector: string
  otherSector: string
  sectors: string[]

  // Address Information
  digitalAddress: string
  houseNumber: string
  streetName: string
  city: string
  district: string
  region: string
  ownershipType: string
  landlordName: string

  // Principal Place of Business
  sameAddress: boolean
  principalDigitalAddress: string
  principalHouseNumber: string
  principalStreetName: string
  principalCity: string
  principalDistrict: string
  principalRegion: string

  // Contact Information
  postalType: string
  postalNumber: string
  postalTown: string
  postalRegion: string
  phoneNo1: string
  phoneNo2: string
  mobileNo1: string
  mobileNo2: string
  fax: string
  businessEmail: string
  website: string

  // Directors Information
  directors: Array<{
    title: string
    firstName: string
    middleName: string
    lastName: string
    formerName: string
    gender: string
    dateOfBirth: string
    nationality: string
    occupation: string
    tin: string
    ghanaCardNumber: string
    residentialDigitalAddress: string
    residentialHouseNumber: string
    residentialStreetName: string
    residentialCity: string
    residentialDistrict: string
    residentialRegion: string
    country: string
  }>

  // Additional Information
  revenue: string
  employees: string
  bopRequest: string
  bopReference: string
  applicantName: string
  declarationDate: string

  // ISIC Codes
  isic1: string
  isic2: string
  isic3: string
  isic4: string
  isic5: string
  businessDescription: string
}

export default function CompanyGuaranteeForm({ onSubmitSuccess }: CompanyGuaranteeFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<CompanyGuaranteeData>({
    companyName: "",
    sector: "",
    otherSector: "",
    sectors: [],
    digitalAddress: "",
    houseNumber: "",
    streetName: "",
    city: "",
    district: "",
    region: "",
    ownershipType: "",
    landlordName: "",
    sameAddress: false,
    principalDigitalAddress: "",
    principalHouseNumber: "",
    principalStreetName: "",
    principalCity: "",
    principalDistrict: "",
    principalRegion: "",
    postalType: "",
    postalNumber: "",
    postalTown: "",
    postalRegion: "",
    phoneNo1: "",
    phoneNo2: "",
    mobileNo1: "",
    mobileNo2: "",
    fax: "",
    businessEmail: "",
    website: "",
    directors: [
      {
        title: "",
        firstName: "",
        middleName: "",
        lastName: "",
        formerName: "",
        gender: "",
        dateOfBirth: "",
        nationality: "Ghanaian",
        occupation: "",
        tin: "",
        ghanaCardNumber: "",
        residentialDigitalAddress: "",
        residentialHouseNumber: "",
        residentialStreetName: "",
        residentialCity: "",
        residentialDistrict: "",
        residentialRegion: "",
        country: "Ghana",
      },
    ],
    revenue: "",
    employees: "",
    bopRequest: "",
    bopReference: "",
    applicantName: "",
    declarationDate: new Date().toISOString().split("T")[0],
    isic1: "",
    isic2: "",
    isic3: "",
    isic4: "",
    isic5: "",
    businessDescription: "",
  })

  const steps = [
    { title: "Company Information", component: "company" },
    { title: "Address Information", component: "address" },
    { title: "Contact Information", component: "contact" },
    { title: "Directors Information", component: "directors" },
    { title: "Additional Information", component: "additional" },
    { title: "Review & Submit", component: "submit" },
  ]

  const regions = [
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

  const businessSectors = [
    "Agriculture and Agribusiness",
    "Mining and Quarrying",
    "Oil and Gas",
    "Information and Communication Technology (ICT)",
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

  const employmentSizes = [
    "1-5 employees",
    "6-10 employees",
    "11-20 employees",
    "21-50 employees",
    "51-100 employees",
    "101-250 employees",
    "251-500 employees",
    "Above 500 employees",
  ]

  const revenueRanges = [
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

  const bopOptions = ["Apply for BOP Now", "Apply for BOP Later", "Already have a BOP", "Not Required for my business"]

  const titles = ["Mr.", "Mrs.", "Ms.", "Miss", "Dr.", "Prof.", "Rev.", "Pastor", "Imam", "Chief", "Hon.", "Nana"]

  const genders = ["Male", "Female"]

  const postalTypes = ["P.O. Box", "Private Bag", "LMB (Large Mail Box)", "PMB (Private Mail Bag)"]

  const scrollToProgressBar = () => {
    if (progressBarRef.current) {
      progressBarRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsTransitioning(false)
        scrollToProgressBar()
      }, 300)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsTransitioning(false)
        scrollToProgressBar()
      }, 300)
    }
  }

  const handleSubmit = () => {
    const message = formatWhatsAppMessage(formData, "Company Limited by Guarantee")
    const whatsappUrl = `https://wa.me/233242799990?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    setTimeout(() => {
      onSubmitSuccess()
    }, 1000)
  }

  const updateFormData = (field: keyof CompanyGuaranteeData, value: string | boolean | any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addDirector = () => {
    setFormData((prev) => ({
      ...prev,
      directors: [
        ...prev.directors,
        {
          title: "",
          firstName: "",
          middleName: "",
          lastName: "",
          formerName: "",
          gender: "",
          dateOfBirth: "",
          nationality: "Ghanaian",
          occupation: "",
          tin: "",
          ghanaCardNumber: "",
          residentialDigitalAddress: "",
          residentialHouseNumber: "",
          residentialStreetName: "",
          residentialCity: "",
          residentialDistrict: "",
          residentialRegion: "",
          country: "Ghana",
        },
      ],
    }))
  }

  const removeDirector = (index: number) => {
    if (formData.directors.length > 1) {
      setFormData((prev) => ({
        ...prev,
        directors: prev.directors.filter((_, i) => i !== index),
      }))
    }
  }

  const updateDirector = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      directors: prev.directors.map((director, i) => (i === index ? { ...director, [field]: value } : director)),
    }))
  }

  const renderStep = () => {
    const step = steps[currentStep]

    switch (step.component) {
      case "company":
        return (
          <div
            className={`space-y-6 transition-all duration-300 ${isTransitioning ? "opacity-0 transform translate-y-4" : "opacity-100 transform translate-y-0"}`}
          >
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Section A & B:</strong> Provide basic information about your company including the name and
                primary sector of operation. Companies limited by guarantee are typically NGOs or non-profit
                organizations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Company Name"
                value={formData.companyName}
                onChange={(value) => updateFormData("companyName", value)}
                placeholder="Enter your company name"
              />
              <FormField
                label="Nature of Business/Sector(s)"
                type="select"
                value={formData.sector}
                onChange={(value) => {
                  updateFormData("sector", value)
                  updateFormData("sectors", value ? [value] : [])
                }}
                options={[
                  { value: "", label: "Select all applicable business sectors" },
                  ...businessSectors.map((sector) => ({ value: sector, label: sector })),
                ]}
              />
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-4">
                  Select the primary sector your company operates in. If your company doesn't fit the listed categories,
                  select "Other" and specify below.
                </p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-md font-medium text-gray-900 mb-4">Principal Business Activities - ISIC Codes</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Find ISIC codes at www.orc.gov.gh. If you cannot determine codes, provide description in the text area
                  below.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <FormField
                    label="ISIC 1"
                    value={formData.isic1 || ""}
                    onChange={(value) => updateFormData("isic1", value)}
                    placeholder="Enter ISIC code"
                  />
                  <FormField
                    label="ISIC 2"
                    value={formData.isic2 || ""}
                    onChange={(value) => updateFormData("isic2", value)}
                    placeholder="Enter ISIC code"
                  />
                  <FormField
                    label="ISIC 3"
                    value={formData.isic3 || ""}
                    onChange={(value) => updateFormData("isic3", value)}
                    placeholder="Enter ISIC code"
                  />
                  <FormField
                    label="ISIC 4"
                    value={formData.isic4 || ""}
                    onChange={(value) => updateFormData("isic4", value)}
                    placeholder="Enter ISIC code"
                  />
                  <FormField
                    label="ISIC 5"
                    value={formData.isic5 || ""}
                    onChange={(value) => updateFormData("isic5", value)}
                    placeholder="Enter ISIC code"
                  />
                </div>
                <FormField
                  label="Business Description (if ISIC codes unknown)"
                  type="textarea"
                  rows={3}
                  value={formData.businessDescription || ""}
                  onChange={(value) => updateFormData("businessDescription", value)}
                  placeholder="Provide detailed description of your company activities if you cannot determine ISIC codes"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Provide this detailed description only if you cannot determine the appropriate ISIC codes for your
                  company.
                </p>
              </div>
              {formData.sector === "Other" && (
                <div className="md:col-span-2">
                  <FormField
                    label="Please specify your business sector"
                    value={formData.otherSector}
                    onChange={(value) => updateFormData("otherSector", value)}
                    placeholder="Describe your business sector in detail"
                  />
                </div>
              )}
            </div>
          </div>
        )

      case "address":
        return (
          <div
            className={`space-y-6 transition-all duration-300 ${isTransitioning ? "opacity-0 transform translate-y-4" : "opacity-100 transform translate-y-0"}`}
          >
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <p className="text-green-800 text-sm">
                <strong>Section D & E:</strong> Provide your company registered office address and principal place of
                business. The registered office is the official address for legal correspondence.
              </p>
            </div>

            <h3 className="text-lg font-medium text-gray-900">Registered Office Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Digital Address (Ghana Post GPS)"
                value={formData.digitalAddress}
                onChange={(value) => updateFormData("digitalAddress", value)}
                placeholder="e.g., GA-123-4567"
              />
              <FormField
                label="House Number/Building Name"
                value={formData.houseNumber}
                onChange={(value) => updateFormData("houseNumber", value)}
                placeholder="House number or building name"
              />
              <FormField
                label="Street Name"
                value={formData.streetName}
                onChange={(value) => updateFormData("streetName", value)}
                placeholder="Street name"
              />
              <FormField
                label="City/Town"
                value={formData.city}
                onChange={(value) => updateFormData("city", value)}
                placeholder="City or town"
              />
              <FormField
                label="District"
                value={formData.district}
                onChange={(value) => updateFormData("district", value)}
                placeholder="District"
              />
              <FormField
                label="Region"
                type="select"
                value={formData.region}
                onChange={(value) => updateFormData("region", value)}
                options={[
                  { value: "", label: "Select Region" },
                  ...regions.map((region) => ({ value: region, label: region })),
                ]}
              />
              <FormField
                label="Ownership Type"
                type="select"
                value={formData.ownershipType}
                onChange={(value) => updateFormData("ownershipType", value)}
                options={[
                  { value: "", label: "Select Ownership Type" },
                  { value: "Owned", label: "Owned" },
                  { value: "Rented", label: "Rented" },
                  { value: "Family Property", label: "Family Property" },
                  { value: "Company Property", label: "Company Property" },
                  { value: "Government Property", label: "Government Property" },
                ]}
              />
              {formData.ownershipType === "Rented" && (
                <FormField
                  label="Landlord's Full Name"
                  value={formData.landlordName}
                  onChange={(value) => updateFormData("landlordName", value)}
                  placeholder="Enter landlord's full name"
                />
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Principal Place of Business</h3>
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.sameAddress}
                    onChange={(e) => updateFormData("sameAddress", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Same as registered office address</span>
                </label>
              </div>

              {!formData.sameAddress && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Digital Address (Ghana Post GPS)"
                    value={formData.principalDigitalAddress}
                    onChange={(value) => updateFormData("principalDigitalAddress", value)}
                    placeholder="e.g., GA-123-4567"
                  />
                  <FormField
                    label="House Number/Building Name"
                    value={formData.principalHouseNumber}
                    onChange={(value) => updateFormData("principalHouseNumber", value)}
                    placeholder="House number or building name"
                  />
                  <FormField
                    label="Street Name"
                    value={formData.principalStreetName}
                    onChange={(value) => updateFormData("principalStreetName", value)}
                    placeholder="Street name"
                  />
                  <FormField
                    label="City/Town"
                    value={formData.principalCity}
                    onChange={(value) => updateFormData("principalCity", value)}
                    placeholder="City or town"
                  />
                  <FormField
                    label="District"
                    value={formData.principalDistrict}
                    onChange={(value) => updateFormData("principalDistrict", value)}
                    placeholder="District"
                  />
                  <FormField
                    label="Region"
                    type="select"
                    value={formData.principalRegion}
                    onChange={(value) => updateFormData("principalRegion", value)}
                    options={[
                      { value: "", label: "Select Region" },
                      ...regions.map((region) => ({ value: region, label: region })),
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        )

      case "contact":
        return (
          <div
            className={`space-y-6 transition-all duration-300 ${isTransitioning ? "opacity-0 transform translate-y-4" : "opacity-100 transform translate-y-0"}`}
          >
            <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-6">
              <p className="text-purple-800 text-sm">
                <strong>Section G & H:</strong> Provide postal address and contact information for your company. This
                information will be used for official correspondence and communication.
              </p>
            </div>

            <h3 className="text-lg font-medium text-gray-900">Postal Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Postal Type"
                type="select"
                value={formData.postalType}
                onChange={(value) => updateFormData("postalType", value)}
                options={[
                  { value: "", label: "Select Postal Type" },
                  ...postalTypes.map((type) => ({ value: type, label: type })),
                ]}
              />
              <FormField
                label="Postal Number"
                value={formData.postalNumber}
                onChange={(value) => updateFormData("postalNumber", value)}
                placeholder="Enter postal number"
              />
              <FormField
                label="Postal Town"
                value={formData.postalTown}
                onChange={(value) => updateFormData("postalTown", value)}
                placeholder="Enter town"
              />
              <FormField
                label="Postal Region"
                type="select"
                value={formData.postalRegion}
                onChange={(value) => updateFormData("postalRegion", value)}
                options={[
                  { value: "", label: "Select Region" },
                  ...regions.map((region) => ({ value: region, label: region })),
                ]}
              />
            </div>

            <h3 className="text-lg font-medium text-gray-900 mt-8">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Primary Phone Number"
                type="tel"
                value={formData.phoneNo1}
                onChange={(value) => updateFormData("phoneNo1", value)}
                placeholder="+233 XX XXX XXXX"
              />
              <FormField
                label="Secondary Phone Number"
                type="tel"
                value={formData.phoneNo2}
                onChange={(value) => updateFormData("phoneNo2", value)}
                placeholder="+233 XX XXX XXXX"
              />
              <FormField
                label="Primary Mobile Number"
                type="tel"
                value={formData.mobileNo1}
                onChange={(value) => updateFormData("mobileNo1", value)}
                placeholder="+233 XX XXX XXXX"
              />
              <FormField
                label="Secondary Mobile Number"
                type="tel"
                value={formData.mobileNo2}
                onChange={(value) => updateFormData("mobileNo2", value)}
                placeholder="+233 XX XXX XXXX"
              />
              <FormField
                label="Fax Number"
                type="tel"
                value={formData.fax}
                onChange={(value) => updateFormData("fax", value)}
                placeholder="Fax number (optional)"
              />
              <FormField
                label="Business Email Address"
                type="email"
                value={formData.businessEmail}
                onChange={(value) => updateFormData("businessEmail", value)}
                placeholder="business@example.com"
              />
              <div className="md:col-span-2">
                <FormField
                  label="Business Website"
                  value={formData.website}
                  onChange={(value) => updateFormData("website", value)}
                  placeholder="https://www.yourcompany.com (optional)"
                />
              </div>
            </div>
          </div>
        )

      case "directors":
        return (
          <div
            className={`space-y-6 transition-all duration-300 ${isTransitioning ? "opacity-0 transform translate-y-4" : "opacity-100 transform translate-y-0"}`}
          >
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
              <p className="text-orange-800 text-sm">
                <strong>Section I:</strong> Provide information about the company directors. At least one director is
                required for a company limited by guarantee.
              </p>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Directors Information</h3>
              <button
                type="button"
                onClick={addDirector}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Director
              </button>
            </div>

            {formData.directors.map((director, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">Director {index + 1}</h4>
                  {formData.directors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDirector(index)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Title"
                    type="select"
                    value={director.title}
                    onChange={(value) => updateDirector(index, "title", value)}
                    options={[
                      { value: "", label: "Select Title" },
                      ...titles.map((title) => ({ value: title, label: title })),
                    ]}
                  />
                  <FormField
                    label="First Name"
                    value={director.firstName}
                    onChange={(value) => updateDirector(index, "firstName", value)}
                    placeholder="Enter first name"
                  />
                  <FormField
                    label="Middle Name"
                    value={director.middleName}
                    onChange={(value) => updateDirector(index, "middleName", value)}
                    placeholder="Enter middle name (optional)"
                  />
                  <FormField
                    label="Last Name/Surname"
                    value={director.lastName}
                    onChange={(value) => updateDirector(index, "lastName", value)}
                    placeholder="Enter last name"
                  />
                  <FormField
                    label="Any Former Name"
                    value={director.formerName}
                    onChange={(value) => updateDirector(index, "formerName", value)}
                    placeholder="Previous name if changed (optional)"
                  />
                  <FormField
                    label="Gender"
                    type="select"
                    value={director.gender}
                    onChange={(value) => updateDirector(index, "gender", value)}
                    options={[
                      { value: "", label: "Select Gender" },
                      ...genders.map((gender) => ({ value: gender, label: gender })),
                    ]}
                  />
                  <FormField
                    label="Date of Birth"
                    type="date"
                    value={director.dateOfBirth}
                    onChange={(value) => updateDirector(index, "dateOfBirth", value)}
                  />
                  <FormField
                    label="Nationality"
                    value={director.nationality}
                    onChange={(value) => updateDirector(index, "nationality", value)}
                    placeholder="Enter nationality"
                  />
                  <FormField
                    label="Occupation"
                    value={director.occupation}
                    onChange={(value) => updateDirector(index, "occupation", value)}
                    placeholder="Enter occupation"
                  />
                  <FormField
                    label="TIN (Tax Identification Number)"
                    value={director.tin}
                    onChange={(value) => updateDirector(index, "tin", value)}
                    placeholder="Enter TIN if available"
                  />
                  <FormField
                    label="Ghana Card Number"
                    value={director.ghanaCardNumber}
                    onChange={(value) => updateDirector(index, "ghanaCardNumber", value)}
                    placeholder="Enter Ghana Card ID number"
                  />
                </div>

                <h5 className="text-md font-medium text-gray-900 mt-6 mb-4">Residential Address</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Digital Address (Ghana Post GPS)"
                    value={director.residentialDigitalAddress}
                    onChange={(value) => updateDirector(index, "residentialDigitalAddress", value)}
                    placeholder="e.g., GA-123-4567"
                  />
                  <FormField
                    label="House Number/Building Name"
                    value={director.residentialHouseNumber}
                    onChange={(value) => updateDirector(index, "residentialHouseNumber", value)}
                    placeholder="House number or building name"
                  />
                  <FormField
                    label="Street Name"
                    value={director.residentialStreetName}
                    onChange={(value) => updateDirector(index, "residentialStreetName", value)}
                    placeholder="Street name"
                  />
                  <FormField
                    label="City/Town"
                    value={director.residentialCity}
                    onChange={(value) => updateDirector(index, "residentialCity", value)}
                    placeholder="City or town"
                  />
                  <FormField
                    label="District"
                    value={director.residentialDistrict}
                    onChange={(value) => updateDirector(index, "residentialDistrict", value)}
                    placeholder="District"
                  />
                  <FormField
                    label="Region"
                    type="select"
                    value={director.residentialRegion}
                    onChange={(value) => updateDirector(index, "residentialRegion", value)}
                    options={[
                      { value: "", label: "Select Region" },
                      ...regions.map((region) => ({ value: region, label: region })),
                    ]}
                  />
                  <FormField
                    label="Country"
                    value={director.country}
                    onChange={(value) => updateDirector(index, "country", value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            ))}
          </div>
        )

      case "additional":
        return (
          <div
            className={`space-y-6 transition-all duration-300 ${isTransitioning ? "opacity-0 transform translate-y-4" : "opacity-100 transform translate-y-0"}`}
          >
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-6">
              <p className="text-indigo-800 text-sm">
                <strong>Section K, L & M:</strong> Provide MSME details, Business Operating Permit information, and
                complete the declaration. This finalizes your application.
              </p>
            </div>

            <h3 className="text-lg font-medium text-gray-900">MSME Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Employment Size"
                type="select"
                value={formData.employees}
                onChange={(value) => updateFormData("employees", value)}
                options={[
                  { value: "", label: "Select Employment Size" },
                  ...employmentSizes.map((size) => ({ value: size, label: size })),
                ]}
              />
              <FormField
                label="Revenue Envisaged (GHS)"
                type="select"
                value={formData.revenue}
                onChange={(value) => updateFormData("revenue", value)}
                options={[
                  { value: "", label: "Select Expected Revenue Range" },
                  ...revenueRanges.map((range) => ({ value: range, label: range })),
                ]}
              />
            </div>

            <h3 className="text-lg font-medium text-gray-900 mt-8">Business Operating Permit (BOP)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="BOP Application"
                type="select"
                value={formData.bopRequest}
                onChange={(value) => updateFormData("bopRequest", value)}
                options={[
                  { value: "", label: "Select BOP Option" },
                  ...bopOptions.map((option) => ({ value: option, label: option })),
                ]}
              />
              {formData.bopRequest === "Already have a BOP" && (
                <FormField
                  label="BOP Reference Number"
                  value={formData.bopReference}
                  onChange={(value) => updateFormData("bopReference", value)}
                  placeholder="Enter existing BOP reference number"
                />
              )}
            </div>

            <h3 className="text-lg font-medium text-gray-900 mt-8">Declaration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Full Name of Applicant"
                value={formData.applicantName}
                onChange={(value) => updateFormData("applicantName", value)}
                placeholder="Enter your full name as on Ghana Card"
              />
              <FormField
                label="Declaration Date"
                type="date"
                value={formData.declarationDate}
                onChange={(value) => updateFormData("declarationDate", value)}
              />
            </div>
          </div>
        )

      case "submit":
        return (
          <div
            className={`space-y-6 transition-all duration-300 ${isTransitioning ? "opacity-0 transform translate-y-4" : "opacity-100 transform translate-y-0"}`}
          >
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
                    <strong>Ghana Card Photos:</strong> Clear photos of front and back of Ghana Card for all directors
                    (or International Passport for non-Ghanaians)
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="font-bold">2.</span>
                  <p>
                    <strong>Signatures:</strong> Each director should sign on plain white paper and take a clear photo
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-800 mb-2">📱 Submission Process</h4>
              <ol className="list-decimal list-inside text-sm text-blue-700 space-y-2">
                <li>Click "Submit via WhatsApp" below</li>
                <li>Send the pre-filled form data message</li>
                <li>Follow up with required document photos for all directors</li>
                <li>Wait for confirmation from our team</li>
                <li>Receive your company registration certificate</li>
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
      <div ref={progressBarRef} className="px-6 py-4 bg-gray-50 border-b">
        <FormProgress currentStep={currentStep} totalSteps={steps.length} />
      </div>

      <div className="px-6 py-8 min-h-[600px]">
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

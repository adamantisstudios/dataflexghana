"use client"

import React, { useState, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Building2, Phone, Users, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function BusinessRegisterPage(): JSX.Element {
  const [formData, setFormData] = useState({
    businessName: "",
    location: "",
    services: "",
    email: "",
    contactNumbers: "",
    website: "",
    socialMedia: "",
    servicePackage: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePackageChange = (value: string) => {
    setFormData((prev) => ({ ...prev, servicePackage: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const message = `🏢 NEW BUSINESS REGISTRATION

📋 BUSINESS INFORMATION:
• Business Name: ${formData.businessName}
• Location: ${formData.location}
• Services/Products: ${formData.services}

📞 CONTACT INFORMATION:
• Email: ${formData.email}
• Phone Numbers: ${formData.contactNumbers}
• Website: ${formData.website || "Not provided"}
• Social Media: ${formData.socialMedia || "Not provided"}

💰 SERVICE PACKAGE SELECTED:
${formData.servicePackage}

⏰ Registration Time: ${new Date().toLocaleString()}

Please process this business registration and contact them for payment and setup.`

      const whatsappNumber = "233242799990"
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

      // Open WhatsApp and then redirect to success
      window.open(whatsappUrl, "_blank")
      window.location.href = "/business/success"
    } catch (error) {
      console.error("Registration error:", error)
      alert("There was an error processing your registration. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const servicePackages = [
    {
      id: "50-monthly",
      price: "₵50",
      duration: "month",
      products: "1-5 products or services",
      description: "Perfect for small businesses starting out",
      popular: false,
    },
    {
      id: "150-bimonthly",
      price: "₵150",
      duration: "2 months",
      products: "1-10 products or services",
      description: "Great for growing businesses",
      popular: true,
    },
    {
      id: "500-quarterly",
      price: "₵500",
      duration: "3 months",
      products: "1-20 products or services",
      description: "Best value for established businesses",
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DataFlex Business</span>
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4 px-4 py-2 text-base">
            🏢 Business Registration
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Register Your Business
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Join our platform and start selling your products and services with nationwide agent support. Reach
            customers across Ghana with our trusted network.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Nationwide Reach</h3>
              <p className="text-sm text-gray-600">Access customers across all regions of Ghana</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Trusted Platform</h3>
              <p className="text-sm text-gray-600">Verified agents and secure transactions</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Easy Setup</h3>
              <p className="text-sm text-gray-600">Quick registration and fast approval</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Section 1 */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                Section 1: Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-base font-medium">
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Enter your business name"
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-base font-medium">
                    Location *
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Region"
                    required
                    className="h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="services" className="text-base font-medium">
                  Services or Products Sold *
                </Label>
                <Textarea
                  id="services"
                  name="services"
                  value={formData.services}
                  onChange={handleInputChange}
                  placeholder="Describe the products or services your business offers"
                  required
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                Section 2: Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    Official Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="business@example.com"
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumbers" className="text-base font-medium">
                    Contact Numbers *
                  </Label>
                  <Input
                    id="contactNumbers"
                    name="contactNumbers"
                    value={formData.contactNumbers}
                    onChange={handleInputChange}
                    placeholder="0241234567, 0301234567"
                    required
                    className="h-12"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-base font-medium">
                    Website Link or URL
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.yourbusiness.com"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialMedia" className="text-base font-medium">
                    Social Media Handles
                  </Label>
                  <Input
                    id="socialMedia"
                    name="socialMedia"
                    value={formData.socialMedia}
                    onChange={handleInputChange}
                    placeholder="@yourbusiness, Facebook: YourBusiness"
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Service Package Selection (rewritten to be robust) */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                Section 3: Service Package Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-4">
                {servicePackages.map((pkg) => {
                  const selected = formData.servicePackage === pkg.id

                  return (
                    /* Label makes the whole card clickable — input is sr-only but controlled */
                    <label
                      key={pkg.id}
                      htmlFor={pkg.id}
                      className={`relative block border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                        selected ? "border-blue-500 bg-blue-50 shadow-lg" : "border-gray-200 hover:shadow-md hover:bg-gray-50"
                      } ${pkg.popular ? "ring-2 ring-blue-200" : ""}`}
                    >
                      {/* Native radio input (screen-reader accessible, keyboard friendly) */}
                      <input
                        id={pkg.id}
                        name="servicePackage"
                        type="radio"
                        className="sr-only"
                        value={pkg.id}
                        checked={selected}
                        onChange={(e) => handlePackageChange(e.target.value)}
                      />

                      {pkg.popular && (
                        <Badge className="absolute -top-3 left-6 bg-blue-600 text-white">Most Popular</Badge>
                      )}

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-2xl font-bold text-gray-900">{pkg.price}</span>
                              <span className="text-gray-600">/{pkg.duration}</span>
                            </div>
                            <Badge variant="outline" className="text-sm">
                              {pkg.products}
                            </Badge>
                          </div>

                          <p className="text-gray-600">{pkg.description}</p>
                          <p className="text-sm text-gray-500 mt-1">Renewable every {pkg.duration}</p>
                        </div>

                        {/* Visual selection indicator */}
                        <div
                          aria-hidden
                          className={`w-7 h-7 flex items-center justify-center rounded-full border-2 ${
                            selected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"
                          }`}
                        >
                          {selected ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="text-center">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !formData.servicePackage}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-lg font-semibold shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing Registration...
                </>
              ) : (
                <>
                  Submit Registration
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            <p className="text-sm text-gray-600 mt-4">
              By submitting, you agree to our{" "}
              <Link href="/business/terms" className="text-blue-600 hover:underline">
                Terms and Conditions
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

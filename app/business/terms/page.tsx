"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, Shield, Users, CreditCard, AlertCircle, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function BusinessTermsPage() {
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
            <Link href="/business/register" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Registration
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4 px-4 py-2 text-base">
            📋 Business Terms & Conditions
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Terms & Conditions
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Please read these terms carefully before registering your business on the DataFlex platform.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Business Registration */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                Business Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>All business information provided must be accurate and verifiable</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Businesses must have valid registration documents and comply with Ghana's business laws</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>DataFlex reserves the right to verify business credentials before approval</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>False information may result in immediate account suspension</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Service Packages & Pricing */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                Service Packages & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">₵50/month</h4>
                  <p className="text-sm text-gray-600">1-5 products/services</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">₵150/2 months</h4>
                  <p className="text-sm text-gray-600">1-10 products/services</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">₵500/3 months</h4>
                  <p className="text-sm text-gray-600">1-20 products/services</p>
                </div>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>All packages are renewable and payment must be made in advance</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Package upgrades can be made at any time with prorated pricing</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Late payment may result in temporary suspension of services</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>No refunds for partial months, but credits may be applied to future billing</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Platform Rules */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                Platform Rules & Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Businesses must provide accurate product descriptions and pricing</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>All products and services must comply with Ghana's consumer protection laws</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Prohibited items include illegal goods, counterfeit products, and harmful substances</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Businesses are responsible for order fulfillment and customer service</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>DataFlex facilitates connections but is not responsible for transaction disputes</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Agent Network */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Agent Network & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Our nationwide agent network helps promote and sell your products</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Agent commissions are built into the platform fee structure</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Businesses must provide adequate product information for agent training</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Direct communication with customers is encouraged for better service</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                Privacy & Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Business information is used solely for platform operations and marketing</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Customer data shared through the platform must be handled responsibly</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>DataFlex complies with Ghana's data protection regulations</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Businesses may request data deletion upon account termination</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* FAQ Link Card */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <HelpCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 mb-2">Have Questions About These Terms?</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Check out our comprehensive FAQ section for answers to common questions about business registration,
                    service packages, pricing, and platform support.
                  </p>
                  <Link href="/faq">
                    <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Visit FAQ & Help Center
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Support */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
              <CardTitle className="text-2xl text-center">Contact & Support</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <p className="text-gray-700 mb-6">For questions about these terms or business registration support:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">WhatsApp Support</h4>
                  <p className="text-blue-600 font-medium">+233 24 279 9990</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Business Hours</h4>
                  <p className="text-green-600 font-medium">Mon-Sat: 8AM-8PM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="text-center pt-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
              >
                <Link href="/business/register">I Agree - Continue Registration</Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-gray-300 text-gray-600 hover:bg-gray-50 px-8 py-6 text-lg bg-transparent"
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Home
                </Link>
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-6">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Phone, MessageCircle, ArrowRight, Building2 } from "lucide-react"
import Link from "next/link"

export default function BusinessSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
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

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          {/* Success Message */}
          <Badge className="bg-green-100 text-green-800 border-green-200 mb-4 px-4 py-2 text-base">
            Registration Submitted Successfully!
          </Badge>

          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to DataFlex Business!
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-12">
            Your business registration has been submitted successfully. Our team will contact you shortly to complete
            the setup process.
          </p>

          {/* Next Steps */}
          <Card className="border-green-200 shadow-lg mb-8">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="text-2xl text-green-800">What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Review & Verification</h3>
                    <p className="text-gray-600">
                      Our team will review your business information and verify your details within 24 hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Payment & Setup</h3>
                    <p className="text-gray-600">
                      We'll contact you via WhatsApp to arrange payment for your selected package and complete the
                      setup.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Go Live</h3>
                    <p className="text-gray-600">
                      Once payment is confirmed, your business will be live on our platform with nationwide agent
                      support!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
                <p className="text-gray-600 mb-3">Call us for immediate assistance</p>
                <p className="font-semibold text-blue-600">+233 24 279 9990</p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
                <p className="text-gray-600 mb-3">Quick support via WhatsApp</p>
                <p className="font-semibold text-green-600">+233 24 279 9990</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-6 text-lg"
            >
              <Link href="/">
                Back to Home
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-green-300 text-green-600 hover:bg-green-50 px-8 py-6 text-lg bg-transparent"
            >
              <a href="https://wa.me/233242799990" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact Us on WhatsApp
              </a>
            </Button>
          </div>

          <div className="mt-12 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-2">🎉 Thank You for Choosing DataFlex!</h3>
            <p className="text-gray-600">
              You're now part of Ghana's leading multi-service platform. Get ready to reach customers nationwide with
              our trusted agent network.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

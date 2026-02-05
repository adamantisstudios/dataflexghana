"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, MessageCircle, Clock, BookOpen, ArrowLeft, Phone } from "lucide-react"
import Link from "next/link"

export default function ParentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-green-600">GES Books</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {/* Success Hero */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Welcome to the DataFlex GES Books platform. Your registration has been submitted successfully.
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Registration Details Sent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">WhatsApp Notification Sent</p>
                <p className="text-sm text-green-700">
                  Your registration details have been automatically sent to our team via WhatsApp for processing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-800">Account Verification</p>
                <p className="text-sm text-blue-700">
                  Our team will verify your details and activate your account within 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-blue-800">What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                1
              </div>
              <p className="text-sm text-blue-700">Account verification (within 24 hours)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                2
              </div>
              <p className="text-sm text-blue-700">Welcome message with GES books catalog</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                3
              </div>
              <p className="text-sm text-blue-700">Start shopping for quality educational materials</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mb-6 border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-800">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              If you have any questions or need assistance, feel free to contact our support team.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-green-300 text-green-600 hover:bg-green-50 bg-transparent"
              >
                <a href="https://wa.me/0242799990" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </a>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                <a href="tel:0242799990">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Us
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Link href="/">Return to Homepage</Link>
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/parents/login" className="text-blue-600 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Thank you for choosing <span className="font-medium text-green-600">DataFlex GES Books Platform</span>
          </p>
        </div>
      </div>
    </div>
  )
}

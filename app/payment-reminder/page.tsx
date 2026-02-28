"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getPlatformName } from "@/lib/config"
import {
  Clock,
  CheckCircle,
  Sparkles,
  X,
  MessageCircle,
} from "lucide-react"

export default function PaymentReminderPage() {
  const [postPaymentTimeLeft, setPostPaymentTimeLeft] = useState(900) // 15 minutes in seconds
  const [showSlideUp, setShowSlideUp] = useState(false)
  const [isPostPayment, setIsPostPayment] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState({
    reference: "",
    agentName: "",
    email: "",
  })

  useEffect(() => {
    // Check if this is a post-payment visit (has reference parameter)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const reference = params.get("reference")
      const agentName = params.get("agentName")
      const email = params.get("email")
      
      if (reference) {
        setIsPostPayment(true)
        setPaymentDetails({
          reference: reference || "",
          agentName: agentName ? decodeURIComponent(agentName) : "Agent",
          email: email ? decodeURIComponent(email) : "",
        })
      }
    }
  }, [])

  // Post-payment countdown (15 minutes for approval waiting period)
  useEffect(() => {
    if (!isPostPayment) return

    const timer = setInterval(() => {
      setPostPaymentTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [isPostPayment])

  // Show slide-up notification after 10 seconds during post-payment
  useEffect(() => {
    if (!isPostPayment) return

    const timeout = setTimeout(() => {
      setShowSlideUp(true)
    }, 10000) // 10 seconds

    return () => clearTimeout(timeout)
  }, [isPostPayment])

  const handleContactAdminFromSlideUp = () => {
    const message = encodeURIComponent(
      `Hello! I just completed payment on Dataflex Ghana. My name is ${paymentDetails.agentName} and I have paid the ₵47 registration fee. Please check my account and approve it so I can start using the platform. Thank you!`,
    )
    const whatsappUrl = `https://wa.me/233242799990?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const postPaymentMinutes = String(Math.floor(postPaymentTimeLeft / 60)).padStart(2, "0")
  const postPaymentSeconds = String(postPaymentTimeLeft % 60).padStart(2, "0")

  if (!isPostPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting...</h1>
          <p className="text-gray-600">Please wait or refresh the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Slide-up Notification */}
      {showSlideUp && (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-white border-t-2 border-emerald-600 shadow-2xl mx-2 sm:mx-4 mb-4 rounded-t-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-4 sm:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-white font-bold text-sm sm:text-base">Waiting for Admin Approval</h3>
              </div>
              <button
                onClick={() => setShowSlideUp(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4 space-y-3">
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <p className="text-xs sm:text-sm text-emerald-900 font-semibold mb-2">
                  Estimated wait time: {postPaymentMinutes}:{postPaymentSeconds}
                </p>
                <p className="text-xs text-emerald-800">
                  Speed up the process by contacting our admin team on WhatsApp now!
                </p>
              </div>

              <Button
                onClick={handleContactAdminFromSlideUp}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-2 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Admin on WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12 px-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <img src="/images/logo.png" alt="DataFlex Logo" className="w-7 h-7 sm:w-9 sm:h-9 object-contain" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-800" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {getPlatformName()}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Ghana's Premier Earning Platform</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Payment Confirmed!
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto">
                Your registration payment has been successfully verified. We're reviewing your account now.
              </p>
            </div>
          </div>

          {/* Main Card - Payment Confirmation */}
          <Card className="border-2 border-emerald-300 shadow-2xl bg-gradient-to-br from-white to-emerald-50 mx-2">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-emerald-800 text-2xl">
                <CheckCircle className="h-8 w-8 text-green-600" />
                Account Under Review
              </CardTitle>
              <CardDescription className="text-base text-emerald-700 mt-2">
                Waiting for admin approval to activate your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Countdown Timer */}
              <div className="bg-white rounded-2xl p-8 border-2 border-emerald-200 text-center">
                <p className="text-gray-600 text-sm font-medium mb-4">Time remaining for admin review:</p>
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl px-8 py-6 mb-4">
                  <div className="text-6xl font-mono font-bold text-white tracking-wider">
                    {postPaymentMinutes}:{postPaymentSeconds}
                  </div>
                  <p className="text-emerald-100 text-sm font-medium mt-2">Minutes : Seconds</p>
                </div>
                <p className="text-sm text-gray-600">
                  Typical approval time: 24-48 hours after admin reviews your account
                </p>
              </div>

              {/* What's Happening */}
              <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-6 space-y-4">
                <p className="font-semibold text-gray-900 text-lg">What happens next:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700">Admin reviews your registration details</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700">You'll receive approval notification via WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700">₵5 automatically credited to your wallet</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                    <span className="text-gray-700">Full access to all platform features</span>
                  </li>
                </ul>
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleContactAdminFromSlideUp}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-4 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-base"
              >
                <MessageCircle className="h-5 w-5" />
                Speed Up: Contact Admin on WhatsApp
              </Button>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600 border border-gray-200">
                <p className="font-medium text-gray-700 mb-2">Can't wait? Contact us directly:</p>
                <p className="text-emerald-600 font-semibold">WhatsApp: +233 242 799 990</p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 px-2">
            <p className="text-xs sm:text-sm text-gray-500">
              Powered by <span className="font-semibold text-emerald-600">Adamantis Solutions</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Secure • Verified • Made in Ghana</p>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, MessageCircle, ArrowRight, Download, Clock, X } from "lucide-react"
import { toast } from "sonner"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [agentName, setAgentName] = useState<string>("Agent")
  const [agentId, setAgentId] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [reference, setReference] = useState<string>("")
  const [whatsappSent, setWhatsappSent] = useState(false)
  const [showSlideUp, setShowSlideUp] = useState(false)
  const [postPaymentTimeLeft, setPostPaymentTimeLeft] = useState(900) // 15 minutes

  useEffect(() => {
    const name = searchParams.get("agentName")
    const id = searchParams.get("agentId")
    const mailParam = searchParams.get("email")
    const ref = searchParams.get("reference")

    if (name) setAgentName(decodeURIComponent(name))
    if (id) setAgentId(id)
    if (mailParam) setEmail(decodeURIComponent(mailParam))
    if (ref) setReference(ref)
  }, [searchParams])

  // Show slide-up notification after 10 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowSlideUp(true)
    }, 10000) // 10 seconds

    return () => clearTimeout(timeout)
  }, [])

  // Post-payment countdown (15 minutes for approval waiting period)
  useEffect(() => {
    if (!showSlideUp) return

    const timer = setInterval(() => {
      setPostPaymentTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [showSlideUp])

  const sendWhatsAppConfirmation = () => {
    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })

    const whatsappMessage = `✅ *REGISTRATION PAYMENT SUCCESSFUL*

Hello ${agentName},

Your agent registration payment has been successfully processed and verified!

*Payment Confirmation Details:*
Agent Name: ${agentName}
Agent ID: ${agentId}
Amount Paid: ₵47.00
Payment Reference: ${reference}
Email: ${email}
Status: ✅ Active & Verified
Payment Date: ${timestamp}

*Account Status:*
Your account is now fully activated and you can:
• Access your agent dashboard immediately
• View available opportunities
• Start publishing properties
• Begin earning commissions
• Track your earnings in real-time

*What's Next:*
1. Access your dashboard using your Agent ID
2. Complete your profile setup
3. Upload your profile photo
4. Explore available opportunities
5. Start publishing and earning

*Benefits You Now Have:*
🎁 Free ₵5 wallet topup
💰 Commission on every sale
📈 Real-time earnings tracking
🤝 Premium agent features

Welcome to the Dataflex Ghana family! 🎉

If you have any questions or need support, please contact us through this chat.

Best regards,
Dataflex Ghana Admin Team
Support: +233 242 799 990`

    const phoneNumber = "233242799990"
    const encodedMessage = encodeURIComponent(whatsappMessage)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

    window.open(whatsappUrl, "_blank")
    setWhatsappSent(true)
    toast.success("WhatsApp opened! Send the message to admin...")
  }

  const handleContactAdminFromSlideUp = () => {
    const message = encodeURIComponent(
      `Hello! I just completed payment on Dataflex Ghana. My name is ${agentName} and I have paid the ₵47 registration fee (Reference: ${reference}). Please check my account and approve it so I can start using the platform. Thank you!`,
    )
    const whatsappUrl = `https://wa.me/233242799990?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const postPaymentMinutes = String(Math.floor(postPaymentTimeLeft / 60)).padStart(2, "0")
  const postPaymentSeconds = String(postPaymentTimeLeft % 60).padStart(2, "0")

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
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

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-600 rounded-full shadow-xl mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 text-lg">Your registration has been completed</p>
          </div>

          {/* Payment Details Card */}
          <Card className="shadow-2xl border-0 mb-6">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
              <CardTitle className="text-gray-900">Payment Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              {/* Agent Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium mb-1">AGENT NAME</p>
                  <p className="text-lg font-semibold text-gray-900">{agentName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium mb-1">AGENT ID</p>
                  <p className="text-lg font-semibold text-gray-900 font-mono">{agentId}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium mb-1">EMAIL</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{email || "Not provided"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 font-medium mb-1">PAYMENT REFERENCE</p>
                  <p className="text-sm font-semibold text-gray-900 font-mono">{reference || "Processing..."}</p>
                </div>
              </div>

              {/* Amount Paid */}
              <div className="bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg p-6 border border-emerald-200">
                <p className="text-gray-700 text-sm font-medium mb-2">AMOUNT PAID</p>
                <p className="text-4xl font-bold text-emerald-600">₵47.00</p>
                <p className="text-xs text-gray-600 mt-2">✓ Payment verified and processed successfully</p>
              </div>

              {/* What Happens Next */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">!</span>
                  What Happens Next
                </p>
                <ol className="text-sm text-gray-700 space-y-2 ml-8 list-decimal">
                  <li><strong>Send WhatsApp confirmation</strong> - Click the button below to notify admin</li>
                  <li><strong>Account activation</strong> - Your account is now active and approved</li>
                  <li><strong>Access dashboard</strong> - You can immediately start using all features</li>
                  <li><strong>Start earning</strong> - Begin publishing properties and earning commissions</li>
                </ol>
              </div>

              {/* Payment Receipt Email Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 text-sm mb-2">📧 Payment Receipt</p>
                <p className="text-sm text-gray-700">
                  A payment confirmation has been sent to <strong>{email || "your email"}</strong>. Please check your inbox for the receipt.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={sendWhatsAppConfirmation}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Send WhatsApp Confirmation to Admin
                </Button>

                <Button
                  asChild
                  disabled={!whatsappSent}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Link href={`/agent/dashboard?agentId=${agentId}`}>
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>

                <p className="text-xs text-gray-600 text-center">
                  {whatsappSent
                    ? "✓ WhatsApp message sent! You can now access your dashboard."
                    : "⚠ Please send WhatsApp confirmation first so admin knows about your payment"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support Info */}
          <div className="text-center text-sm text-gray-600">
            <p>Need help? Contact admin on <strong>WhatsApp: +233 242 799 990</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}

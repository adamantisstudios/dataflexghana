"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader,
  Shield,
  Zap,
  Clock,
  Lock,
  X,
  TrendingUp,
  Users,
  Play,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

// Constants
const REGISTRATION_FEE = 50 // Paystack payment amount
const REGISTRATION_FEE_MANUAL = 47 // Manual payment amount
const WALLET_TOPUP = 5

// Video testimonial data
const featuredTestimonies = [
  {
    id: 1,
    videoUrl: "/testimonials/agent0.mp4",
    thumbnail: "/testimonials/alhassan_issah.png",
    agentName: "Alhassan Issah",
    title: "Multiple income streams - Data + Registration + Wholesale",
  },
  {
    id: 2,
    videoUrl: "/testimonials/agent2.mp4",
    thumbnail: "/testimonials/successful-female-agent-smiling.png",
    agentName: "Atta Alhassan Imoro",
    title: "Making daily cashouts - See how she does it",
  },
]

interface PaystackResponse {
  authorization_url: string
  access_code: string
  reference: string
}

export default function RegistrationPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [agentName, setAgentName] = useState("New Agent")
  const [agentEmail, setAgentEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const [showManualDialog, setShowManualDialog] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [manualProcessing, setManualProcessing] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<typeof featuredTestimonies[0] | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<"manual" | "paystack" | null>(null)

  const generateCode = () => Math.floor(10000 + Math.random() * 90000).toString()
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  useEffect(() => {
    const name = searchParams.get("name")
    const mailParam = searchParams.get("email")
    console.log("[v0] Registration payment page loaded. URL params - name:", name, "email:", mailParam)
    if (name) setAgentName(decodeURIComponent(name))
    if (mailParam) setAgentEmail(decodeURIComponent(mailParam))
  }, [searchParams])

  useEffect(() => {
    const reference = searchParams.get("reference")
    console.log("[v0] Checking for Paystack callback. Reference:", reference)
    if (reference) {
      console.log("[v0] Verifying Paystack payment")
      verifyPaystackPayment(reference)
    }
  }, [searchParams])

  const openVideoModal = (video: typeof featuredTestimonies[0]) => {
    setCurrentVideo(video)
    setShowVideo(true)
  }

  const closeVideoModal = () => {
    setShowVideo(false)
    setCurrentVideo(null)
  }

  // Manual payment
  const handleManualStart = async () => {
    console.log("[v0] Manual payment started")
    setManualCode(generateCode())
    setShowManualDialog(true)
  }

  const handleManualComplete = async () => {
    if (!manualCode) return
    setManualProcessing(true)
    try {
      const timestamp = new Date().toLocaleString()
      const message = `✅ *NEW AGENT REGISTRATION - MANUAL PAYMENT RECEIVED*

Hello Admin,

A new agent has completed manual payment and is ready to be registered on the platform.

📋 *PAYMENT INFORMATION:*
• Amount Received: ₵${REGISTRATION_FEE_MANUAL}
• Reference Code: ${manualCode}
• Payment Method: Manual (Mobile Money)
• Transaction Date: ${timestamp}

✅ *REQUIRED ACTION:*
1. Register this new agent in the admin dashboard
2. Credit their account with ₵${WALLET_TOPUP} wallet credit for platform testing
3. Mark their account as APPROVED and ACTIVE

📱 *WHAT THE AGENT WILL DO NEXT:*
The agent will immediately complete their full registration form with:
- Full Name
- Phone Number
- Region/Location
- Password

⏱️ *PRIORITY:* Please process this registration within the next 30 minutes so the agent can access their dashboard.

Reference Code: *${manualCode}*

Thank you!`

      window.open(`https://wa.me/233242799990?text=${encodeURIComponent(message)}`, "_blank")
      setShowManualDialog(false)
      toast.success("✅ WhatsApp opened! Admin will register your account. Check back soon to login.")
      
      // Store payment reference in localStorage
      localStorage.setItem("payment_reference", manualCode)
      localStorage.setItem("payment_method", "manual")
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push(`/agent/login`)
      }, 2000)
    } catch (err) {
      toast.error("Something went wrong")
    } finally {
      setManualProcessing(false)
    }
  }

  // Paystack
  const handlePaystack = async () => {
    console.log("[v0] Paystack payment starting")
    // Email is required for Paystack
    if (!agentEmail.trim() || !validateEmail(agentEmail)) {
      setEmailError("Valid email required for Paystack payment")
      return
    }
    setIsProcessing(true)
    setError("")
    setEmailError("")
    try {
      const res = await fetch("/api/paystack/register/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: agentName,
          amount: REGISTRATION_FEE * 100,
          email: agentEmail,
        }),
      })
      if (!res.ok) throw new Error("Payment initialization failed")
      const data: PaystackResponse = await res.json()
      // Store email for use after payment
      localStorage.setItem("paystack_email", agentEmail)
      localStorage.setItem("paystack_name", agentName)
      window.location.href = data.authorization_url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment error")
      setIsProcessing(false)
    }
  }

  const verifyPaystackPayment = async (reference: string) => {
    setVerifyingPayment(true)
    const timeout = setTimeout(() => handlePaymentSuccess(reference), 12000)
    try {
      const res = await fetch("/api/paystack/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        if (data.success) toast.success("Payment verified!")
      }
    } catch (err) {
      console.warn("Verification error, redirecting anyway")
    } finally {
      handlePaymentSuccess(reference)
    }
  }

  const handlePaymentSuccess = (reference: string) => {
    // Store payment verification in localStorage
    localStorage.setItem("payment_verified", "true")
    localStorage.setItem("payment_reference", reference)
    localStorage.setItem("paystack_email", agentEmail)
    localStorage.setItem("paystack_name", agentName)
    localStorage.setItem("payment_method", "paystack")
    // Redirect to registration form for Paystack users to complete registration
    router.push(
      `/agent/register?name=${encodeURIComponent(agentName)}&email=${encodeURIComponent(agentEmail)}&reference=${reference}`
    )
  }

  const handleContinue = () => {
    if (!selectedMethod) return
    if (selectedMethod === "manual") handleManualStart()
    else handlePaystack()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {verifyingPayment ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <Loader className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Verifying payment…</h3>
              <p className="text-sm text-slate-600 mt-2">This will only take a moment.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 bg-emerald-600 rounded-xl items-center justify-center mb-4 shadow-md">
              <CreditCard className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Complete Payment to Register</h1>
            <p className="text-slate-600 mt-2 max-w-md mx-auto">
              Pay now to unlock your agent registration. After payment, you'll complete your registration form and access your dashboard. Both options include <span className="font-medium text-emerald-600">₵{WALLET_TOPUP} free wallet credit</span>.
            </p>
          </div>

          {/* Main payment card */}
          <Card className="border-0 shadow-xl mb-8">
            <CardContent className="p-5 md:p-6 space-y-6">
              {/* Payment options - now selectable */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Manual – recommended */}
                <div
                  onClick={() => setSelectedMethod("manual")}
                  className={`relative border-2 rounded-xl p-5 transition-all cursor-pointer ${
                    selectedMethod === "manual"
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300"
                  }`}
                >
                  <div className="absolute -top-3 left-4">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      ✅ RECOMMENDED
                    </span>
                  </div>
                  <div className="flex justify-between items-start mt-2">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Manual payment</h3>
                      <p className="text-sm text-slate-600">Mobile Money transfer</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-700">₵{REGISTRATION_FEE_MANUAL}</p>
                      <p className="text-xs text-slate-400 line-through">₵{REGISTRATION_FEE}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-600" /> Instant activation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" /> Contact admin directly
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" /> No waiting
                    </li>
                  </ul>
                  {selectedMethod === "manual" && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                  )}
                </div>

                {/* Paystack */}
                <div
                  onClick={() => setSelectedMethod("paystack")}
                  className={`border rounded-xl p-5 transition-all cursor-pointer ${
                    selectedMethod === "paystack"
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Paystack</h3>
                      <p className="text-sm text-slate-600">Card, mobile money, bank</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">₵{REGISTRATION_FEE}</p>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" /> 10‑15 min validation
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-600" /> Automated process
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" /> Delayed approval
                    </li>
                  </ul>
                  {selectedMethod === "paystack" && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Email input - only show for Paystack */}
              {selectedMethod === "paystack" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={agentEmail}
                    onChange={(e) => {
                      setAgentEmail(e.target.value)
                      setEmailError("")
                    }}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {emailError && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {emailError}
                    </p>
                  )}
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 text-red-800 text-sm p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Single Continue button */}
              <Button
                onClick={handleContinue}
                disabled={
                  !selectedMethod || 
                  isProcessing || 
                  manualProcessing || 
                  (selectedMethod === "paystack" && (!agentEmail || !validateEmail(agentEmail)))
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 text-base"
              >
                {isProcessing || manualProcessing ? (
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Zap className="h-5 w-5 mr-2" />
                )}
                {selectedMethod === "manual" ? "Continue with Manual Payment" : selectedMethod === "paystack" ? "Continue with Paystack" : "Select a payment method"}
              </Button> 

              {/* Savings note */}
              <p className="text-center text-sm text-emerald-700 font-medium">
                💚 Save ₵14 – choose manual for instant access
              </p>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> SSL encrypted
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified merchant
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Social proof sections (unchanged, kept as you had them) */}
          {/* What you get */}
          <Card className="border-0 shadow-md mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                What you get
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Verified agent account
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  All agent features & tools
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  ₵5 free wallet credit
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Priority admin support
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  WhatsApp confirmation
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Start earning immediately
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Video testimonials */}
          <Card className="border-0 shadow-md mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5 text-emerald-600" />
                Real agents making money
              </CardTitle>
              <CardDescription>Watch how others are earning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredTestimonies.map((testimony) => (
                  <div
                    key={testimony.id}
                    onClick={() => openVideoModal(testimony)}
                    className="group cursor-pointer rounded-xl overflow-hidden bg-slate-900 hover:shadow-lg transition-all"
                  >
                    <div className="relative aspect-[9/16] w-full overflow-hidden">
                      <img
                        src={testimony.thumbnail}
                        alt={testimony.agentName}
                        className="w-full h-full object-cover group-hover:brightness-75 transition"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 group-hover:bg-white rounded-full p-3 transform group-hover:scale-110 transition">
                          <Play className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                        <p className="text-white font-semibold text-xs">{testimony.agentName}</p>
                        <p className="text-white/80 text-xs line-clamp-2">{testimony.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/testimonials"
                target="_blank"
                className="inline-block mt-4 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
              >
                Watch more success stories →
              </Link>
            </CardContent>
          </Card>

          {/* Urgency section */}
          <Card className="border-0 shadow-md mb-6 bg-gradient-to-r from-orange-50 to-amber-50">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="bg-red-500 rounded-full p-2 flex-shrink-0">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900">⏰ Registration expires in 24 hours</h3>
                  <p className="text-sm text-orange-800 mt-1">
                    Complete your payment today to lock in your fee. Prices may increase for late registrations.
                  </p>
                  <p className="text-xs font-semibold text-orange-900 mt-3 flex items-center gap-2">
                    <Zap className="h-3 w-3 text-yellow-600" />
                    Limited slots available this month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent success stories - redesigned */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Real stories from agents
              </CardTitle>
              <CardDescription>How others are earning with us</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ama Mensah */}
              <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                  AM
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="font-semibold text-slate-900">Ama Mensah</h4>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Accra</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Sells Data Bundles + Registration + Wholesale
                  </p>
                  <p className="text-sm font-medium text-emerald-700 mt-1">
                    Earning <span className="font-bold">₵2,500/month</span>
                  </p>
                </div>
              </div>

              {/* Kwame Asante */}
              <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                  KA
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="font-semibold text-slate-900">Kwame Asante</h4>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Kumasi</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Promoted Data Bundles + Real Estate
                  </p>
                  <p className="text-sm font-medium text-amber-700 mt-1">
                    Made <span className="font-bold">₵7,000 in one month</span>
                  </p>
                </div>
              </div>

              {/* John Osei */}
              <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                  JO
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <h4 className="font-semibold text-slate-900">John Osei</h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Tamale</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Refers Projects + Data Bundles + Services
                  </p>
                  <p className="text-sm font-medium text-blue-700 mt-1">
                    Earned <span className="font-bold">₵10,000 from referrals</span>
                  </p>
                </div>
              </div>

              {/* Tip */}
              <p className="text-xs text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-200">
                <span className="text-lg">💡</span> Diversify your income streams for higher earnings
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manual payment dialog - balanced redesign */}
{showManualDialog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <Card className="w-full max-w-md shadow-xl rounded-lg">
      <CardHeader className="bg-emerald-600 text-white py-3 px-5 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-5 w-5" />
          Manual Payment Details
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 space-y-4">
        {/* Amount and Reference - cleaner, readable */}
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-emerald-700">Amount to Pay:</p>
            <p className="text-2xl font-bold text-emerald-900">₵{REGISTRATION_FEE_MANUAL}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-700 mb-1.5">Your Reference Code:</p>
            <div className="bg-white border-2 border-emerald-400 rounded-lg py-2 px-3 text-center">
              <p className="text-lg font-mono font-bold text-emerald-900 tracking-wider">
                {manualCode}
              </p>
            </div>
            <p className="text-xs text-emerald-600 mt-1.5 text-center">Include this code in your payment note</p>
          </div>
        </div>

        {/* Payment Details - readable */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <p className="text-sm font-bold text-amber-900 mb-2">📱 Send Payment To:</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg">
              <span className="text-sm font-medium text-amber-700">Phone:</span>
              <span className="font-mono font-bold text-base text-amber-900">+233 557 943 392</span>
            </div>
            <div className="flex justify-between items-center bg-white p-2.5 rounded-lg">
              <span className="text-sm font-medium text-amber-700">Receiver:</span>
              <span className="font-semibold text-amber-900">Adamantis Solutions</span>
            </div>
          </div>
        </div>

        {/* Instructions - clear but shorter */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm font-bold text-blue-900 mb-2">📋 What to do:</p>
          <ul className="space-y-1.5 text-sm text-blue-900 pl-1">
            <li>1. Send ₵{REGISTRATION_FEE_MANUAL} via Mobile Money to above number</li>
            <li>2. Include reference code: <strong>{manualCode}</strong></li>
            <li>3. Click "Payment Sent" below</li>
            <li>4. Notify admin via WhatsApp to complete registration</li>
          </ul>
        </div>

        {/* Buttons - comfortable height */}
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => setShowManualDialog(false)} 
            className="flex-1 h-10 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleManualComplete}
            disabled={manualProcessing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-medium text-sm"
          >
            {manualProcessing ? (
              <>
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "✓ Payment Sent"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}

      {/* Video modal */}
      {showVideo && currentVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-black rounded-lg w-full max-w-sm max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-3 bg-black border-b border-slate-800">
              <h3 className="text-white font-bold text-sm truncate">{currentVideo.agentName}</h3>
              <button onClick={closeVideoModal} className="text-white hover:bg-slate-800 rounded-full p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-black flex items-center justify-center">
              <video src={currentVideo.videoUrl} controls autoPlay className="w-full h-full object-contain" />
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <p className="text-white text-xs font-semibold mb-2">{currentVideo.agentName}</p>
              <p className="text-slate-300 text-xs mb-4 line-clamp-2">{currentVideo.title}</p>
              <div className="flex gap-2">
                <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm h-10">
                  <Link href="/testimonials" target="_blank">Watch More</Link>
                </Button>
                <Button variant="outline" className="flex-1 text-sm h-10" onClick={closeVideoModal}>
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

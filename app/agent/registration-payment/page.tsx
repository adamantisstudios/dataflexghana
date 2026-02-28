"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
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
  TrendingUp,
  Users,
  Star,
  Play,
  X,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface PaystackResponse {
  authorization_url: string
  access_code: string
  reference: string
}

const REGISTRATION_FEE = 47 // ₵47 registration fee
const REGISTRATION_CHARGE = 42 // ₵42 registration charge
const WALLET_TOPUP = 5 // ₵5 free wallet topup

interface VideoTestimonial {
  id: number
  videoUrl: string
  thumbnail: string
  agentName: string
  title: string
}

export default function RegistrationPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [agentId, setAgentId] = useState<string>("")
  const [agentName, setAgentName] = useState<string>("New Agent")
  const [agentEmail, setAgentEmail] = useState<string>("")
  const [emailError, setEmailError] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<VideoTestimonial | null>(null)

  // Featured testimonies
  const featuredTestimonies: VideoTestimonial[] = [
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

  const openVideoModal = (video: VideoTestimonial) => {
    setCurrentVideo(video)
    setShowVideo(true)
  }

  const closeVideoModal = () => {
    setShowVideo(false)
    setCurrentVideo(null)
  }

  useEffect(() => {
    const id = searchParams.get("agentId")
    const name = searchParams.get("name")
    
    if (id) {
      setAgentId(id)
    }
    if (name) {
      setAgentName(decodeURIComponent(name))
    }
  }, [searchParams])

  useEffect(() => {
    // Check if coming back from Paystack callback
    const reference = searchParams.get("reference")
    if (reference && agentId) {
      verifyPaystackPayment(reference)
    }
  }, [searchParams, agentId])

  // Prevent accidental page exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!verifyingPayment && agentId) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [verifyingPayment, agentId])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const initializePaystackPayment = async () => {
    if (!agentId) {
      setError("Agent ID not found. Please register again.")
      return
    }

    // Validate email
    setEmailError("")
    if (!agentEmail.trim()) {
      setEmailError("Please enter your email address")
      return
    }

    if (!validateEmail(agentEmail)) {
      setEmailError("Please enter a valid email address")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      console.log("[v0] Initializing Paystack payment for agent:", agentId)

      // First, update agent's email in database
      const { error: updateError } = await supabase
        .from("agents")
        .update({ email: agentEmail })
        .eq("id", agentId)

      if (updateError) {
        console.warn("[v0] Warning: Could not update agent email in database:", updateError.message)
        // Continue with payment anyway
      } else {
        console.log("[v0] Agent email updated successfully:", agentEmail)
      }

      const response = await fetch("/api/paystack/register/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId,
          agent_name: agentName,
          amount: REGISTRATION_FEE * 100, // Paystack expects amount in pesewas (cents)
          email: agentEmail, // Use actual agent email instead of generated one
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to initialize payment")
      }

      const data: PaystackResponse = await response.json()
      console.log("[v0] Paystack initialization successful, redirecting to:", data.authorization_url)

      // Store reference for verification before redirecting
      setPaymentReference(data.reference)
      localStorage.setItem(`paystack_ref_${agentId}`, data.reference)
      localStorage.setItem("paymentInitiated", "true")

      // Use setTimeout to ensure localStorage is flushed before redirect
      setTimeout(() => {
        window.location.href = data.authorization_url
      }, 200)
    } catch (err) {
      console.error("[v0] Payment initialization error:", err)
      setError(err instanceof Error ? err.message : "Failed to initialize payment. Please try again.")
      setIsProcessing(false)
    }
  }

  const verifyPaystackPayment = async (reference: string) => {
    if (!agentId) return

    setVerifyingPayment(true)
    console.log("[v0] Verifying Paystack payment with reference:", reference)

    try {
      const response = await fetch(`/api/paystack/register/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference,
          agent_id: agentId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Payment verification failed")
      }

      const data = await response.json()
      
      if (data.success) {
        console.log("[v0] Payment verified successfully")
        toast.success("Payment successful! Redirecting to confirmation page...")
        
        // Clear localStorage
        localStorage.removeItem(`paystack_ref_${agentId}`)
        localStorage.removeItem("newRegistration")

        // Redirect to payment success page
        setTimeout(() => {
          router.push(
            `/agent/payment-success?agentName=${encodeURIComponent(agentName)}&agentId=${agentId}&email=${encodeURIComponent(agentEmail)}&reference=${reference}`
          )
        }, 1500)
      } else {
        throw new Error("Payment could not be verified")
      }
    } catch (err) {
      console.error("[v0] Verification error:", err)
      setError(err instanceof Error ? err.message : "Failed to verify payment")
      setVerifyingPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {verifyingPayment ? (
            // Verification Loading State
            <Card className="shadow-2xl">
              <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
                  <Loader className="h-8 w-8 text-emerald-600 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Verifying Payment</h3>
                <p className="text-gray-600">Please wait while we confirm your payment...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl shadow-xl mb-4">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h1>
                <p className="text-gray-600">Complete your registration with a secure payment</p>
              </div>

              {/* Main Card */}
              <Card className="shadow-2xl border-0">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
                  <CardTitle className="text-gray-900">Registration Fee</CardTitle>
                  <CardDescription>One-time payment to activate your agent account</CardDescription>
                </CardHeader>

                <CardContent className="pt-8 space-y-8">
                  {/* Payment Details with Breakdown */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Registration Charge:</span>
                      <span className="text-lg font-semibold text-gray-800">₵{REGISTRATION_CHARGE}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/50 rounded px-3 py-2">
                      <span className="text-gray-700 font-medium flex items-center gap-2">
                        <span className="text-sm text-emerald-600 font-bold">✓</span>
                        Free Wallet Topup:
                      </span>
                      <span className="text-lg font-semibold text-emerald-600">₵{WALLET_TOPUP}</span>
                    </div>
                    <div className="border-t border-emerald-200 pt-4 flex justify-between items-center">
                      <span className="text-gray-900 font-semibold text-lg">Total Amount:</span>
                      <span className="text-3xl font-bold text-emerald-600">₵{REGISTRATION_FEE}</span>
                    </div>
                  </div>

                  {/* What's Included */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      What You Get
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700 ml-7">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-1">✓</span>
                        <span>Verified agent account status</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-1">✓</span>
                        <span>Access to all agent features and tools</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-1">✓</span>
                        <span>₵5 free wallet credit to start purchasing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-1">✓</span>
                        <span>Priority support from our admin team</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-1">✓</span>
                        <span>Instant WhatsApp confirmation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-1">✓</span>
                        <span>Ready to start earning immediately</span>
                      </li>
                    </ul>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Secure Payment</p>
                      <p>Your payment is processed securely through Paystack, Ghana's most trusted payment gateway.</p>
                    </div>
                  </div>

                  {/* Urgency Section */}
                  <div className="space-y-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-500 rounded-full p-2 flex-shrink-0 mt-0.5">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-orange-900">⏰ Registration expires in 24 hours</p>
                        <p className="text-xs text-orange-800 mt-1">
                          Complete your payment today to lock in your ₵47 registration fee. Prices may increase for late registrations.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/60 rounded p-3 space-y-2 ml-7">
                      <p className="text-xs font-semibold text-orange-900 flex items-center gap-2">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        Limited slots available this month
                      </p>
                      <p className="text-xs text-orange-800">
                        Only a few agent positions remain available. Secure yours now before slots fill up.
                      </p>
                    </div>
                  </div>

                  {/* Featured Video Testimonies */}
                  <div className="space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Play className="h-5 w-5 text-blue-600" />
                      <p className="font-bold text-blue-900">See Real Agents Making Money</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {featuredTestimonies.map((testimony) => (
                        <div
                          key={testimony.id}
                          onClick={() => openVideoModal(testimony)}
                          className="group cursor-pointer rounded-lg overflow-hidden bg-gray-900 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="relative aspect-[9/16] w-full bg-black">
                            <Image
                              src={testimony.thumbnail}
                              alt={testimony.agentName}
                              fill
                              className="object-cover group-hover:brightness-75 transition-all duration-300"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/90 group-hover:bg-white rounded-full p-3 transform group-hover:scale-110 transition-transform duration-300">
                                <Play className="h-4 w-4 text-blue-600 fill-blue-600" />
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
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
                      className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 mt-2 bg-blue-100/50 rounded px-2 py-1.5 w-fit"
                    >
                      Watch more success stories →
                    </Link>
                  </div>

                  {/* Real Earnings Proof with Varied Stories */}
                  <div className="space-y-3 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      <p className="font-bold text-emerald-900">Proven Agent Success Stories</p>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white/60 rounded p-2 text-xs text-emerald-900 border-l-3 border-emerald-500">
                        <p className="font-semibold">🎯 Ama Mensah (Accra)</p>
                        <p className="text-emerald-700 text-xs mt-1">Sells <span className="font-bold">Data Bundles + Registration Services + Wholesale</span></p>
                        <p className="text-emerald-700 font-bold mt-1">Earning <span className="text-emerald-600">₵2,500/month</span></p>
                      </div>
                      <div className="bg-white/60 rounded p-2 text-xs text-emerald-900 border-l-3 border-amber-500">
                        <p className="font-semibold">🏠 Kwame Asante (Kumasi)</p>
                        <p className="text-emerald-700 text-xs mt-1">Promoted <span className="font-bold">Data Bundles + Real Estate Properties</span></p>
                        <p className="text-emerald-700 font-bold mt-1">Made <span className="text-amber-600">₵7,000 in ONE month</span></p>
                      </div>
                      <div className="bg-white/60 rounded p-2 text-xs text-emerald-900 border-l-3 border-blue-500">
                        <p className="font-semibold">🤝 John Osei (Tamale)</p>
                        <p className="text-emerald-700 text-xs mt-1">Refers <span className="font-bold">Projects + Data Bundles + Services</span></p>
                        <p className="text-emerald-700 font-bold mt-1">Earned <span className="text-blue-600">₵10,000 within a month</span> from referrals</p>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-700 font-semibold mt-2">💡 Diversifying income streams = Higher earnings</p>
                    <Link 
                      href="/testimonials" 
                      target="_blank"
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 mt-2 bg-emerald-100/50 rounded px-2 py-1.5 w-fit"
                    >
                      ▶ Watch video testimonials →
                    </Link>
                  </div>

                  {/* Email Input Section */}
                  <div className="space-y-2 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <label htmlFor="email" className="block font-semibold text-gray-900 text-sm">
                      Your Email Address
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      Paystack will send your payment receipt and confirmation to this email
                    </p>
                    <input
                      id="email"
                      type="email"
                      value={agentEmail}
                      onChange={(e) => {
                        setAgentEmail(e.target.value)
                        setEmailError("")
                      }}
                      placeholder="your.email@gmail.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    />
                    {emailError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900 mb-1">Payment Error</p>
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Pay Button */}
                  <Button
                    onClick={initializePaystackPayment}
                    disabled={isProcessing || !agentId || !agentEmail.trim()}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        <span>Pay ₵{REGISTRATION_FEE} via Paystack</span>
                      </>
                    )}
                  </Button>

                  {/* Info Footer */}
                  <div className="text-center text-xs text-gray-600 space-y-1">
                    <p className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Payment is required to activate your account
                    </p>
                    <p className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      You'll receive WhatsApp confirmation after payment
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Verified Merchant</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Video Modal - Optimized for Vertical Videos */}
        {showVideo && currentVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-black rounded-lg w-full max-w-sm sm:max-w-lg max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
              {/* Video Header */}
              <div className="flex items-center justify-between p-3 bg-black border-b border-gray-700 flex-shrink-0">
                <h3 className="text-white font-bold text-sm sm:text-base truncate">{currentVideo.agentName}</h3>
                <button
                  onClick={closeVideoModal}
                  className="text-white hover:bg-gray-900 rounded-full p-2 transition-colors flex-shrink-0 ml-2"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              {/* Video Container - Optimized for vertical videos */}
              <div className="flex-1 min-h-0 overflow-hidden bg-black flex items-center justify-center">
                <video
                  src={currentVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video Info and Actions */}
              <div className="p-3 sm:p-4 bg-gray-900 border-t border-gray-700 flex-shrink-0">
                <p className="text-white text-xs sm:text-sm font-semibold mb-2">{currentVideo.agentName}</p>
                <p className="text-gray-300 text-xs sm:text-sm mb-4 line-clamp-2">{currentVideo.title}</p>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Button
                    asChild
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-sm h-10"
                  >
                    <Link href="/testimonials" target="_blank">
                      Watch More
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-sm h-10"
                    onClick={closeVideoModal}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

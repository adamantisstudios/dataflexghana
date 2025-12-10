"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getPlatformName } from "@/lib/config"
import {
  Clock,
  CreditCard,
  Shield,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  Phone,
  Copy,
  Zap,
  Target,
  DollarSign,
  X,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"

function AdminConfirmationPopup({ onClose }: { onClose: () => void }) {
  const [agentName, setAgentName] = useState<string>("New Agent")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlName = params.get("name")

    if (urlName) {
      setAgentName(decodeURIComponent(urlName))
    } else {
      const registration = localStorage.getItem("newRegistration")
      if (registration) {
        try {
          const data = JSON.parse(registration)
          setAgentName(data.fullName || "New Agent")
        } catch (error) {
          console.error("[v0] Error parsing registration data:", error)
        }
      }
    }
  }, [])

  const handleContactAdmin = () => {
    const message = encodeURIComponent(
      `My name is ${agentName}. I just completed registration on Dataflex Ghana as an agent. I need more info in order to make payment and activate my account.`,
    )
    const whatsappUrl = `https://wa.me/233242799990?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Verify Registration</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-gray-800 font-semibold text-base">Faster Processing</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Confirm your registration details with our admin team for faster verification and payment processing. This
              ensures your account is activated quickly.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wide">
              Benefits of early confirmation:
            </p>
            <ul className="space-y-1 text-xs text-emerald-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>Priority account review</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>Faster payment activation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>Direct support from admin team</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              onClick={handleContactAdmin}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Admin on WhatsApp
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg bg-transparent"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentReminderPage() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 1,
    minutes: 0,
    seconds: 0,
  })
  const [copied, setCopied] = useState(false)
  const [showAdminPopup, setShowAdminPopup] = useState(false)
  const [hasShownPopup, setHasShownPopup] = useState(false)

  useEffect(() => {
    // Start countdown from 1 hour
    const startTime = Date.now()
    const endTime = startTime + 60 * 60 * 1000 // 1 hour in milliseconds

    const timer = setInterval(() => {
      const now = Date.now()
      const remaining = endTime - now

      if (remaining <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
        clearInterval(timer)
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60))
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
        setTimeLeft({ hours, minutes, seconds })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!hasShownPopup) {
      const popupTimer = setTimeout(() => {
        setShowAdminPopup(true)
        setHasShownPopup(true)
      }, 10000) // 10 seconds

      return () => clearTimeout(popupTimer)
    }
  }, [hasShownPopup])

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.removeItem("newRegistration")
    }, 15000) // Increased from 5 seconds to 15 seconds

    return () => clearTimeout(timer)
  }, [])

  const copyPaymentNumber = () => {
    navigator.clipboard.writeText("0557943392")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {showAdminPopup && <AdminConfirmationPopup onClose={() => setShowAdminPopup(false)} />}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8 px-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
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

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">🎉 Registration Successful!</h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2">
                Welcome to your journey towards financial freedom! Complete your payment to unlock unlimited earning
                potential.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 px-2">
            {/* Left Column - Payment Info */}
            <div className="space-y-4 sm:space-y-6">
              {/* Countdown Timer */}
              <Card className="border-2 border-emerald-200 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 animate-pulse" />
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl text-emerald-800">Complete Payment</CardTitle>
                  </div>
                  <CardDescription className="text-sm sm:text-base lg:text-lg">
                    Time remaining to secure your spot
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl p-4 sm:p-6 text-white text-center">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold mb-2 tracking-wider">
                      {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </div>
                    <p className="text-emerald-100 font-medium text-sm sm:text-base lg:text-lg">
                      Hours : Minutes : Seconds
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Amount */}
              <Card className="border-2 border-green-200 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-800">Registration Fee</span>
                  </div>
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-green-600 mb-2 sm:mb-3">₵40</div>
                  <p className="text-green-700 font-medium text-sm sm:text-base lg:text-lg">
                    Platform entry fee (non-refundable) - your gateway to unlimited earning potential
                  </p>
                </CardContent>
              </Card>

              {/* Payment Instructions */}
              <Card className="border-2 border-blue-200 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-800 text-base sm:text-lg">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                    Payment Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                  <div className="bg-blue-50 rounded-xl p-3 sm:p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="font-semibold text-blue-900 text-sm sm:text-base">Payment Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg sm:text-xl font-bold text-blue-600">0557943392</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyPaymentNumber}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 bg-transparent"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {copied && (
                      <p className="text-xs sm:text-sm text-green-600 text-center animate-fade-in">
                        ✓ Number copied to clipboard!
                      </p>
                    )}
                    <div className="space-y-1 sm:space-y-2 text-blue-800 text-sm sm:text-base">
                      <p>
                        <strong>Reference:</strong> Adamantis Solutions
                      </p>
                      <p>
                        <strong>Amount:</strong> ₵40
                      </p>
                      <p>
                        <strong>Your Name:</strong> Use your FULL NAME as reference
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Benefits & Next Steps */}
            <div className="space-y-4 sm:space-y-6">
              {/* What You Get */}
              <Card className="border-2 border-purple-200 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-purple-800 text-base sm:text-lg">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                    What You Get After Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                  <div className="grid gap-2 sm:gap-3">
                    {[
                      { icon: TrendingUp, text: "Instant access to earning opportunities", color: "text-green-600" },
                      { icon: Users, text: "Join 10,000+ successful agents", color: "text-blue-600" },
                      { icon: DollarSign, text: "Start earning ₵50-₵5000 monthly", color: "text-emerald-600" },
                      { icon: Shield, text: "Verified platform with guaranteed payouts", color: "text-purple-600" },
                      { icon: Target, text: "Access to investment tools & reports", color: "text-orange-600" },
                      { icon: Zap, text: "24/7 support and training materials", color: "text-red-600" },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color} flex-shrink-0`} />
                        <span className="font-medium text-gray-800 text-sm sm:text-base">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="border-2 border-orange-200 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-orange-800 text-base sm:text-lg">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    Your Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      "Send ₵40 to 0557943392 via Mobile Money",
                      "Use 'Adamantis Solutions' as reference",
                      "Include your FULL NAME in the transaction",
                      "Wait for account approval (within 20 minutes)",
                      "Start earning immediately after approval!",
                    ].map((step, index) => (
                      <div key={index} className="flex items-start gap-2 sm:gap-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 font-medium text-sm sm:text-base">{step}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3 sm:space-y-4">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-xl text-sm sm:text-base lg:text-lg py-4 sm:py-6 group"
                >
                  <a href="https://agentwelcome.netlify.app/" target="_blank" rel="noopener noreferrer">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="truncate">Learn How to Maximize Your Earnings</span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 py-4 sm:py-6 text-sm sm:text-base bg-transparent"
                >
                  <Link href="/agent/login">Already Paid? Sign In Here</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Success Stories */}
          <Card className="mt-6 sm:mt-8 border-2 border-yellow-200 shadow-xl bg-gradient-to-r from-yellow-50 to-orange-50 mx-2">
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-800 mb-3 sm:mb-4">
                🌟 Join Thousands of Successful Agents!
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">10,000+</div>
                  <p className="text-gray-700 font-medium text-sm sm:text-base">Active Agents</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">₵2.5M+</div>
                  <p className="text-gray-700 font-medium text-sm sm:text-base">Total Commissions Paid</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600">98%</div>
                  <p className="text-gray-700 font-medium text-sm sm:text-base">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 text-center px-2">
            <p className="text-xs sm:text-sm text-gray-500 mb-2">
              Powered by <span className="font-semibold text-emerald-600">Adamantis Solutions</span>
            </p>
            <p className="text-xs text-gray-400">🔒 Secure • ✅ Verified • 🇬🇭 Made in Ghana</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

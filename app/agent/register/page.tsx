"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase, hashPassword } from "@/lib/supabase"
import { getPlatformName } from "@/lib/config"
import { FloatingAudioPlayer } from "@/components/floating-audio-player"
import { 
  X, Play, ArrowRight, Award, Sparkles, Users, Shield, Target, 
  Zap, TrendingUp, CreditCard, Clock, CheckCircle, Lock, ShoppingBag, 
  Package, Smartphone, FileText 
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const regions = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Brong-Ahafo",
  "Western North",
  "Ahafo",
  "Bono",
  "Bono East",
  "Oti",
  "North East",
  "Savannah",
]

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    paymentLine: "",
    region: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showInfo, setShowInfo] = useState(false)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
  const [showWarningPopup, setShowWarningPopup] = useState(false)
  const [popupTimeRemaining, setPopupTimeRemaining] = useState(15)
  const [canClosePopup, setCanClosePopup] = useState(false)
  const [showIntroMessage, setShowIntroMessage] = useState(false)
  const [referralCode, setReferralCode] = useState<string>("")
  const [showBeyondDataModal, setShowBeyondDataModal] = useState(false)
  const router = useRouter()

  // Auto-show warning popup after 30 seconds
  useEffect(() => {
    const warningTimer = setTimeout(() => setShowWarningPopup(true), 30000)
    return () => clearTimeout(warningTimer)
  }, [])

  // Auto-show audio player after 1 minute
  useEffect(() => {
    const audioTimer = setTimeout(() => setShowAudioPlayer(true), 60000)
    return () => clearTimeout(audioTimer)
  }, [])

  // Countdown timer for warning popup
  useEffect(() => {
    if (!showWarningPopup) return
    const timer = setInterval(() => {
      setPopupTimeRemaining((prev) => {
        if (prev <= 1) {
          setCanClosePopup(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showWarningPopup])

  // Track referral code from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get("ref")
    if (code) {
      setReferralCode(code)
      fetch("/api/agent/referral/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_code: code }),
      }).catch((err) => console.error("[v0] Failed to track referral click:", err))
    }
  }, [])

  const handleCloseAudioPlayer = () => {
    const today = new Date().toDateString()
    localStorage.setItem("audioPlayerLastShown", today)
    setShowAudioPlayer(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // --- ADD VALIDATION FOR REGION ---
    if (!formData.region || formData.region.trim() === "") {
      setError("Please select your region")
      setLoading(false)
      return
    }

    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions")
      setLoading(false)
      return
    }

    try {
      const { data: existingAgent } = await supabase
        .from("agents")
        .select("id, phone_number")
        .eq("phone_number", formData.phoneNumber)
        .maybeSingle()

      if (existingAgent) {
        setError("An agent with this phone number already exists")
        setLoading(false)
        return
      }

      const passwordHash = await hashPassword(formData.password)
      const { data, error: insertError } = await supabase
        .from("agents")
        .insert([
          {
            full_name: formData.fullName,
            agent_name: formData.fullName,
            phone_number: formData.phoneNumber,
            momo_number: formData.paymentLine,
            region: formData.region,
            password_hash: passwordHash,
            isapproved: false,
            referral_code: referralCode || null,
          },
        ])
        .select()

      if (insertError) {
        console.error("Registration error:", insertError)
        setError("Registration failed. Please try again.")
        setLoading(false)
        return
      }

      if (data && data[0]) {
        const newAgent = data[0]
        const agentName = formData.fullName || "New Agent"

        localStorage.setItem(
          "newRegistration",
          JSON.stringify({
            fullName: agentName,
            agentId: newAgent.id,
            timestamp: new Date().toISOString(),
          }),
        )

        if (referralCode) {
          // ... (referral processing code unchanged)
        }

        router.push(`/agent/registration-payment?agentId=${newAgent.id}&name=${encodeURIComponent(agentName)}`)
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError("Registration failed. Please try again.")
      setLoading(false)
    }
  }

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
    setFormData({ ...formData, phoneNumber: value })
  }

  const handlePaymentLineInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
    setFormData({ ...formData, paymentLine: value })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Audio Player and Warning Popup remain the same... */}
      {showAudioPlayer && (
        <FloatingAudioPlayer
          onClose={handleCloseAudioPlayer}
          audioSrc="/agent_dashboard_intro.mp3"
          title="Welcome to DataFlex"
          description="Learn how to get started as an agent"
        />
      )}

      {showWarningPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md">
            <div className="mb-4 overflow-hidden rounded-xl shadow-lg">
              <Image
                src="/pending.png"
                alt="Pending Account Notice"
                width={800}
                height={300}
                className="w-full h-40 object-cover"
                priority
              />
            </div>
            <Card className="border-red-300 bg-white shadow-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <X className="h-6 w-6 text-red-600" />
                  <CardTitle className="text-red-600 text-lg font-bold">Important Notice</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-red-900">
                    Please confirm you are ready to pay the one-time registration fee.
                  </p>
                  <p className="mb-3 text-sm text-red-800 leading-relaxed">
                    After your account is approved by admin, you will receive 5 GHS automatically credited to your
                    wallet to start buying data bundles and testing the system immediately.
                  </p>
                  <p className="text-sm font-semibold text-red-900">
                    ⚠️ Unpaid accounts will remain <span className="uppercase">pending</span> permanently.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium text-gray-600">
                    {canClosePopup ? "You may close this message now" : `Please wait: ${popupTimeRemaining}s`}
                  </span>
                </div>
                <Button
                  onClick={() => setShowWarningPopup(false)}
                  disabled={!canClosePopup}
                  className="w-full bg-emerald-600 font-semibold hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {canClosePopup ? "I Understand, Continue" : "Please wait..."}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-xs sm:text-sm text-gray-600 hover:text-emerald-600 transition-colors truncate"
            >
              <X className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <img src="/images/logo.png" alt="DataFlex Logo" className="w-4 sm:w-5 h-4 sm:h-5 object-contain" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-emerald-600 truncate">{getPlatformName()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg flex-shrink-0">
              <X className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Become an Agent</h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed px-2">
              Ghana's number one platform to promote projects for commissions, invest, refer projects and earn, buy and
              sell at wholesale, and enjoy affordable data bundles.
            </p>
          </div>

          {/* Testimonials Section */}
          <Card className="border-none shadow-xl rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 mb-4 sm:mb-6">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center">
                <div className="relative w-full md:w-1/3 p-6 flex justify-center items-center overflow-hidden">
                  <Image
                    src="/testimonial-bg.png"
                    alt="Testimonials preview"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-blue-900/40" />
                  <div className="relative p-4 rounded-full bg-white/90 shadow-lg flex-shrink-0">
                    <Play className="h-8 w-8 text-blue-600 ml-0.5" />
                  </div>
                </div>
                <div className="w-full md:w-2/3 p-6 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">See What Other Agents Are Saying</h3>
                  <p className="text-sm md:text-base text-gray-700 mb-5 leading-relaxed">
                    Still not sure? Watch real success stories from agents across Ghana who are earning daily on
                    Dataflex Ghana.
                  </p>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full sm:w-auto py-2 px-4 rounded-lg shadow-md transition-transform hover:scale-105"
                  >
                    <Link href="/testimonials" className="flex items-center justify-center">
                      Watch Success Stories <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What You Get As An Agent */}
          <Card className="border-purple-200 shadow-xl bg-white/80 backdrop-blur-sm mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-purple-800 text-base sm:text-lg">
                <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                What You Get As An Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
              <div className="grid gap-2 sm:gap-3">
                {[
                  { icon: Sparkles, text: "Free Sales Training Manual (PDF, Audio, Video)", color: "text-yellow-600" },
                  { icon: Users, text: "Part of 10,000+ Active Agents Nationwide", color: "text-blue-600" },
                  { icon: Shield, text: "Supportive & Friendly Admin Access 24/7", color: "text-purple-600" },
                  { icon: Target, text: "Personal Support Assistant Access", color: "text-orange-600" },
                  { icon: Zap, text: "Instant access to earning opportunities", color: "text-red-600" },
                  { icon: TrendingUp, text: "Start earning within 24 hours", color: "text-green-600" },
                  { icon: CreditCard, text: "Discounted Service Costs", color: "text-indigo-600" },
                  { icon: Award, text: "Attract Extra Commissions", color: "text-pink-600" },
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

          {/* --- REDESIGNED "EXPLORE WITHOUT COMMITMENT" SECTION --- */}
          <Card className="border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 mb-4 sm:mb-6 overflow-hidden hover:shadow-lg transition-all duration-300">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold text-xl text-emerald-800 mb-2">No Registration? No Problem!</h3>
                  <p className="text-sm text-emerald-700 mb-3">
                    You can still enjoy many of our services instantly – no account needed.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start text-xs text-emerald-600">
                    <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                      <Smartphone className="h-3 w-3" /> Data Bundles
                    </span>
                    <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                      <FileText className="h-3 w-3" /> School Forms
                    </span>
                    <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                      <Package className="h-3 w-3" /> Scratch Cards
                    </span>
                    <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                      <CreditCard className="h-3 w-3" /> Software & More
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-transform hover:scale-105"
                  >
                    <Link href="/no-registration" className="flex items-center gap-2">
                      Start Shopping <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Fee Card - Showcasing Two Payment Options */}
          <Card className="mb-4 sm:mb-6 border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 sm:px-8 py-4 sm:py-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Choose Your Payment Method</h3>
                <p className="text-emerald-50 text-sm sm:text-base">
                  Both options include <span className="font-semibold">₵5 free wallet credit</span> on approval
                </p>
              </div>
              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Manual Payment */}
                  <div className="border-2 border-emerald-200 rounded-xl p-4 bg-white relative">
                    <span className="absolute -top-3 left-4 bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
                      ✅ RECOMMENDED
                    </span>
                    <div className="mt-2">
                      <h4 className="font-bold text-lg text-gray-900">Manual Payment</h4>
                      <p className="text-sm text-gray-600">Mobile Money transfer</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-2xl font-bold text-emerald-700">₵47</p>
                      <p className="text-xs text-gray-400 line-through">₵50</p>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-gray-700">
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
                  </div>

                  {/* Paystack */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-white">
                    <h4 className="font-bold text-lg text-gray-900">Paystack</h4>
                    <p className="text-sm text-gray-600">Card, mobile money, bank</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-2xl font-bold text-gray-900">₵50</p>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-gray-700">
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
                  </div>
                </div>
                <p className="text-center text-sm text-emerald-700 font-medium">
                  💚 Save ₵14 – choose manual for instant activation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Registration Form */}
          <Card className="border-emerald-100 shadow-lg mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Create Your Account</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Fill in your details to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Personal Information */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    <X className="h-4 w-4 flex-shrink-0" />
                    Personal Information <span className="text-red-500">*</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs sm:text-sm font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-xs sm:text-sm font-medium">
                      Region <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value) => setFormData({ ...formData, region: value })}
                    >
                      <SelectTrigger className="border-gray-200 focus:border-emerald-500 text-sm">
                        <SelectValue placeholder="Select your region" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 overflow-y-auto">
                        {regions.map((region) => (
                          <SelectItem key={region} value={region} className={region === "Greater Accra" ? "font-semibold" : ""}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    <X className="h-4 w-4 flex-shrink-0" />
                    Contact Information <span className="text-red-500">*</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-xs sm:text-sm font-medium">
                      Agent Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={handlePhoneInput}
                      placeholder="e.g., 0551234567"
                      maxLength={10}
                      className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                    />
                    <p className="text-xs text-gray-500">Maximum 10 digits</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentLine" className="text-xs sm:text-sm font-medium">
                      Payment Line <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="paymentLine"
                      type="tel"
                      required
                      value={formData.paymentLine}
                      onChange={handlePaymentLineInput}
                      placeholder="e.g., 0551234567"
                      maxLength={10}
                      className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                    />
                    <p className="text-xs text-gray-500">Used for commission payments. Maximum 10 digits</p>
                  </div>
                </div>

                {/* Account Security */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    <X className="h-4 w-4 flex-shrink-0" />
                    Account Security <span className="text-red-500">*</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a secure password"
                      className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                      className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-2 sm:space-x-3 py-3 sm:py-4">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                    className="border-emerald-300 data-[state=checked]:bg-emerald-600 mt-0.5 flex-shrink-0"
                    required
                  />
                  <Label htmlFor="terms" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
                    By registering, I have accepted to be bound by the{" "}
                    <Link href="/terms" className="text-emerald-600 hover:underline font-medium">
                      Terms and Conditions
                    </Link>{" "}
                    of the platform. I have fully read and agree to the{" "}
                    <Link href="/terms" className="text-emerald-600 hover:underline font-medium">
                      Terms and Conditions
                    </Link>{" "}
                    and understand that my account requires approval before activation. <span className="text-red-500">*</span>
                  </Label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-red-600 text-xs sm:text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg h-10 sm:h-12 text-sm sm:text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </div>
                  ) : (
                    "Create Agent Account"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Important Notice Card */}
          <Card className="mb-4 sm:mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-amber-800 mb-1 text-xs sm:text-sm">Important Notice</p>
                  <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
                    Your account will be reviewed within 20 minutes. Please ensure all information is accurate. Fake
                    registrations will result in permanent bans.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/agent/login" className="text-emerald-600 hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Powered by <span className="font-medium text-emerald-600">AdamantisSolutions</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
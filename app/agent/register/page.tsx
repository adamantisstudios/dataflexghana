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
import { getJoiningFeeFormatted, getPlatformName } from "@/lib/config"
import { FloatingAudioPlayer } from "@/components/floating-audio-player"
import { PlatformSneakPeakButton } from "@/components/platform-sneak-peak-button"
import { X, Play, ArrowRight } from "lucide-react"
import Link from "next/link"

const regions = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta", "Northern",
  "Upper East", "Upper West", "Brong-Ahafo", "Western North", "Ahafo", "Bono", "Bono East", "Oti", "North East", "Savannah"
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
      setPopupTimeRemaining(prev => {
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
      }).catch(err => console.error("[v0] Failed to track referral click:", err))
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
        .insert([{
          full_name: formData.fullName,
          agent_name: formData.fullName,
          phone_number: formData.phoneNumber,
          momo_number: formData.paymentLine,
          region: formData.region,
          password_hash: passwordHash,
          isapproved: false,
          referral_code: referralCode || null,
        }])
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
          try {
            const { data: referralLink } = await supabase
              .from("referral_links")
              .select("id, agent_id")
              .eq("referral_code", referralCode)
              .maybeSingle()

            if (referralLink?.agent_id) {
              const { error: creditError } = await supabase.from("referral_credits").insert([{
                referring_agent_id: referralLink.agent_id,
                referred_agent_id: newAgent.id,
                credit_amount: 7.0,
                status: "pending",
                created_at: new Date().toISOString(),
              }])

              if (creditError) {
                console.error("[v0] Error creating referral credit:", creditError)
              }

              const { data: trackingData, error: trackingError } = await supabase
                .from("referral_tracking")
                .update({
                  referred_agent_id: newAgent.id,
                  referred_name: formData.fullName,
                  referred_phone: formData.phoneNumber,
                  referred_user_registered: true,
                  referred_user_registered_at: new Date().toISOString(),
                  converted: true,
                  converted_at: new Date().toISOString(),
                })
                .eq("referral_code", referralCode)
                .eq("converted", false)
                .order("clicked_at", { ascending: false })
                .limit(1)
                .select()

              if (trackingError) {
                console.error("[v0] Error updating referral tracking:", trackingError)
              }

              const { data: referralTrackingData } = await supabase
                .from("referral_tracking")
                .select("*", { count: "exact" })
                .eq("referral_link_id", referralLink.id)
                .eq("converted", true)

              if (referralTrackingData) {
                await supabase
                  .from("referral_links")
                  .update({
                    total_referrals: referralTrackingData.length || 0,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", referralLink.id)
              }
              console.log("[v0] Referral processed for agent:", referralLink.agent_id)
            }
          } catch (referralError) {
            console.error("[v0] Error processing referral:", referralError)
          }
        }

        router.push(`/payment-reminder?name=${encodeURIComponent(agentName)}`)
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
      {/* Audio Player */}
      {showAudioPlayer && (
        <FloatingAudioPlayer
          onClose={handleCloseAudioPlayer}
          audioSrc="/agent_dashboard_intro.mp3"
          title="Welcome to DataFlex"
          description="Learn how to get started as an agent"
        />
      )}

      {/* Warning Popup */}
      {showWarningPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-red-300 bg-white shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <X className="h-6 w-6 text-red-600" />
                <CardTitle className="text-red-600">Important Notice</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-900 mb-3">
                  Please confirm you are ready to pay the one-time 40 GHS entry fee before registering.
                </p>
                <p className="text-sm text-red-800 leading-relaxed mb-3">
                  This platform is for serious individuals committed to working as agents and earning commissions remotely.
                </p>
                <p className="text-sm text-red-800 leading-relaxed mb-3">
                  Register only if you are motivated, prepared, and willing to follow our processes.
                </p>
                <p className="text-sm font-semibold text-red-900">
                  Proceed only if you are ready to pay the 40 GHS fee.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-gray-600">
                  {canClosePopup ? "You may close this now" : `Please wait: ${popupTimeRemaining}s`}
                </span>
              </div>
              <Button
                onClick={() => setShowWarningPopup(false)}
                disabled={!canClosePopup}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canClosePopup ? "I Understand, Continue" : "Please wait..."}
              </Button>
            </CardContent>
          </Card>
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
              Ghana's number one platform to promote projects for commissions, invest, refer projects and earn, buy and sell at wholesale, and enjoy affordable data bundles.
            </p>
          </div>

          {/* Testimonials Section */}
          <Card className="border-none shadow-xl rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 mb-4 sm:mb-6">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/3 p-6 flex justify-center items-center bg-blue-500/10">
                  <div className="p-4 rounded-full bg-blue-100 flex-shrink-0">
                    <Play className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="w-full md:w-2/3 p-6 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">See What Other Agents Are Saying</h3>
                  <p className="text-sm md:text-base text-gray-700 mb-5 leading-relaxed">
                    Still not sure? Watch real success stories from agents across Ghana who are earning daily on Dataflex Ghana.
                  </p>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full sm:w-auto py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                  >
                    <Link href="/testimonials" className="flex items-center justify-center">
                      Watch Success Stories <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Sneak Peak Card */}
          <Card className="border-blue-100 bg-blue-50/50 mb-4 sm:mb-6 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 rounded-full bg-blue-100 flex-shrink-0">
                    <X className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-blue-800 text-sm sm:text-lg">See What You'll Get</h3>
                    <p className="text-xs sm:text-sm text-blue-700 mt-1">
                      Watch a quick tour of the platform features and earning opportunities
                    </p>
                  </div>
                </div>
                <div className="w-full">
                  <PlatformSneakPeakButton variant="default" size="sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Fee Card */}
          <Card className="mb-4 sm:mb-6 border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold text-emerald-800 text-sm sm:text-base">Registration Fee</span>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-emerald-600">{getJoiningFeeFormatted()}</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-700 mb-3">
                Platform entry fee (non-refundable) - like a movie theatre ticket to access Ghana's premier earning platform
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfo(!showInfo)}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 p-0 h-auto font-normal text-xs sm:text-sm"
              >
                <X className="h-4 w-4 mr-1" />
                {showInfo ? "Hide details" : "Why this fee?"}
              </Button>
              {showInfo && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <div className="space-y-2 text-xs sm:text-sm text-emerald-700">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-emerald-100 flex-shrink-0">
                        <X className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>Ghana's number one platform for commissions, investment, and wholesale trade</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-emerald-100 flex-shrink-0">
                        <X className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>Promote projects and earn commissions</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-emerald-100 flex-shrink-0">
                        <X className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>Buy and sell at wholesale prices</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-emerald-100 flex-shrink-0">
                        <X className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>Invest and grow your earnings</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-emerald-100 flex-shrink-0">
                        <X className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>Enjoy affordable data bundles & airtime</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-emerald-100 flex-shrink-0">
                        <X className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>Access your agent dashboard & wallet system</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-emerald-100 flex-shrink-0">
                        <X className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>24/7 support & training materials</span>
                    </div>
                  </div>
                </div>
              )}
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
                    Personal Information
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs sm:text-sm font-medium">Full Name</Label>
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
                    <Label htmlFor="region" className="text-xs sm:text-sm font-medium">Region</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value) => setFormData({ ...formData, region: value })}
                    >
                      <SelectTrigger className="border-gray-200 focus:border-emerald-500 text-sm">
                        <SelectValue placeholder="Select your region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    <X className="h-4 w-4 flex-shrink-0" />
                    Contact Information
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-xs sm:text-sm font-medium">Agent Number</Label>
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
                    <Label htmlFor="paymentLine" className="text-xs sm:text-sm font-medium">Payment Line</Label>
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
                    Account Security
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs sm:text-sm font-medium">Password</Label>
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
                    <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium">Confirm Password</Label>
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
                  />
                  <Label htmlFor="terms" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
                    I have fully read and agree to the{" "}
                    <Link href="/terms" className="text-emerald-600 hover:underline font-medium">
                      Terms and Conditions
                    </Link>{" "}
                    and understand that my account requires approval before activation.
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
                  ) : "Create Agent Account"}
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
                    Your account will be reviewed within 20 minutes. Please ensure all information is accurate. Fake registrations will result in permanent bans.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="space-y-3 sm:space-y-4">
            <Button
              asChild
              variant="outline"
              className="w-full border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent text-xs sm:text-sm"
            >
              <a href="https://agentwelcome.netlify.app/" target="_blank" rel="noopener noreferrer">
                <X className="h-4 w-4 mr-2 flex-shrink-0" />
                Learn How It Works
              </a>
            </Button>
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

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
import {
  ArrowLeft,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Info,
  Phone,
  Lock,
  User,
  CreditCard,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

const regions = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern", "Volta", "Northern",
  "Upper East", "Upper West", "Brong-Ahafo", "Western North", "Ahafo", "Bono", "Bono East", "Oti", "North East", "Savannah",
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
  const router = useRouter()

  // Show warning popup 15 seconds after page load
  useEffect(() => {
    const warningTimer = setTimeout(() => {
      setShowWarningPopup(true)
    }, 15000)
    return () => clearTimeout(warningTimer)
  }, [])

  // Show audio player 30 seconds after page load
  useEffect(() => {
    const audioTimer = setTimeout(() => {
      setShowAudioPlayer(true)
    }, 30000)
    return () => clearTimeout(audioTimer)
  }, [])

  // Handle the countdown timer for the warning popup
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
        .select("id")
        .eq("phone_number", formData.phoneNumber)
        .single()
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
          phone_number: formData.phoneNumber,
          payment_line: formData.paymentLine,
          region: formData.region,
          password_hash: passwordHash,
          isapproved: false,
        }])
        .select()
      if (insertError) {
        console.error("Registration error:", insertError)
        setError("Registration failed. Please try again.")
        setLoading(false)
        return
      }
      router.push("/payment-reminder")
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
      {showAudioPlayer && (
        <FloatingAudioPlayer
          onClose={handleCloseAudioPlayer}
          audioSrc="/agent_dashboard_intro.mp3"
          title="Welcome to DataFlex"
          description="Learn how to get started as an agent"
        />
      )}
      {showWarningPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-red-300 bg-white shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <CardTitle className="text-red-600">Important Notice</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-900 mb-3">
                  If you are NOT ready to pay the one-time platform Agent entry fee of 50 GHS, DO NOT register.
                </p>
                <p className="text-sm text-red-800 leading-relaxed mb-3">
                  We work with agents across Ghana and have partnered with reputable businesses. Only SERIOUS
                  individuals who want to work remotely and earn commissions should sign up.
                </p>
                <p className="text-sm text-red-800 leading-relaxed mb-3">
                  Registering without readiness is a waste of your time, energy, and resources.
                </p>
                <p className="text-sm font-semibold text-red-900">
                  You must be willing and able to pay the 50 GHS platform entry fee before continuing.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-gray-600">
                  {canClosePopup ? "You can now close this" : `Please wait: ${popupTimeRemaining}s`}
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
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg flex items-center justify-center">
                <img src="/images/logo.png" alt="DataFlex Logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-sm font-semibold text-emerald-600">{getPlatformName()}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Become an Agent</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Ghana's number one platform to promote projects for commissions, invest, refer projects and earn, buy and
            sell at wholesale, and enjoy affordable data bundles.
          </p>
        </div>
        <Card className="mb-6 border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Registration Fee</span>
              </div>
              <span className="text-2xl font-bold text-emerald-600">{getJoiningFeeFormatted()}</span>
            </div>
            <p className="text-sm text-emerald-700 mb-3">
              Platform entry fee (non-refundable) - like a movie theatre ticket to access Ghana's premier earning
              platform
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 p-0 h-auto font-normal"
            >
              <Info className="h-4 w-4 mr-1" />
              {showInfo ? "Hide details" : "Why this fee?"}
            </Button>
            {showInfo && (
              <div className="mt-3 pt-3 border-t border-emerald-200">
                <div className="space-y-2 text-sm text-emerald-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Ghana's number one platform for commissions, investment, and wholesale trade</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Promote projects and earn commissions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Buy and sell at wholesale prices</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Invest and grow your earnings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Enjoy affordable data bundles & airtime</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Access your agent dashboard & wallet system</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>24/7 support & training materials</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-emerald-100 shadow-lg mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Create Your Account</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <User className="h-4 w-4" />
                  Personal Information
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region" className="text-sm font-medium">
                    Region
                  </Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-emerald-500">
                      <SelectValue placeholder="Select your region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    Agent Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={handlePhoneInput}
                    placeholder="e.g., 0551234567"
                    maxLength={10}
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500">Maximum 10 digits</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentLine" className="text-sm font-medium">
                    Payment Line
                  </Label>
                  <Input
                    id="paymentLine"
                    type="tel"
                    required
                    value={formData.paymentLine}
                    onChange={handlePaymentLineInput}
                    placeholder="e.g., 0551234567"
                    maxLength={10}
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500">Used for commission payments. Maximum 10 digits</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Lock className="h-4 w-4" />
                  Account Security
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a secure password"
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-start space-x-3 py-4">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                  className="border-emerald-300 data-[state=checked]:bg-emerald-600 mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-emerald-600 hover:underline font-medium">
                    Terms and Conditions
                  </Link>{" "}
                  and understand that my account requires approval before activation.
                </Label>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg h-12 text-base font-medium"
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
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800 mb-1">Important Notice</p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Your account will be reviewed within 20 minutes. Please ensure all information is accurate. Fake
                  registrations will result in permanent bans.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Button
            asChild
            variant="outline"
            className="w-full border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
          >
            <a href="https://agentwelcome.netlify.app/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Learn How It Works
            </a>
          </Button>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/agent/login" className="text-emerald-600 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-medium text-emerald-600">AdamantisSolutions</span>
          </p>
        </div>
      </div>
    </div>
  )
}

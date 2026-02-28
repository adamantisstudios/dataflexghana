"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Settings,
  X,
} from "lucide-react"
import { supabase, hashPassword } from "@/lib/supabase"

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

interface ManualRegistrationStats {
  totalManualRegistrations: number
  registrationsToday: number
  registrationsThisWeek: number
  registrationsThisMonth: number
}

export default function ManualRegistrationTab() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [stats, setStats] = useState<ManualRegistrationStats>({
    totalManualRegistrations: 0,
    registrationsToday: 0,
    registrationsThisWeek: 0,
    registrationsThisMonth: 0,
  })

  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Agent Registration Form State
  const [agentFormData, setAgentFormData] = useState({
    fullName: "",
    phoneNumber: "",
    momoNumber: "",
    region: "",
    password: "",
    confirmPassword: "",
    autoApprove: false,
    adminNotes: "",
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const resetAgentForm = () => {
    setAgentFormData({
      fullName: "",
      phoneNumber: "",
      momoNumber: "",
      region: "",
      password: "",
      confirmPassword: "",
      autoApprove: false,
      adminNotes: "",
    })
    setError("")
    setSuccess("")
  }

  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        setShowSuccessPopup(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessPopup])

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    console.log("[v0] Starting agent registration with data:", agentFormData)

    // Validation
    if (agentFormData.password !== agentFormData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (agentFormData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      console.log("[v0] Checking for existing agent with phone:", agentFormData.phoneNumber)

      // Check if phone number already exists
      const { data: existingAgent, error: checkError } = await supabase
        .from("agents")
        .select("id")
        .eq("phone_number", agentFormData.phoneNumber)
        .maybeSingle()

      if (checkError) {
        console.error("[v0] Error checking existing agent:", checkError)
        setError("Database connection error. Please try again.")
        setLoading(false)
        return
      }

      if (existingAgent) {
        setError("An agent with this phone number already exists")
        setLoading(false)
        return
      }

      console.log("[v0] No existing agent found, proceeding with registration")

      // Get current admin info
      const adminUser = JSON.parse(localStorage.getItem("admin_user") || "{}")
      console.log("[v0] Admin user:", adminUser)

      // Hash password
      console.log("[v0] Hashing password...")
      const passwordHash = await hashPassword(agentFormData.password)
      console.log("[v0] Password hashed successfully")

      // Create agent
      const agentData = {
        full_name: agentFormData.fullName,
        phone_number: agentFormData.phoneNumber,
        momo_number: agentFormData.momoNumber,
        region: agentFormData.region,
        password_hash: passwordHash,
        isapproved: agentFormData.autoApprove,
        registration_source: "manual_admin",
        registered_by_admin_id: adminUser.id || null,
        admin_notes: agentFormData.adminNotes,
        wallet_balance: 0,
        commission: 0,
      }

      console.log("[v0] Inserting agent with data:", agentData)

      const { data, error: insertError } = await supabase.from("agents").insert([agentData]).select()

      if (insertError) {
        console.error("[v0] Agent creation error:", insertError)
        setError(`Failed to create agent: ${insertError.message}`)
        setLoading(false)
        return
      }

      console.log("[v0] Agent created successfully:", data)

      if (data && data[0]) {
        // Record the manual registration
        console.log("[v0] Recording manual registration...")
        const { error: registrationError } = await supabase.from("admin_agent_registrations").insert([
          {
            agent_id: data[0].id,
            registered_by_admin_id: adminUser.id || null,
            registration_method: "manual",
            registration_notes: agentFormData.adminNotes,
          },
        ])

        if (registrationError) {
          console.error("[v0] Registration tracking error:", registrationError)
          // Don't fail the whole process for this
        }

        const message = `Agent "${agentFormData.fullName}" created successfully! ${
          agentFormData.autoApprove
            ? "Account is approved and ready to use."
            : "Account requires approval before activation."
        }`
        setSuccessMessage(message)
        setShowSuccessPopup(true)
        resetAgentForm()

        // Refresh stats
        loadStats()
      }
    } catch (error) {
      console.error("[v0] Agent registration error:", error)
      setError("Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 7)
      const monthStart = new Date()
      monthStart.setDate(monthStart.getDate() - 30)

      const [totalResult, todayResult, weekResult, monthResult] = await Promise.all([
        supabase.from("admin_agent_registrations").select("id", { count: "exact", head: true }),
        supabase
          .from("admin_agent_registrations")
          .select("id", { count: "exact", head: true })
          .gte("created_at", `${today}T00:00:00.000Z`),
        supabase
          .from("admin_agent_registrations")
          .select("id", { count: "exact", head: true })
          .gte("created_at", weekStart.toISOString()),
        supabase
          .from("admin_agent_registrations")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString()),
      ])

      setStats({
        totalManualRegistrations: totalResult.count || 0,
        registrationsToday: todayResult.count || 0,
        registrationsThisWeek: weekResult.count || 0,
        registrationsThisMonth: monthResult.count || 0,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  // Load stats on component mount
  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Registration Successful!</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-gray-600 mb-4">{successMessage}</p>
            <div className="text-xs text-gray-500 text-center">This popup will close automatically in 3 seconds</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            Manual Agent Registration
          </h2>
          <p className="text-gray-600 mt-1">Register agents manually from the admin panel</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} className="flex items-center gap-2 bg-transparent">
          <RefreshCw className="h-4 w-4" />
          Refresh Stats
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Manual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalManualRegistrations}</div>
            <p className="text-xs text-blue-100 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registrationsToday}</div>
            <p className="text-xs text-green-100 mt-1">Registered today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registrationsThisWeek}</div>
            <p className="text-xs text-purple-100 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registrationsThisMonth}</div>
            <p className="text-xs text-orange-100 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Registration Form */}
      <Card className="border-blue-100 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Manual Agent Registration
          </CardTitle>
          <p className="text-sm text-gray-600">
            Create agent accounts manually with the same form structure as the public registration
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAgentSubmit} className="space-y-5">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <User className="h-4 w-4" />
                Personal Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentFullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="agentFullName"
                    type="text"
                    required
                    value={agentFormData.fullName}
                    onChange={(e) => setAgentFormData({ ...agentFormData, fullName: e.target.value })}
                    placeholder="Enter agent's full name"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentRegion" className="text-sm font-medium">
                    Region
                  </Label>
                  <Select
                    value={agentFormData.region}
                    onValueChange={(value) => setAgentFormData({ ...agentFormData, region: value })}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select region" />
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
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Phone className="h-4 w-4" />
                Contact Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentPhone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="agentPhone"
                    type="tel"
                    required
                    value={agentFormData.phoneNumber}
                    onChange={(e) => setAgentFormData({ ...agentFormData, phoneNumber: e.target.value })}
                    placeholder="e.g., 0551234567"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentMomo" className="text-sm font-medium">
                    Mobile Money Number
                  </Label>
                  <Input
                    id="agentMomo"
                    type="tel"
                    required
                    value={agentFormData.momoNumber}
                    onChange={(e) => setAgentFormData({ ...agentFormData, momoNumber: e.target.value })}
                    placeholder="e.g., 0551234567"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Lock className="h-4 w-4" />
                Account Security
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentPassword" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="agentPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={agentFormData.password}
                      onChange={(e) => setAgentFormData({ ...agentFormData, password: e.target.value })}
                      placeholder="Create a secure password"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentConfirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="agentConfirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={agentFormData.confirmPassword}
                      onChange={(e) => setAgentFormData({ ...agentFormData, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Settings className="h-4 w-4" />
                Admin Options
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="autoApprove"
                    checked={agentFormData.autoApprove}
                    onCheckedChange={(checked) =>
                      setAgentFormData({ ...agentFormData, autoApprove: checked as boolean })
                    }
                    className="border-blue-300 data-[state=checked]:bg-blue-600 mt-0.5"
                  />
                  <Label htmlFor="autoApprove" className="text-sm leading-relaxed">
                    Auto-approve this agent (account will be immediately active)
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentNotes" className="text-sm font-medium">
                    Admin Notes (Optional)
                  </Label>
                  <Textarea
                    id="agentNotes"
                    value={agentFormData.adminNotes}
                    onChange={(e) => setAgentFormData({ ...agentFormData, adminNotes: e.target.value })}
                    placeholder="Add any notes about this registration..."
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-sm sm:text-base px-3 sm:px-6 py-3 sm:py-4 min-w-0"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2 justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">Creating Agent...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center">
                    <UserPlus className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">Create Agent Account</span>
                  </div>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetAgentForm}
                disabled={loading}
                className="border-gray-300 bg-transparent text-sm sm:text-base px-3 sm:px-6 py-3 sm:py-4 min-w-0 flex-shrink-0"
              >
                <span className="text-xs sm:text-sm">Reset Form</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

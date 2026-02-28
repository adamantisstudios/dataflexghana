"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase, verifyPassword } from "@/lib/supabase"
import { setStoredAgent } from "@/lib/agent-auth"
import { getPlatformName } from "@/lib/config"
import { ArrowLeft, LogIn, Eye, EyeOff, Phone, Lock, AlertTriangle, UserCheck } from "lucide-react"
import Link from "next/link"

export default function AgentLoginPage() {
  const [formData, setFormData] = useState({
    phone_number: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data, error: fetchError } = await supabase
        .from("agents")
        .select("*")
        .eq("phone_number", formData.phone_number)
        .single()

      if (fetchError || !data) {
        setError("Agent not found. Please check your phone number or register first.")
        setLoading(false)
        return
      }

      if (!data.isapproved) {
        setError("Your account is pending approval. Please wait for admin approval.")
        setLoading(false)
        return
      }

      // Verify password
      if (!data.password_hash || !(await verifyPassword(formData.password, data.password_hash))) {
        setError("Invalid password. Please try again.")
        setLoading(false)
        return
      }

      // Store agent info using the authentication utility
      setStoredAgent(data)

      // Set cookie for special agent to bypass maintenance mode
      if (data.phone_number === '+233546460945') {
        // Set a cookie that the middleware can read
        document.cookie = `special_agent=true; path=/; max-age=86400; SameSite=Lax`
        document.cookie = `agent_phone=${encodeURIComponent(data.phone_number)}; path=/; max-age=86400; SameSite=Lax`
      }

      // Navigate to dashboard immediately
      router.push("/agent/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <img src="/images/logo.png" alt="DataFlex Logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-sm font-semibold text-blue-600">{getPlatformName()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Sign in to access your agent dashboard and continue earning
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-blue-100 shadow-lg mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Agent Login</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Phone className="h-4 w-4" />
                  Login Credentials
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="e.g., 0551234567"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </Button>
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

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg h-12 text-base font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In to Dashboard
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Status Info */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <UserCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800 mb-1">Account Status</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Only approved agents can access the dashboard. If you're having trouble logging in, 
                  your account may still be pending approval.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Actions */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/agent/register" className="text-blue-600 hover:underline font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-medium text-blue-600">AdamantisSolutions</span>
          </p>
        </div>
      </div>
    </div>
  )
}

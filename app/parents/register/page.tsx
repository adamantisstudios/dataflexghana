"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, CheckCircle, AlertTriangle, Info, User, GraduationCap, School, BookOpen } from "lucide-react"
import Link from "next/link"

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

const grades = [
  "Nursery 1",
  "Nursery 2",
  "KG 1",
  "KG 2",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "JHS 1",
  "JHS 2",
  "JHS 3",
  "SHS 1",
  "SHS 2",
  "SHS 3",
]

export default function ParentRegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    childName: "",
    childSchool: "",
    childGrade: "",
    region: "",
    agreeToTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const formatWhatsAppMessage = (data: typeof formData) => {
    return `🎓 *NEW PARENT REGISTRATION - GES BOOKS PLATFORM*

👤 *Parent Details:*
• Name: ${data.fullName}
• Email: ${data.email}
• Phone: ${data.phoneNumber}
• Region: ${data.region}

👶 *Child Information:*
• Child Name: ${data.childName}
• School: ${data.childSchool}
• Grade: ${data.childGrade}

📚 *Registration Type:* GES Approved Books & School Items
💰 *Platform Fee:* FREE for Parents
📅 *Registration Date:* ${new Date().toLocaleString()}

✅ *Next Steps:*
1. Verify parent details
2. Activate account for shopping
3. Send welcome message with catalog

🔗 *Platform:* DataFlex GES Books Section
📱 *Admin Dashboard:* Check parent management tab`
  }

  const sendWhatsAppMessage = async (message: string) => {
    try {
      // Format phone number for WhatsApp (remove any spaces, dashes, etc.)
      const whatsappNumber = "0242799990"
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

      // Open WhatsApp in new tab
      window.open(whatsappUrl, "_blank")

      // Log the WhatsApp message in database
      await supabase.from("whatsapp_messages").insert({
        recipient_phone: whatsappNumber,
        message_type: "parent_registration",
        message_content: JSON.stringify(formData),
        formatted_message: message,
        recipient_type: "admin",
        delivery_status: "sent",
      })

      return true
    } catch (error) {
      console.error("Error sending WhatsApp message:", error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validation
    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions")
      setLoading(false)
      return
    }

    try {
      // Check if email already exists
      const { data: existingParent } = await supabase.from("parents").select("id").eq("email", formData.email).single()

      if (existingParent) {
        setError("A parent with this email already exists")
        setLoading(false)
        return
      }

      // Create parent record
      const { data, error: insertError } = await supabase
        .from("parents")
        .insert([
          {
            full_name: formData.fullName,
            email: formData.email,
            phone_number: formData.phoneNumber,
            child_name: formData.childName,
            child_school: formData.childSchool,
            child_grade: formData.childGrade,
            region: formData.region,
            is_verified: false,
            whatsapp_sent: false,
            registration_source: "website",
          },
        ])
        .select()

      if (insertError) {
        console.error("Registration error:", insertError)
        setError("Registration failed. Please try again.")
        setLoading(false)
        return
      }

      // Format and send WhatsApp message
      const whatsappMessage = formatWhatsAppMessage(formData)
      const whatsappSent = await sendWhatsAppMessage(whatsappMessage)

      if (whatsappSent && data && data[0]) {
        // Update parent record to mark WhatsApp as sent
        await supabase.from("parents").update({ whatsapp_sent: true }).eq("id", data[0].id)
      }

      // Success - redirect to success page
      router.push("/parents/success")
    } catch (error) {
      console.error("Registration error:", error)
      setError("Registration failed. Please try again.")
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
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-blue-600">GES Books</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Parent Registration</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Register for FREE access to GES-approved books, stationery, and school supplies at wholesale prices.
          </p>
        </div>

        {/* Key Info Card */}
        <Card className="mb-6 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">FREE for Parents</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">₵0.00</span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              No platform fees, no hidden charges. Access quality educational materials at wholesale prices.
            </p>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>GES-approved textbooks for all grades</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Quality stationery and school supplies</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>School uniforms and accessories</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Direct delivery to your location</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card className="border-blue-100 shadow-lg mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Create Your Parent Account</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Parent Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <User className="h-4 w-4" />
                  Parent Information
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
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email address"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="e.g., 0551234567"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
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
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
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

              {/* Child Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <School className="h-4 w-4" />
                  Child Information
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childName" className="text-sm font-medium">
                    Child's Name
                  </Label>
                  <Input
                    id="childName"
                    type="text"
                    required
                    value={formData.childName}
                    onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                    placeholder="Enter your child's name"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childSchool" className="text-sm font-medium">
                    School Name
                  </Label>
                  <Input
                    id="childSchool"
                    type="text"
                    required
                    value={formData.childSchool}
                    onChange={(e) => setFormData({ ...formData, childSchool: e.target.value })}
                    placeholder="Enter school name"
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childGrade" className="text-sm font-medium">
                    Grade/Class
                  </Label>
                  <Select
                    value={formData.childGrade}
                    onValueChange={(value) => setFormData({ ...formData, childGrade: value })}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Select grade/class" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3 py-4">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                  className="border-blue-300 data-[state=checked]:bg-blue-600 mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the{" "}
                  <Link href="/parents/terms" className="text-blue-600 hover:underline font-medium">
                    Terms and Conditions
                  </Link>{" "}
                  and confirm that I am a parent/guardian registering for GES-approved educational materials.
                </Label>
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
                    Creating Account...
                  </div>
                ) : (
                  "Register for FREE"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 mb-1">What happens next?</p>
                <p className="text-sm text-green-700 leading-relaxed">
                  Your registration details will be sent to our team via WhatsApp for verification. You'll receive
                  access to our GES books catalog within 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-medium text-blue-600">DataFlex GES Books Platform</span>
          </p>
        </div>
      </div>
    </div>
  )
}

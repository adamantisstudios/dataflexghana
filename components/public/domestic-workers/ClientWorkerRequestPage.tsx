"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { CheckCircle, Loader2 } from "lucide-react"

export default function ClientWorkerRequestPage() {
  const [formData, setFormData] = useState({
    client_full_name: "",
    client_phone: "",
    client_email: "",
    exact_location: "",
    number_of_people_needing_support: "1",
    person_needing_support: "",
    religious_faith: "",
    salary_estimation: "",
    working_hours_days: "",
    worker_type: "live-out",
    faith_preference: "any-faith",
    start_date_preference: "",
    additional_info: "",
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Validation
      if (!formData.client_full_name || !formData.client_phone || !formData.exact_location) {
        toast.error("Please fill in name, phone, and location (required fields)")
        return
      }

      // Phone validation (Ghana format)
      const phoneRegex = /^(\+233|0)[0-9]{9}$/
      if (!phoneRegex.test(formData.client_phone.replace(/\s/g, ""))) {
        toast.error("Please enter a valid Ghana phone number")
        return
      }

      const { error } = await supabase.from("domestic_workers_client_requests").insert([
        {
          client_full_name: formData.client_full_name,
          client_phone: formData.client_phone,
          client_email: formData.client_email || null,
          exact_location: formData.exact_location,
          number_of_people_needing_support: Number.parseInt(formData.number_of_people_needing_support) || 1,
          person_needing_support: formData.person_needing_support || null,
          religious_faith: formData.religious_faith || null,
          salary_estimation: formData.salary_estimation || null,
          working_hours_days: formData.working_hours_days || null,
          worker_type: formData.worker_type,
          faith_preference: formData.faith_preference,
          start_date_preference: formData.start_date_preference || null,
          additional_info: formData.additional_info || null,
          status: "pending",
          submitted_from: "public",
          request_source: "direct_form",
        },
      ])

      if (error) throw error

      toast.success("Request submitted successfully! Admin will contact you soon.")
      setSubmitted(true)

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          client_full_name: "",
          client_phone: "",
          client_email: "",
          exact_location: "",
          number_of_people_needing_support: "1",
          person_needing_support: "",
          religious_faith: "",
          salary_estimation: "",
          working_hours_days: "",
          worker_type: "live-out",
          faith_preference: "any-faith",
          start_date_preference: "",
          additional_info: "",
        })
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error("[v0] Error submitting request:", error)
      toast.error("Failed to submit request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-green-900 mb-2">Request a Domestic Worker</h1>
          <p className="text-green-700 text-sm sm:text-base">
            Tell us your requirements and we'll help you find the perfect professional for your home
          </p>
        </div>

        {/* Success State */}
        {submitted && (
          <Card className="border-green-300 bg-green-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Request Submitted Successfully!</h3>
                  <p className="text-sm text-green-700">
                    Our admin will review your request and contact you soon via WhatsApp or phone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Card */}
        {!submitted && (
          <Card className="border-green-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardTitle className="text-xl">Fill Your Requirements</CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Essential Information Section */}
                <div>
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      1
                    </span>
                    Essential Information (Required)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client_full_name" className="text-xs font-medium text-gray-700">
                        Full Name *
                      </Label>
                      <Input
                        id="client_full_name"
                        name="client_full_name"
                        value={formData.client_full_name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className="h-9 text-sm border-green-200"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="client_phone" className="text-xs font-medium text-gray-700">
                        Phone Number *
                      </Label>
                      <Input
                        id="client_phone"
                        name="client_phone"
                        value={formData.client_phone}
                        onChange={handleInputChange}
                        placeholder="+233 50X XXX XXX"
                        className="h-9 text-sm border-green-200"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="client_email" className="text-xs font-medium text-gray-700">
                        Email Address
                      </Label>
                      <Input
                        id="client_email"
                        name="client_email"
                        type="email"
                        value={formData.client_email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="h-9 text-sm border-green-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="exact_location" className="text-xs font-medium text-gray-700">
                        Location *
                      </Label>
                      <Input
                        id="exact_location"
                        name="exact_location"
                        value={formData.exact_location}
                        onChange={handleInputChange}
                        placeholder="e.g., East Legon, Tema, Accra"
                        className="h-9 text-sm border-green-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Worker Preferences Section */}
                <div>
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      2
                    </span>
                    Worker Preferences
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="worker_type" className="text-xs font-medium text-gray-700">
                        Worker Type
                      </Label>
                      <Select
                        value={formData.worker_type}
                        onValueChange={(value) => handleSelectChange("worker_type", value)}
                      >
                        <SelectTrigger id="worker_type" className="h-9 text-sm border-green-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="live-in">Live-In</SelectItem>
                          <SelectItem value="live-out">Live-Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="number_of_people_needing_support" className="text-xs font-medium text-gray-700">
                        Number of People
                      </Label>
                      <Select
                        value={formData.number_of_people_needing_support}
                        onValueChange={(value) => handleSelectChange("number_of_people_needing_support", value)}
                      >
                        <SelectTrigger id="number_of_people_needing_support" className="h-9 text-sm border-green-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="person_needing_support" className="text-xs font-medium text-gray-700">
                        Type of Support Needed
                      </Label>
                      <Input
                        id="person_needing_support"
                        name="person_needing_support"
                        value={formData.person_needing_support}
                        onChange={handleInputChange}
                        placeholder="e.g., Elderly care, Childcare, Housekeeping"
                        className="h-9 text-sm border-green-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="working_hours_days" className="text-xs font-medium text-gray-700">
                        Working Hours
                      </Label>
                      <Input
                        id="working_hours_days"
                        name="working_hours_days"
                        value={formData.working_hours_days}
                        onChange={handleInputChange}
                        placeholder="e.g., 8 hours/day, 5 days/week"
                        className="h-9 text-sm border-green-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="salary_estimation" className="text-xs font-medium text-gray-700">
                        Salary Range (GHS)
                      </Label>
                      <Input
                        id="salary_estimation"
                        name="salary_estimation"
                        value={formData.salary_estimation}
                        onChange={handleInputChange}
                        placeholder="e.g., 150-300"
                        className="h-9 text-sm border-green-200"
                      />
                    </div>

                    <div>
                      <Label htmlFor="start_date_preference" className="text-xs font-medium text-gray-700">
                        Preferred Start Date
                      </Label>
                      <Input
                        id="start_date_preference"
                        name="start_date_preference"
                        type="date"
                        value={formData.start_date_preference}
                        onChange={handleInputChange}
                        className="h-9 text-sm border-green-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Faith & Religious Preferences Section */}
                <div>
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      3
                    </span>
                    Additional Preferences (Optional)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="faith_preference" className="text-xs font-medium text-gray-700">
                        Faith Preference
                      </Label>
                      <Select
                        value={formData.faith_preference}
                        onValueChange={(value) => handleSelectChange("faith_preference", value)}
                      >
                        <SelectTrigger id="faith_preference" className="h-9 text-sm border-green-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any-faith">Any Faith</SelectItem>
                          <SelectItem value="same-faith">Same Faith</SelectItem>
                          <SelectItem value="different-faith">Different Faith</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="religious_faith" className="text-xs font-medium text-gray-700">
                        Your Religion
                      </Label>
                      <Input
                        id="religious_faith"
                        name="religious_faith"
                        value={formData.religious_faith}
                        onChange={handleInputChange}
                        placeholder="e.g., Christian, Muslim"
                        className="h-9 text-sm border-green-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div>
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      4
                    </span>
                    Additional Information
                  </h3>
                  <div>
                    <Label htmlFor="additional_info" className="text-xs font-medium text-gray-700">
                      Special Requirements or Notes
                    </Label>
                    <Textarea
                      id="additional_info"
                      name="additional_info"
                      value={formData.additional_info}
                      onChange={handleInputChange}
                      placeholder="Tell us any special requirements, preferences, or additional details that will help us find the right match for you..."
                      rows={4}
                      className="text-sm border-green-200"
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-green-800">
                    <strong>Required fields:</strong> Full Name, Phone Number, and Location. Other fields help us match
                    you with the perfect domestic worker but can be left blank.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4 border-t border-green-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="flex-1 text-sm h-10"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-sm h-10 font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

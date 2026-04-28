"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Users, ArrowRight, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface DomesticWorkerSlideUpNotificationProps {
  variant?: "agent" | "public"
}

export function DomesticWorkerSlideUpNotification({ variant = "public" }: DomesticWorkerSlideUpNotificationProps) {
  const [showNotification, setShowNotification] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
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

  useEffect(() => {
    const appearTimer = setTimeout(() => {
      setShowNotification(true)
    }, 10000) // 10 seconds before appearing
    const closeTimer = setTimeout(() => {
      setShowNotification(false)
    }, 20000) // 10 seconds stay + 10 seconds slide down = 20 seconds total (adjust as needed)
    return () => {
      clearTimeout(appearTimer)
      clearTimeout(closeTimer)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      if (!formData.client_full_name || !formData.client_phone || !formData.exact_location) {
        toast.error("Please fill in name, phone, and location")
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
        },
      ])

      if (error) {
        throw new Error(error.message || "Failed to submit request")
      }

      setShowSuccessMessage(true)
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

      // Auto-hide success message after 8 seconds, keep form showing
      setTimeout(() => {
        setShowSuccessMessage(false)
        setShowForm(false)
      }, 8000)
    } catch (error) {
      console.error("Error submitting request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out`}
        style={{
          transform: showNotification ? "translateY(0)" : "translateY(100%)",
        }}
      >
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg border-t-2 border-purple-200">
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
              {/* Left: Image Placeholder */}
              <div className="order-2 md:order-1">
                <div className="w-full rounded-lg overflow-hidden shadow-lg">
                  <img
                    src="/domestic-worker-profile.jpg"
                    alt="Domestic Worker Services"
                    className="w-full h-64 md:h-72 object-cover rounded-lg"
                  />
                </div>
              </div>
              {/* Right: Content with Text Above Button */}
              <div className="order-1 md:order-2 space-y-4 relative">
                {/* Close Button */}
                <button
                  onClick={() => setShowNotification(false)}
                  className="absolute -top-2 -right-2 p-2 hover:bg-purple-100 rounded-full transition-colors z-10"
                  aria-label="Close notification"
                >
                  <X className="h-5 w-5 text-purple-600" />
                </button>
                {/* Text Content - Above Button */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-purple-800">Need a Domestic Worker?</h3>
                  </div>
                  <p className="text-gray-700 text-base md:text-lg">
                    Find trusted, verified home care professionals. Housekeepers, nannies, personal nurses, and more.
                  </p>
                </div>
                {/* Button Below Text */}
                <div className="pt-2">
                  <Button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-base md:text-lg"
                  >
                    Register Here
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                {/* Helper Text */}
                <p className="text-xs md:text-sm text-gray-500 text-center">This notification closes in 10 seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50 transition-opacity" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {showSuccessMessage ? (
              <Card className="w-full max-w-md border-green-300 shadow-2xl bg-white">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-64">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-green-700">Request Submitted!</h2>
                    <p className="text-gray-600">Your domestic worker request has been successfully submitted.</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full text-left">
                    <p className="text-sm font-semibold text-blue-900 mb-2">What happens next?</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>✓ We review your request</li>
                      <li>✓ A contact person will call you within 2-3 hours</li>
                      <li>✓ We'll discuss your needs and find the perfect match</li>
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500">This message will close automatically in a few seconds...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-green-300 shadow-2xl">
                <CardHeader className="bg-green-600 text-white sticky top-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Domestic Worker Request</CardTitle>
                    <button
                      onClick={() => setShowForm(false)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium">Your Full Name *</Label>
                      <Input
                        name="client_full_name"
                        value={formData.client_full_name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Phone Number *</Label>
                      <Input
                        name="client_phone"
                        value={formData.client_phone}
                        onChange={handleInputChange}
                        placeholder="+233 XXX XXX XXX"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Email Address</Label>
                      <Input
                        name="client_email"
                        type="email"
                        value={formData.client_email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Exact Location *</Label>
                      <Input
                        name="exact_location"
                        value={formData.exact_location}
                        onChange={handleInputChange}
                        placeholder="Your address/area"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Number of People Needing Support</Label>
                      <Select
                        value={formData.number_of_people_needing_support}
                        onValueChange={(value) => handleSelectChange("number_of_people_needing_support", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
                      <Label className="text-xs font-medium">Person (s) Needing Support</Label>
                      <Input
                        name="person_needing_support"
                        value={formData.person_needing_support}
                        onChange={handleInputChange}
                        placeholder="e.g., Elderly parent, Child"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Worker Type Needed</Label>
                      <Select
                        value={formData.worker_type}
                        onValueChange={(value) => handleSelectChange("worker_type", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="live-in">Live-In</SelectItem>
                          <SelectItem value="live-out">Live-Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Preferred Faith</Label>
                      <Select
                        value={formData.faith_preference}
                        onValueChange={(value) => handleSelectChange("faith_preference", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
                      <Label className="text-xs font-medium">Your Religious Faith</Label>
                      <Input
                        name="religious_faith"
                        value={formData.religious_faith}
                        onChange={handleInputChange}
                        placeholder="e.g., Christian, Muslim"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Salary Range (GHS)</Label>
                      <Input
                        name="salary_estimation"
                        value={formData.salary_estimation}
                        onChange={handleInputChange}
                        placeholder="e.g., 150-300"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Working Hours/Days</Label>
                      <Input
                        name="working_hours_days"
                        value={formData.working_hours_days}
                        onChange={handleInputChange}
                        placeholder="e.g., 8 hours/day, 5 days/week"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Start Date Preference</Label>
                      <Input
                        name="start_date_preference"
                        type="date"
                        value={formData.start_date_preference}
                        onChange={handleInputChange}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Additional Information</Label>
                    <Textarea
                      name="additional_info"
                      value={formData.additional_info}
                      onChange={handleInputChange}
                      placeholder="Special requirements..."
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                  <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                    Required: Name, Phone, Location. Others optional.
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 text-xs h-8">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                    >
                      {loading ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </>
  )
}

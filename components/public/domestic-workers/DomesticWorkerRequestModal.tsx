"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, GraduationCap, Clock, Loader2, CheckCircle } from "lucide-react"
import type { DomesticWorker } from "./DomesticWorkersClient"

interface DomesticWorkerRequestModalProps {
  worker: DomesticWorker
  isOpen: boolean
  onClose: () => void
}

export default function DomesticWorkerRequestModal({ worker, isOpen, onClose }: DomesticWorkerRequestModalProps) {
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientLocation: "",
    serviceType: "",
    message: "",
    budgetRange: "",
    startDate: "",
    candidateName: worker.full_name,
    numberOfPeopleNeedingSupport: "",
    personNeedingSupport: "",
    religiousFaith: "",
    workingHoursDays: "",
    workerType: "",
    faithPreference: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/worker-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          preferredWorkerId: worker.id,
          candidateName: worker.full_name,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to submit request")
      }

      setIsSubmitted(true)

      setTimeout(() => {
        setIsSubmitted(false)
        setFormData({
          clientName: "",
          clientPhone: "",
          clientEmail: "",
          clientLocation: "",
          serviceType: "",
          message: "",
          budgetRange: "",
          startDate: "",
          candidateName: worker.full_name,
          numberOfPeopleNeedingSupport: "",
          personNeedingSupport: "",
          religiousFaith: "",
          workingHoursDays: "",
          workerType: "",
          faithPreference: "",
        })
        onClose()
      }, 3000)
    } catch (error) {
      console.error("Error submitting request:", error)
      alert("Error submitting request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAbridgedName = (fullName: string) => {
    const names = fullName.split(" ")
    if (names.length === 1) return names[0]
    return `${names[0]} ${names[names.length - 1].charAt(0)}.`
  }

  const getAgeRange = (age: number) => {
    if (age <= 25) return "20-25"
    if (age <= 30) return "26-30"
    if (age <= 35) return "31-35"
    if (age <= 40) return "36-40"
    return "40+"
  }

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">Request Submitted!</h3>
            <p className="text-green-600 mb-4">
              Your request has been sent successfully. We'll contact you soon to discuss your requirements.
            </p>
            <p className="text-sm text-gray-500">This window will close automatically...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-800">
            Request {getAbridgedName(worker.full_name)} for Your Service
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Worker Info Card */}
          <div className="lg:col-span-1">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">Worker Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="aspect-square w-full bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg overflow-hidden">
                  <img
                    src={
                      worker.image_url_1 || "/placeholder.svg?height=200&width=200&query=professional domestic worker"
                    }
                    alt={getAbridgedName(worker.full_name)}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-green-800">{getAbridgedName(worker.full_name)}</h3>

                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Users className="h-4 w-4" />
                    <span>Age: {getAgeRange(worker.age)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Clock className="h-4 w-4" />
                    <span>{worker.years_of_experience} years experience</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <MapPin className="h-4 w-4" />
                    <span>{worker.current_location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <GraduationCap className="h-4 w-4" />
                    <span>{worker.highest_education_level}</span>
                  </div>

                  <div className="text-sm">
                    <strong className="text-green-800">Skills:</strong>
                    <p className="text-green-600">{worker.key_skills}</p>
                  </div>

                  <Badge className={worker.availability_status === "available" ? "bg-green-500" : "bg-red-500"}>
                    {worker.availability_status === "available" ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800 border-b border-green-200 pb-2">
                  Your Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Full Name *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => handleInputChange("clientName", e.target.value)}
                      required
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="candidateName">Requesting Worker *</Label>
                    <Input
                      id="candidateName"
                      value={formData.candidateName}
                      onChange={(e) => handleInputChange("candidateName", e.target.value)}
                      required
                      className="border-green-200 focus:border-green-500 bg-green-50"
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientPhone">Phone Number *</Label>
                    <Input
                      id="clientPhone"
                      value={formData.clientPhone}
                      onChange={(e) => handleInputChange("clientPhone", e.target.value)}
                      required
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientEmail">Email Address</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="clientLocation">Your Location *</Label>
                  <Input
                    id="clientLocation"
                    value={formData.clientLocation}
                    onChange={(e) => handleInputChange("clientLocation", e.target.value)}
                    required
                    placeholder="e.g., East Legon, Accra"
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Service Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800 border-b border-green-200 pb-2">
                  Service Requirements
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceType">Type of Service Needed *</Label>
                    <Select
                      value={formData.serviceType}
                      onValueChange={(value) => handleInputChange("serviceType", value)}
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-500">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="housekeeper">Housekeeper</SelectItem>
                        <SelectItem value="nanny">Nanny/Childcare</SelectItem>
                        <SelectItem value="cook">Cook</SelectItem>
                        <SelectItem value="cleaner">Cleaner</SelectItem>
                        <SelectItem value="gardener">Gardener</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="security">Security Guard</SelectItem>
                        <SelectItem value="elderly-care">Elderly Care</SelectItem>
                        <SelectItem value="personal-nurse">Personal Nurse</SelectItem>
                        <SelectItem value="personal-aide">Personal Aide</SelectItem>
                        <SelectItem value="hospital-support">Hospital Support Worker</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="workerType">Worker Type Preference</Label>
                    <Select
                      value={formData.workerType}
                      onValueChange={(value) => handleInputChange("workerType", value)}
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-500">
                        <SelectValue placeholder="Select worker type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live-in">Live-in</SelectItem>
                        <SelectItem value="live-out">Live-out</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budgetRange">Budget Range</Label>
                    <Input
                      id="budgetRange"
                      value={formData.budgetRange}
                      onChange={(e) => handleInputChange("budgetRange", e.target.value)}
                      placeholder="e.g., GH¢800-1200/month"
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="workingHoursDays">Working Hours/Days</Label>
                    <Input
                      id="workingHoursDays"
                      value={formData.workingHoursDays}
                      onChange={(e) => handleInputChange("workingHoursDays", e.target.value)}
                      placeholder="e.g., Monday-Friday, 8am-5pm"
                      className="border-green-200 focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numberOfPeopleNeedingSupport">Number of People Needing Support</Label>
                    <Select
                      value={formData.numberOfPeopleNeedingSupport}
                      onValueChange={(value) => handleInputChange("numberOfPeopleNeedingSupport", value)}
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-500">
                        <SelectValue placeholder="Select number" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 person</SelectItem>
                        <SelectItem value="2">2 people</SelectItem>
                        <SelectItem value="3">3 people</SelectItem>
                        <SelectItem value="4">4 people</SelectItem>
                        <SelectItem value="5+">5+ people</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="personNeedingSupport">Who Needs Support?</Label>
                    <Select
                      value={formData.personNeedingSupport}
                      onValueChange={(value) => handleInputChange("personNeedingSupport", value)}
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-500">
                        <SelectValue placeholder="Select person type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elderly">Elderly person</SelectItem>
                        <SelectItem value="children">Children</SelectItem>
                        <SelectItem value="disabled">Person with disability</SelectItem>
                        <SelectItem value="patient">Patient/Sick person</SelectItem>
                        <SelectItem value="family">General family support</SelectItem>
                        <SelectItem value="household">Household management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="religiousFaith">Your Religious Faith</Label>
                    <Select
                      value={formData.religiousFaith}
                      onValueChange={(value) => handleInputChange("religiousFaith", value)}
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-500">
                        <SelectValue placeholder="Select your faith" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="christian">Christian</SelectItem>
                        <SelectItem value="muslim">Muslim</SelectItem>
                        <SelectItem value="traditional">Traditional</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="none">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="faithPreference">Worker Faith Preference</Label>
                    <Select
                      value={formData.faithPreference}
                      onValueChange={(value) => handleInputChange("faithPreference", value)}
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-500">
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="same-faith">Same faith as mine</SelectItem>
                        <SelectItem value="christian">Christian</SelectItem>
                        <SelectItem value="muslim">Muslim</SelectItem>
                        <SelectItem value="traditional">Traditional</SelectItem>
                        <SelectItem value="no-preference">No preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="startDate">When do you need the service to start?</Label>
                  <Select value={formData.startDate} onValueChange={(value) => handleInputChange("startDate", value)}>
                    <SelectTrigger className="border-green-200 focus:border-green-500">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediately">Immediately</SelectItem>
                      <SelectItem value="within-1-week">Within 1 week</SelectItem>
                      <SelectItem value="within-2-weeks">Within 2 weeks</SelectItem>
                      <SelectItem value="within-1-month">Within 1 month</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Additional Requirements</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    placeholder="Please describe any other specific requirements, special needs, or preferences..."
                    className="border-green-200 focus:border-green-500"
                    rows={4}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4 border-t border-green-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 bg-transparent"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                  {isSubmitting ? (
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

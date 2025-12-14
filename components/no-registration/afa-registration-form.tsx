"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { Users, UserCheck } from "lucide-react"
import { PaymentConfirmationModal } from "@/components/payment-confirmation-modal"

export function AFARegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    location: "",
    dateOfBirth: "",
    ghanaCardId: "",
    referringAgent: "",
  })

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingMessage, setPendingMessage] = useState("")

  const registrationFee = 15

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.phone || !formData.email || !formData.ghanaCardId) {
      alert("Please fill in all required fields")
      return
    }

    const message = `AFA Registration Request:

Registration Type: AFA Registration
Registration Fee: ₵${registrationFee}

Personal Information:
Full Name: ${formData.fullName}
Phone Number: ${formData.phone}
Email: ${formData.email}
Ghana Card ID: ${formData.ghanaCardId}
Location: ${formData.location}
Date of Birth: ${formData.dateOfBirth}
Referring Agent: ${formData.referringAgent || "None"}

💳 PAYMENT CONFIRMATION:
✅ Customer confirmed payment completed to 0557943392
Payment Name: Adamantis Solutions (Francis Ani-Johnson .K)`

    setPendingMessage(message)
    setShowPaymentModal(true)
  }

  const handlePaymentConfirmed = () => {
    const whatsappUrl = generateWhatsAppLink(pendingMessage)
    window.open(whatsappUrl, "_blank")
    setShowPaymentModal(false)

    // Reset form
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      location: "",
      dateOfBirth: "",
      ghanaCardId: "",
      referringAgent: "",
    })
  }

  const afaBenefits = [
    "General user access to all services",
    "Priority customer support",
    "Access to exclusive promotions",
    "Birthday treats and gift bundles",
    "Bulk data deals",
    "Free service updates",
  ]

  return (
    <div className="space-y-8">
      {/* AFA Registration Card */}
      <Card className="relative max-w-2xl mx-auto">
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1">
          Popular Choice
        </Badge>

        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">AFA Registration</CardTitle>
          <CardDescription className="text-gray-600">Full access to all DataFlex Ghana services</CardDescription>
          <div className="text-3xl font-bold mt-4">
            <span className="text-green-600">₵15</span>
          </div>
        </CardHeader>

        <CardContent>
          <ul className="space-y-2 text-sm mb-6">
            {afaBenefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <UserCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ghanaCardId">Ghana Card ID *</Label>
              <Input
                id="ghanaCardId"
                type="text"
                placeholder="Enter your Ghana Card ID"
                value={formData.ghanaCardId}
                onChange={(e) => setFormData({ ...formData, ghanaCardId: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Enter your location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referringAgent">Referring Agent Contact (Optional)</Label>
              <Input
                id="referringAgent"
                type="text"
                placeholder="Enter referring agent's contact if any"
                value={formData.referringAgent}
                onChange={(e) => setFormData({ ...formData, referringAgent: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Submit AFA Registration
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Agent Registration Redirect */}
      <Card className="max-w-2xl mx-auto bg-blue-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Looking to Become an Agent?</h3>
          <p className="text-blue-600 mb-4">
            Join our agent program and earn commissions on referrals with exclusive reseller benefits.
          </p>
          <Button
            asChild
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-transparent"
          >
            <a href="/register">Go to Agent Registration</a>
          </Button>
        </CardContent>
      </Card>

      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirmed}
        orderSummary={{
          service: "AFA Registration",
          amount: registrationFee,
          total: registrationFee,
        }}
      />
    </div>
  )
}

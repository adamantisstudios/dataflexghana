"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { Users, UserCheck, Copy } from "lucide-react"
import { PaymentConfirmationModal } from "@/components/payment-confirmation-modal"
import { toast } from "sonner"
import { generatePaymentReferenceCode } from "@/lib/reference-code-generator"

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
  const [paymentReference, setPaymentReference] = useState("")

  const registrationFee = 15

  const generateNewReference = () => {
    const reference = generatePaymentReferenceCode()
    setPaymentReference(reference)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const reference = paymentReference || generatePaymentReferenceCode()
    if (!paymentReference) {
      setPaymentReference(reference)
    }

    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })

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

💳 PAYMENT REFERENCE: ${reference}
Bank Transfer/MoMo Account: 0557943392
Business Name: Adamantis Solutions (Francis Ani-Johnson .K)

⏱️ ORDER PLACED AT: ${timeString}
🏢 CLOSING TIME: 9:30 PM

🔗 TERMS & CONDITIONS: https://dataflexghana.com/terms

Instructions:
1. Use the payment reference above when making payment
2. Send payment to: 0557943392
3. Share this message via WhatsApp after confirming payment`

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
    setPaymentReference("")
  }

  const copyReference = () => {
    if (paymentReference) {
      navigator.clipboard.writeText(paymentReference)
      toast.success("Payment reference copied!")
    }
  }

  const afaBenefits = [
    "Free or heavily discounted calls to other MTN AFA members",
    "Discounted call rates to non-AFA MTN numbers",
    "Included call minutes to other networks",
    "Better value for airtime through bundled talk time",
    "Flexible weekly or monthly bundle options",
    "Affordable communication within groups or communities",
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
          <CardDescription className="text-gray-600">Fill Forms To Register For AFA Services</CardDescription>
          <div className="text-3xl font-bold mt-4">
            <span className="text-green-600">₵30</span>
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

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-green-900">Payment Reference Code</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={generateNewReference} className="text-xs">
                      Generate New
                    </Button>
                  </div>

                  {paymentReference ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-white border border-green-300 rounded-lg">
                        <p className="text-lg font-mono font-bold text-green-900">{paymentReference}</p>
                        <p className="text-xs text-green-600 mt-1">Use this code when making payment</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyReference}
                        className="border-green-300 bg-transparent"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateNewReference}
                      className="w-full border-green-300 text-green-600 hover:bg-green-50 bg-transparent"
                    >
                      Generate Payment Reference
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

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

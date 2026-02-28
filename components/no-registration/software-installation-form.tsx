"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { Download, Copy } from "lucide-react"
import { PaymentConfirmationModal } from "@/components/payment-confirmation-modal"
import { generatePaymentReferenceCode } from "@/lib/reference-code-generator"
import { toast } from "sonner"

interface SoftwareInstallationFormProps {
  selectedSoftware: {
    name: string
    price: number
    description: string
  }
}

export function SoftwareInstallationForm({ selectedSoftware }: SoftwareInstallationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    serviceType: "",
    deviceType: "",
    operatingSystem: "",
    preferredDate: "",
    preferredTime: "",
    hasInternet: "",
    hasLicense: "",
    additionalNotes: "",
  })

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingMessage, setPendingMessage] = useState("")
  const [paymentReference, setPaymentReference] = useState("")

  const generateNewReference = () => {
    const reference = generatePaymentReferenceCode()
    setPaymentReference(reference)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.phone || !formData.serviceType) {
      alert("Please fill in all required fields")
      return
    }

    const reference = paymentReference || generatePaymentReferenceCode()
    if (!paymentReference) {
      setPaymentReference(reference)
    }

    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })

    const message = `Software Installation Request:

Software: ${selectedSoftware.name}
Price: ₵${selectedSoftware.price}

Customer Details:
Name: ${formData.name}
Phone: ${formData.phone}
Service Type: ${formData.serviceType}
Device Type: ${formData.deviceType}
Operating System: ${formData.operatingSystem}
Preferred Date: ${formData.preferredDate}
Preferred Time: ${formData.preferredTime}
Internet Available: ${formData.hasInternet}
Has License: ${formData.hasLicense}
Additional Notes: ${formData.additionalNotes || "None"}

💳 PAYMENT REFERENCE: ${reference}
Bank Transfer/MoMo Account: 0557943392
Business Name: Adamantis Solutions (Francis Ani-Johnson .K)

⏱️ ORDER PLACED AT: ${timeString}
🏢 CLOSING TIME: 9:30 PM

🔗 TERMS & CONDITIONS: https://dataflexghana.com/terms

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

    setFormData({
      name: "",
      phone: "",
      serviceType: "",
      deviceType: "",
      operatingSystem: "",
      preferredDate: "",
      preferredTime: "",
      hasInternet: "",
      hasLicense: "",
      additionalNotes: "",
    })
    setPaymentReference("")
  }

  const copyReference = () => {
    if (paymentReference) {
      navigator.clipboard.writeText(paymentReference)
      toast.success("Payment reference copied!")
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Download className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Software Installation Request</CardTitle>
          <CardDescription>
            {selectedSoftware.name} - ₵{selectedSoftware.price}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

            <div className="space-y-3">
              <Label>Service Type *</Label>
              <RadioGroup
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="home" id="home" />
                  <Label htmlFor="home">Home Visit (Additional travel cost may apply)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remote" id="remote" />
                  <Label htmlFor="remote">Remote Installation (via TeamViewer/AnyDesk)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceType">Device Type</Label>
                <Select
                  value={formData.deviceType}
                  onValueChange={(value) => setFormData({ ...formData, deviceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop">Desktop Computer</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="os">Current Operating System</Label>
                <Select
                  value={formData.operatingSystem}
                  onValueChange={(value) => setFormData({ ...formData, operatingSystem: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="windows-xp">Windows XP</SelectItem>
                    <SelectItem value="windows-7">Windows 7</SelectItem>
                    <SelectItem value="windows-8">Windows 8/8.1</SelectItem>
                    <SelectItem value="windows-10">Windows 10</SelectItem>
                    <SelectItem value="windows-11">Windows 11</SelectItem>
                    <SelectItem value="macos">macOS</SelectItem>
                    <SelectItem value="linux">Linux</SelectItem>
                    <SelectItem value="none">No OS Installed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Preferred Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Preferred Time</Label>
                <Select
                  value={formData.preferredTime}
                  onValueChange={(value) => setFormData({ ...formData, preferredTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12PM - 4PM)</SelectItem>
                    <SelectItem value="evening">Evening (4PM - 8PM)</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Internet Connection Available?</Label>
                <RadioGroup
                  value={formData.hasInternet}
                  onValueChange={(value) => setFormData({ ...formData, hasInternet: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="internet-yes" />
                    <Label htmlFor="internet-yes">Yes, stable internet available</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="internet-no" />
                    <Label htmlFor="internet-no">No internet connection</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Do you have a software license?</Label>
                <RadioGroup
                  value={formData.hasLicense}
                  onValueChange={(value) => setFormData({ ...formData, hasLicense: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="license-yes" />
                    <Label htmlFor="license-yes">Yes, I have a valid license</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="license-no" />
                    <Label htmlFor="license-no">No, please provide license</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Any special requirements or notes"
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              />
            </div>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-purple-900">Payment Reference Code</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={generateNewReference} className="text-xs">
                      Generate New
                    </Button>
                  </div>

                  {paymentReference ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-white border border-purple-300 rounded-lg">
                        <p className="text-lg font-mono font-bold text-purple-900">{paymentReference}</p>
                        <p className="text-xs text-purple-600 mt-1">Use this code when making payment</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyReference}
                        className="border-purple-300 bg-transparent"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateNewReference}
                      className="w-full border-purple-300 text-purple-600 hover:bg-purple-50 bg-transparent"
                    >
                      Generate Payment Reference
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              Submit Installation Request
            </Button>
          </form>
        </CardContent>
      </Card>

      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirmed}
        orderSummary={{
          service: `Software Installation - ${selectedSoftware.name}`,
          amount: selectedSoftware.price,
          total: selectedSoftware.price,
        }}
        paymentReference={paymentReference}
      />
    </div>
  )
}

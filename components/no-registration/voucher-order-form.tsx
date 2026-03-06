"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { PaymentConfirmationModal } from "@/components/payment-confirmation-modal"
import { generatePaymentReferenceCode } from "@/lib/reference-code-generator"
import { ShoppingCart, FileText, Smartphone, Layout } from "lucide-react"

const OTHER_SERVICES = [
  { id: "router", name: "Router Purchase/Setup", icon: Layout, basePrice: 0 },
  { id: "software", name: "Software Installation", icon: FileText, basePrice: 0 },
  { id: "afa", name: "AFA Registration", icon: Smartphone, basePrice: 15 },
  { id: "voucher", name: "Voucher / Form Purchase", icon: ShoppingCart, basePrice: 0 },
  { id: "other", name: "Other Services", icon: ShoppingCart, basePrice: 0 },
]

export function VoucherOrderForm() {
  const [selectedService, setSelectedService] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    amount: "",
    description: "",
  })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentReference, setPaymentReference] = useState("")
  const [pendingMessage, setPendingMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const reference = generatePaymentReferenceCode()
    setPaymentReference(reference)

    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })

    const serviceName = OTHER_SERVICES.find((s) => s.id === selectedService)?.name || "Service"
    const amount = Number(formData.amount) || 0

    const message = `ORDER REQUEST: ${serviceName.toUpperCase()}

Customer Details:
Name: ${formData.name}
Phone: ${formData.phone}
Amount: ₵${amount.toFixed(2)}
Details: ${formData.description || "N/A"}

💳 PAYMENT REFERENCE: ${reference}
Bank Transfer/MoMo Account: 0557943392
Business Name: Adamantis Solutions (Francis Ani-Johnson .K)

⏱️ ORDER PLACED AT: ${timeString}
🏢 CLOSING TIME: 9:30 PM

🔗 TERMS & CONDITIONS: https://dataflexghana.com/terms

✅ PAYMENT CONFIRMED
Adamantis Solutions (Francis Ani-Johnson .K) - 0557943392`

    setPendingMessage(message)
    setShowPaymentModal(true)
  }

  const handlePaymentConfirmed = () => {
    const whatsappUrl = generateWhatsAppLink(pendingMessage)
    window.open(whatsappUrl, "_blank")
    setShowPaymentModal(false)

    // Reset form
    setFormData({ name: "", phone: "", amount: "", description: "" })
    setSelectedService("")
    setPaymentReference("")
  }

  return (
    <section id="other-services" className="py-16 bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Quick Service Portal</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Order routers, software, vouchers, and more with instant 4-digit reference codes
          </p>
        </div>

        <Card className="max-w-3xl mx-auto border-indigo-200 shadow-xl">
          <CardHeader className="bg-indigo-600 text-white text-center rounded-t-lg">
            <CardTitle className="text-2xl">Standard Service Form</CardTitle>
            <CardDescription className="text-indigo-100">
              Complete your order and receive your payment reference instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-gray-700 font-bold">Select Service *</Label>
                <Select value={selectedService} onValueChange={setSelectedService} required>
                  <SelectTrigger className="border-indigo-200">
                    <SelectValue placeholder="Choose a service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {OTHER_SERVICES.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} {service.basePrice > 0 ? `(₵${service.basePrice})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-bold">Your Name *</Label>
                  <Input
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-indigo-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-bold">Phone Number *</Label>
                  <Input
                    placeholder="e.g. 055..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-indigo-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-bold">Amount to Pay (₵) *</Label>
                <Input
                  type="number"
                  placeholder="Enter total cost"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="border-indigo-200 font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-bold">Order Details / Description</Label>
                <Input
                  placeholder="Describe your request (e.g. ZLT s20 Router, Windows 11 installation)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border-indigo-200"
                />
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800 italic">
                * A 4-digit payment reference code will be generated upon submission. Please use it when making your
                payment.
              </div>

              <Button
                type="submit"
                className="w-full py-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 transition-all duration-300"
              >
                Generate Payment Reference & Order
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirmed}
        orderSummary={{
          service: OTHER_SERVICES.find((s) => s.id === selectedService)?.name || "Service",
          amount: Number(formData.amount) || 0,
          total: Number(formData.amount) || 0,
        }}
        paymentReference={paymentReference}
      />
    </section>
  )
}

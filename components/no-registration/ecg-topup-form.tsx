"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { Zap, Calculator, Copy } from "lucide-react"
import { PaymentConfirmationModal } from "@/components/payment-confirmation-modal"
import { toast } from "sonner"
import { generatePaymentReferenceCode } from "@/lib/reference-code-generator"

const meterTypes = ["NURI", "Holley", "CLOU", "Hexing", "Landis+Gyr", "Other"]

export function ECGTopUpForm() {
  const [formData, setFormData] = useState({
    meterNumber: "",
    amount: "",
    meterType: "",
    phoneNumber: "",
    accountHolder: "",
    address: "",
  })

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingMessage, setPendingMessage] = useState("")
  const [paymentReference, setPaymentReference] = useState("")

  const serviceCharge = 8
  const totalAmount = formData.amount ? Number.parseFloat(formData.amount) + serviceCharge : 0

  const generateNewReference = () => {
    const reference = generatePaymentReferenceCode()
    setPaymentReference(reference)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.meterNumber || !formData.amount || !formData.meterType) {
      alert("Please fill in all required fields")
      return
    }

    const reference = paymentReference || generatePaymentReferenceCode()
    if (!paymentReference) {
      setPaymentReference(reference)
    }

    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })

    const message = `ECG Prepaid Top-Up Request:

Meter Number: ${formData.meterNumber}
Top-Up Amount: ₵${formData.amount}
Service Charge: ₵${serviceCharge}
Total Amount: ₵${totalAmount.toFixed(2)}
Meter Type: ${formData.meterType}
Phone Number: ${formData.phoneNumber || "Not provided"}
Account Holder: ${formData.accountHolder || "Not provided"}
Address: ${formData.address || "Not provided"}

💳 PAYMENT REFERENCE: ${reference}
Bank Transfer/MoMo Account: 0557943392
Business Name: Adamantis Solutions (Francis Ani-Johnson .K)

⏱️ ORDER PLACED AT: ${timeString}
🏢 CLOSING TIME: 11:30 PM

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

    setFormData({
      meterNumber: "",
      amount: "",
      meterType: "",
      phoneNumber: "",
      accountHolder: "",
      address: "",
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
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">ECG Prepaid Top-Up</CardTitle>
          <CardDescription>Top up your ECG prepaid meter instantly. Service charge: ₵8</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meterNumber">Meter Number *</Label>
                <Input
                  id="meterNumber"
                  type="text"
                  placeholder="Enter meter number"
                  value={formData.meterNumber}
                  onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Top-Up Amount (₵) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meterType">Meter Type *</Label>
              <Select
                value={formData.meterType}
                onValueChange={(value) => setFormData({ ...formData, meterType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meter type" />
                </SelectTrigger>
                <SelectContent>
                  {meterTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolder">Account Holder Name</Label>
                <Input
                  id="accountHolder"
                  type="text"
                  placeholder="Enter account holder name"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address/Location</Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter address or location"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {formData.amount && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">Cost Breakdown</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Top-up Amount:</span>
                      <span>₵{Number.parseFloat(formData.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Charge:</span>
                      <span>₵{serviceCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-green-800 border-t pt-2">
                      <span>Total Amount:</span>
                      <span>₵{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-blue-900">Payment Reference Code</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={generateNewReference} className="text-xs">
                      Generate New
                    </Button>
                  </div>

                  {paymentReference ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-white border border-blue-300 rounded-lg">
                        <p className="text-lg font-mono font-bold text-blue-900">{paymentReference}</p>
                        <p className="text-xs text-blue-600 mt-1">Use this code when making payment</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyReference}
                        className="border-blue-300 bg-transparent"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateNewReference}
                      className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                    >
                      Generate Payment Reference
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Submit Top-Up Request
            </Button>
          </form>
        </CardContent>
      </Card>

      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirmed}
        orderSummary={{
          service: "ECG Prepaid Top-Up",
          amount: formData.amount ? Number.parseFloat(formData.amount) : 0,
          serviceCharge: serviceCharge,
          total: totalAmount,
        }}
      />
    </div>
  )
}

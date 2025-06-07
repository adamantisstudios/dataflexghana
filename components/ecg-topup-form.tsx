"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { Zap, Calculator } from "lucide-react"

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

  const serviceCharge = 8
  const totalAmount = formData.amount ? Number.parseFloat(formData.amount) + serviceCharge : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.meterNumber || !formData.amount || !formData.meterType) {
      alert("Please fill in all required fields")
      return
    }

    const message = `ECG Prepaid Top-Up Request:

Meter Number: ${formData.meterNumber}
Top-Up Amount: ₵${formData.amount}
Service Charge: ₵${serviceCharge}
Total Amount: ₵${totalAmount.toFixed(2)}
Meter Type: ${formData.meterType}
Phone Number: ${formData.phoneNumber || "Not provided"}
Account Holder: ${formData.accountHolder || "Not provided"}
Address: ${formData.address || "Not provided"}`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")
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

            {/* Cost Breakdown */}
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

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Submit Top-Up Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

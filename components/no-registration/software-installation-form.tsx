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
import { Download } from "lucide-react"

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.phone || !formData.serviceType) {
      alert("Please fill in all required fields")
      return
    }

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
Additional Notes: ${formData.additionalNotes || "None"}`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")
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

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              Submit Installation Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

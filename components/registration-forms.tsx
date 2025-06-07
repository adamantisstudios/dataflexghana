"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { Users, UserCheck, Crown } from "lucide-react"

const registrationTypes = [
  {
    id: "afa",
    name: "AFA Registration",
    price: 15,
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-100",
    benefits: [
      "General user access to all services",
      "Priority customer support",
      "Access to exclusive promotions",
      "Birthday treats and gift bundles",
      "Bulk data deals",
      "Free service updates",
    ],
    description: "Full access to all DataFlex Ghana services",
  },
  {
    id: "agent",
    name: "Agent Registration",
    price: 10,
    icon: Crown,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    popular: true,
    benefits: [
      "Unlocks reseller discounts for data bundles",
      "Commission on referrals",
      "Agent dashboard access",
      "Bulk purchase discounts",
      "Marketing materials provided",
      "Monthly performance bonuses",
    ],
    description: "Become a reseller and earn commissions",
  },
]

export function RegistrationForms() {
  const [selectedType, setSelectedType] = useState("")
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    location: "",
    dateOfBirth: "",
    referringAgent: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType || !formData.fullName || !formData.phone || !formData.email) {
      alert("Please fill in all required fields and select registration type")
      return
    }

    const selectedRegistration = registrationTypes.find((type) => type.id === selectedType)

    const message = `Registration Request:

Registration Type: ${selectedRegistration?.name}
Registration Fee: ₵${selectedRegistration?.price}

Personal Information:
Full Name: ${formData.fullName}
Phone Number: ${formData.phone}
Email: ${formData.email}
Location: ${formData.location}
Date of Birth: ${formData.dateOfBirth}
Referring Agent: ${formData.referringAgent || "None"}`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="space-y-8">
      {/* Registration Type Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {registrationTypes.map((type) => (
          <Card
            key={type.id}
            className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
              selectedType === type.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
            } ${type.popular ? "ring-2 ring-green-500" : ""}`}
            onClick={() => setSelectedType(type.id)}
          >
            {type.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1">
                Recommended
              </Badge>
            )}

            <CardHeader className="text-center pb-4">
              <div className={`mx-auto w-16 h-16 ${type.bgColor} rounded-full flex items-center justify-center mb-4`}>
                <type.icon className={`h-8 w-8 ${type.color}`} />
              </div>
              <CardTitle className="text-2xl">{type.name}</CardTitle>
              <CardDescription className="text-gray-600">{type.description}</CardDescription>
              <div className="text-3xl font-bold mt-4">
                <span className={type.color}>₵{type.price}</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2 text-sm">
                {type.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <UserCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Registration Form */}
      {selectedType && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Registration Form</CardTitle>
            <CardDescription>
              {registrationTypes.find((type) => type.id === selectedType)?.name} - ₵
              {registrationTypes.find((type) => type.id === selectedType)?.price}
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Submit Registration
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

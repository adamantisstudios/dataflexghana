"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { User } from "lucide-react"

interface CVOrderFormProps {
  selectedPackage: {
    id: string
    name: string
    price: number
    description: string
  }
}

export function CVOrderForm({ selectedPackage }: CVOrderFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    currentJobTitle: "",
    targetJobTitle: "",
    industry: "",
    experienceLevel: "",
    education: "",
    skills: "",
    achievements: "",
    additionalInfo: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.email || !formData.phone) {
      alert("Please fill in all required fields")
      return
    }

    const message = `CV Writing Service Order:

Package: ${selectedPackage.name}
Price: ₵${selectedPackage.price}

Personal Information:
Full Name: ${formData.fullName}
Email: ${formData.email}
Phone: ${formData.phone}

Career Information:
Current Job Title: ${formData.currentJobTitle}
Target Job Title: ${formData.targetJobTitle}
Industry: ${formData.industry}
Experience Level: ${formData.experienceLevel}
Education: ${formData.education}

Skills: ${formData.skills}
Key Achievements: ${formData.achievements}
Additional Information: ${formData.additionalInfo || "None provided"}`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">CV Writing Order Form</CardTitle>
          <CardDescription>
            {selectedPackage.name} - ₵{selectedPackage.price}
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
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentJob">Current Job Title</Label>
                <Input
                  id="currentJob"
                  type="text"
                  placeholder="e.g. Software Developer"
                  value={formData.currentJobTitle}
                  onChange={(e) => setFormData({ ...formData, currentJobTitle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetJob">Target Job Title</Label>
                <Input
                  id="targetJob"
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.targetJobTitle}
                  onChange={(e) => setFormData({ ...formData, targetJobTitle: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level</Label>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                    <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                    <SelectItem value="senior">Senior Level (6-10 years)</SelectItem>
                    <SelectItem value="executive">Executive (10+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education Background</Label>
              <Textarea
                id="education"
                placeholder="List your educational qualifications (degrees, certifications, etc.)"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Key Skills</Label>
              <Textarea
                id="skills"
                placeholder="List your key skills, technologies, and competencies"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">Key Achievements</Label>
              <Textarea
                id="achievements"
                placeholder="Describe your major accomplishments, awards, or notable projects"
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                placeholder="Any additional information you'd like to include"
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              Submit CV Order
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

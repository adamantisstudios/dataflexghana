"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Upload } from "lucide-react"

interface CurriculumVitaeFormProps {
  agentId: string
  onComplete: () => void
  onCancel: () => void
}

export function CurriculumVitaeForm({ agentId, onComplete, onCancel }: CurriculumVitaeFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"form" | "document">("form")
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    educationHistory: "",
    workHistory: "",
    skills: "",
    certifications: "",
    projects: "",
    publications: "",
    awards: "",
    affiliations: "",
    interests: "",
    references: "",
    specialRequests: "",
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [profileImage, setProfileImage] = useState<File | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      let documentUrl = null
      let imageUrl = null

      if (uploadedFile) {
        const fileName = `cv-${agentId}-${Date.now()}.pdf`
        const { error: uploadError } = await supabase.storage
          .from("professional-writing-documents")
          .upload(fileName, uploadedFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("professional-writing-documents").getPublicUrl(fileName)
        documentUrl = urlData.publicUrl
      }

      if (profileImage) {
        const fileName = `profile-${agentId}-${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from("professional-writing-images")
          .upload(fileName, profileImage)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("professional-writing-images").getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }

      const { error } = await supabase.from("professional_writing_submissions").insert([
        {
          agent_id: agentId,
          service_type: "curriculum-vitae",
          service_name: "Curriculum Vitae",
          status: "pending",
          form_data: formData,
          document_url: documentUrl,
          image_url: imageUrl,
          submitted_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      toast.success("CV request submitted successfully!")
      onComplete()
    } catch (error) {
      console.error("[v0] Error submitting form:", error)
      toast.error("Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant={uploadMethod === "form" ? "default" : "outline"}
          onClick={() => setUploadMethod("form")}
          className="flex-1"
        >
          Fill Form
        </Button>
        <Button
          variant={uploadMethod === "document" ? "default" : "outline"}
          onClick={() => setUploadMethod("document")}
          className="flex-1"
        >
          Upload Document
        </Button>
      </div>

      {uploadMethod === "form" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Full Name</Label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Email Address</Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+233 XXX XXX XXX"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Your address"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Country</Label>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Your country"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Profile Image</Label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
                {profileImage && <p className="text-xs text-green-600 mt-1">Image selected: {profileImage.name}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Education History</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="educationHistory"
                value={formData.educationHistory}
                onChange={handleInputChange}
                placeholder="List your educational background..."
                rows={3}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Work History</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="workHistory"
                value={formData.workHistory}
                onChange={handleInputChange}
                placeholder="List your work experience..."
                rows={3}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="List your skills..."
                rows={2}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Certifications & Training</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="certifications"
                value={formData.certifications}
                onChange={handleInputChange}
                placeholder="List your certifications..."
                rows={2}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="projects"
                value={formData.projects}
                onChange={handleInputChange}
                placeholder="Describe your projects..."
                rows={2}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Publications & Presentations</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="publications"
                value={formData.publications}
                onChange={handleInputChange}
                placeholder="List your publications..."
                rows={2}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Awards & Honors</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="awards"
                value={formData.awards}
                onChange={handleInputChange}
                placeholder="List your awards..."
                rows={2}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Professional Affiliations</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="affiliations"
                value={formData.affiliations}
                onChange={handleInputChange}
                placeholder="List your affiliations..."
                rows={2}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Interests & Hobbies</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="interests"
                value={formData.interests}
                onChange={handleInputChange}
                placeholder="List your interests..."
                rows={2}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">References</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="references"
                value={formData.references}
                onChange={handleInputChange}
                placeholder="List your references..."
                rows={2}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Special Request Section</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                placeholder="Provide any special requests or specific details you want the admin to know about. For example: CV needs to be tailored for specific industry/role, format preferences, keyword optimization, etc."
                rows={4}
                className="text-xs"
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 mb-2">Click anywhere to upload your CV document</p>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX files supported</p>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
              </div>
            </label>
            {uploadedFile && <p className="text-xs text-green-600 mt-2">File selected: {uploadedFile.name}</p>}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1 text-xs h-8 bg-transparent">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-pink-600 hover:bg-pink-700 text-xs h-8">
          {loading ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </div>
  )
}

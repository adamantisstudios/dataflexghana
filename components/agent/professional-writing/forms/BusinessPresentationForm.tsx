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

interface BusinessPresentationFormProps {
  agentId: string
  onComplete: () => void
  onCancel: () => void
}

export function BusinessPresentationForm({ agentId, onComplete, onCancel }: BusinessPresentationFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"form" | "document">("form")
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    businessDescription: "",
    targetAudience: "",
    keyPoints: "",
    callToAction: "",
    additionalNotes: "",
    specialRequests: "",
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

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

  const handleSubmit = async () => {
    try {
      setLoading(true)

      let documentUrl = null

      if (uploadedFile) {
        const fileName = `presentation-${agentId}-${Date.now()}.pdf`
        const { error: uploadError } = await supabase.storage
          .from("professional-writing-documents")
          .upload(fileName, uploadedFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("professional-writing-documents").getPublicUrl(fileName)
        documentUrl = urlData.publicUrl
      }

      const { error } = await supabase.from("professional_writing_submissions").insert([
        {
          agent_id: agentId,
          service_type: "business-presentation",
          status: "pending",
          form_data: formData,
          document_url: documentUrl,
          submitted_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      toast.success("Business presentation request submitted successfully!")
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
              <CardTitle className="text-sm">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Business Name</Label>
                <Input
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Your business name"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Business Type</Label>
                <Input
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  placeholder="e.g., Technology, Retail, Services"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Business Description</Label>
                <Textarea
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleInputChange}
                  placeholder="Describe your business..."
                  rows={3}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Presentation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Target Audience</Label>
                <Textarea
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  placeholder="Who is your target audience?"
                  rows={2}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Key Points</Label>
                <Textarea
                  name="keyPoints"
                  value={formData.keyPoints}
                  onChange={handleInputChange}
                  placeholder="Main points to cover..."
                  rows={2}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Call to Action</Label>
                <Textarea
                  name="callToAction"
                  value={formData.callToAction}
                  onChange={handleInputChange}
                  placeholder="What action do you want from your audience?"
                  rows={2}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Additional Notes</Label>
                <Textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  placeholder="Any additional information..."
                  rows={2}
                  className="text-xs"
                />
              </div>
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
                placeholder="Provide any special requests or specific details you want the admin to know about. For example: Presentation style preference, specific focus areas, branding guidelines, etc."
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
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Click anywhere to upload your presentation document
                </p>
                <p className="text-xs text-gray-500">PDF, PPT, PPTX, DOC, DOCX files supported</p>
                <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={handleFileUpload} className="hidden" />
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

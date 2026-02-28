"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import {
  FileText,
  Edit,
  Eye,
  Search,
  Loader2,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  Clock,
  Send,
  FileDown,
  ImageIcon,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface FormSubmission {
  id: string
  agent_id: string
  form_id: string
  form_data: Record<string, any>
  status: "Pending" | "Processing" | "Completed" | "Delivered"
  submitted_at: string
  updated_at: string
  agent_name?: string
  form_name?: string
}

interface FormImage {
  id: string
  submission_id: string
  image_type: "signature" | "ghana_card_front" | "ghana_card_back"
  image_url: string
  uploaded_at: string
}

interface ChatMessage {
  id: string
  submission_id: string
  sender_type: "agent" | "admin"
  message: string
  created_at: string
}

const SENSITIVE_FIELDS = [
  "ghana_card_number",
  "ghana_card_front",
  "ghana_card_back",
  "tin_number",
  "ssn",
  "passport_number",
  "drivers_license_number",
  "birth_certificate_number",
  "national_id",
  "phone_number",
  "momo_number",
  "bank_account",
  "account_number",
]

const maskSensitiveField = (value: string | any, fieldName: string): string => {
  if (!value || typeof value !== "string") return String(value || "")

  const lowerFieldName = fieldName.toLowerCase()
  const isSensitive = SENSITIVE_FIELDS.some((field) => lowerFieldName.includes(field))

  if (!isSensitive) return value

  // Show only last 4 characters
  if (value.length <= 4) return "****"
  return "*".repeat(value.length - 4) + value.slice(-4)
}

export default function ComplianceTab() {
  const [activeSubTab, setActiveSubTab] = useState("submissions")
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [submissionImages, setSubmissionImages] = useState<FormImage[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [viewingAsAgent, setViewingAsAgent] = useState(true)

  // Load data
  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("form_submissions")
        .select(
          `
          *,
          agents!form_submissions_agent_id_fkey (
            full_name
          )
        `,
        )
        .order("submitted_at", { ascending: false })

      if (submissionsError) throw submissionsError

      const transformedData = submissionsData?.map((sub: any) => {
        // Extract the first name from form_data for display
        const formData = sub.form_data || {}
        const formType = getFormTypeLabel(sub.form_id)

        let displayName = ""
        if (formType === "Sole Proprietorship") {
          displayName = formData.businessName || formData.business_name || formData.firstName || formData.first_name
        } else {
          displayName = formData.full_name?.split(" ")[0] || formData.first_name || formData.name?.split(" ")[0]
        }

        const formName = displayName ? `${formType} - ${displayName}` : formType

        return {
          ...sub,
          agent_name: sub.agents?.full_name || "Unknown Agent",
          form_name: formName,
        }
      })

      setSubmissions(transformedData || [])
    } catch (error) {
      console.error("Error loading submissions:", error)
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissionDetails = async (submissionId: string) => {
    try {
      // Load images
      const { data: imagesData, error: imagesError } = await supabase
        .from("form_images")
        .select("*")
        .eq("submission_id", submissionId)

      if (imagesError) throw imagesError
      setSubmissionImages(imagesData || [])

      // Load chat messages
      const { data: chatData, error: chatError } = await supabase
        .from("compliance_chat")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: true })

      if (chatError) throw chatError
      setChatMessages(chatData || [])
    } catch (error) {
      console.error("Error loading submission details:", error)
      toast.error("Failed to load submission details")
    }
  }

  const handleUpdateStatus = async (submissionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("form_submissions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", submissionId)

      if (error) throw error

      // Update status in form_status table
      await supabase.from("form_status").insert({
        submission_id: submissionId,
        status: newStatus,
        updated_by: "admin",
      })

      toast.success("Status updated successfully")
      loadSubmissions()
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    }
  }

  const handleUpdateSubmission = async () => {
    if (!selectedSubmission) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from("form_submissions")
        .update({
          form_data: selectedSubmission.form_data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedSubmission.id)

      if (error) throw error

      toast.success("Submission updated successfully")
      setIsEditing(false)
      loadSubmissions()
    } catch (error) {
      console.error("Error updating submission:", error)
      toast.error("Failed to update submission")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      // Delete related records first
      await supabase.from("form_images").delete().eq("submission_id", submissionId)
      await supabase.from("form_status").delete().eq("submission_id", submissionId)
      await supabase.from("compliance_chat").delete().eq("submission_id", submissionId)

      // Delete submission
      const { error } = await supabase.from("form_submissions").delete().eq("id", submissionId)

      if (error) throw error

      toast.success("Submission deleted successfully")
      setShowDetailsModal(false)
      loadSubmissions()
    } catch (error) {
      console.error("Error deleting submission:", error)
      toast.error("Failed to delete submission")
    }
  }

  const handleSendMessage = async () => {
    if (!selectedSubmission || !newMessage.trim()) return

    try {
      const { error } = await supabase.from("compliance_chat").insert({
        submission_id: selectedSubmission.id,
        sender_type: "admin",
        message: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage("")
      loadSubmissionDetails(selectedSubmission.id)
      toast.success("Message sent")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }

  const downloadFormAsText = (submission: FormSubmission) => {
    const formText =
      `=========================================== FORM SUBMISSION DETAILS =========================================== Form Type: ${submission.form_name} Agent: ${submission.agent_name} Status: ${submission.status} Submitted: ${new Date(submission.submitted_at).toLocaleString()} Updated: ${new Date(submission.updated_at).toLocaleString()} ------------------------------------------- FORM DATA ------------------------------------------- ${Object.entries(
        submission.form_data,
      )
        .map(([key, value]) => `${key.replace(/_/g, " ").toUpperCase()}: ${value}`)
        .join("\n")} ===========================================`.trim()

    const blob = new Blob([formText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${submission.form_name}_${submission.agent_name}_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Form downloaded as text")
  }

  const downloadAllImages = async (submissionId: string) => {
    try {
      console.log("[v0] Starting image download for submission:", submissionId)

      const { data: images, error } = await supabase.from("form_images").select("*").eq("submission_id", submissionId)

      if (error) {
        console.error("[v0] Error fetching images from database:", error)
        throw error
      }

      console.log("[v0] Found images:", images)

      if (!images || images.length === 0) {
        toast.error("No images found for this submission")
        return
      }

      let successCount = 0
      let failCount = 0

      for (const image of images) {
        try {
          console.log("[v0] Processing image:", image.image_type, "URL:", image.image_url)

          let imagePath = image.image_url

          // Handle different URL formats
          if (!imagePath) {
            console.error("[v0] Image URL is empty for:", image.image_type)
            failCount++
            continue
          }

          // If it's a full Supabase URL, extract the path
          if (imagePath.includes("supabase.co/storage/v1/object/public/")) {
            const parts = imagePath.split("supabase.co/storage/v1/object/public/")
            if (parts.length > 1) {
              imagePath = parts[1]
              console.log("[v0] Extracted path from full URL:", imagePath)
            }
          }

          // Remove bucket name if it's included
          if (imagePath.startsWith("compliance-images/")) {
            imagePath = imagePath.replace("compliance-images/", "")
            console.log("[v0] Removed bucket prefix:", imagePath)
          }

          // If path starts with /, remove it
          if (imagePath.startsWith("/")) {
            imagePath = imagePath.substring(1)
            console.log("[v0] Removed leading slash:", imagePath)
          }

          console.log("[v0] Final path for storage lookup:", imagePath)

          // Get the public URL from Supabase storage
          const { data: urlData } = supabase.storage.from("compliance-images").getPublicUrl(imagePath)

          console.log("[v0] Generated public URL:", urlData?.publicUrl)

          if (!urlData?.publicUrl) {
            console.error("[v0] Failed to generate public URL for:", imagePath)
            failCount++
            continue
          }

          // Fetch the image
          const response = await fetch(urlData.publicUrl)
          console.log("[v0] Fetch response status:", response.status, response.statusText)

          if (!response.ok) {
            console.error("[v0] Failed to fetch image. Status:", response.status, "URL:", urlData.publicUrl)

            // Try alternative: use the original URL directly if it's already a full URL
            if (image.image_url.startsWith("http")) {
              console.log("[v0] Trying original URL directly:", image.image_url)
              const altResponse = await fetch(image.image_url)
              if (altResponse.ok) {
                const blob = await altResponse.blob()
                downloadBlob(blob, `${image.image_type}_${new Date().toISOString().split("T")[0]}.jpg`)
                successCount++
                continue
              }
            }

            failCount++
            continue
          }

          const blob = await response.blob()
          downloadBlob(blob, `${image.image_type}_${new Date().toISOString().split("T")[0]}.jpg`)
          successCount++
        } catch (imgError) {
          console.error("[v0] Error downloading image:", image.image_type, imgError)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Downloaded ${successCount} image(s)${failCount > 0 ? ` (${failCount} failed)` : ""}`)
      } else {
        toast.error("Failed to download images. Check console for details.")
      }
    } catch (error) {
      console.error("[v0] Error in downloadAllImages:", error)
      toast.error("Failed to download images. Check console for details.")
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Pending: { color: "bg-yellow-500", icon: Clock },
      Processing: { color: "bg-blue-500", icon: Loader2 },
      Completed: { color: "bg-green-500", icon: CheckCircle },
      Delivered: { color: "bg-purple-500", icon: CheckCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const filteredSubmissions = submissions.filter(
    (sub) =>
      sub.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.form_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getFormTypeLabel = (formId: string) => {
    // Map form IDs to readable labels
    const formLabels: Record<string, string> = {
      "1": "Sole Proprietorship",
      "2": "Birth Certificate",
      "3": "TIN Registration",
      sole_proprietorship: "Sole Proprietorship",
      "sole-proprietorship": "Sole Proprietorship",
      birth_certificate: "Birth Certificate",
      "birth-certificate": "Birth Certificate",
      tin_registration: "TIN Registration",
      "tin-registration": "TIN Registration",
    }
    return formLabels[formId] || "Unknown Form"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-emerald-700">Loading compliance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-800">Compliance Management</h2>
          <p className="text-emerald-600">Manage form submissions and agent communications</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            <FileText className="h-4 w-4 mr-1" />
            {submissions.length} Total
          </Badge>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4 mr-1" />
            {submissions.filter((s) => s.status === "Pending").length} Pending
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
        <Input
          placeholder="Search by agent, form type, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-emerald-200 focus:border-emerald-500"
        />
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubmissions.map((submission) => (
          <Card key={submission.id} className="border-emerald-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-emerald-800">{submission.form_name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-emerald-600 mt-1">
                    <User className="h-3 w-3" />
                    <span>{submission.agent_name}</span>
                  </div>
                </div>
                {getStatusBadge(submission.status)}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Calendar className="h-4 w-4" />
                  <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                </div>

                <div className="text-emerald-600">
                  <strong>Form ID:</strong> {submission.form_id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedSubmission(submission)
                    loadSubmissionDetails(submission.id)
                    setShowDetailsModal(true)
                    setIsEditing(false)
                    setViewingAsAgent(true)
                  }}
                  className="text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedSubmission(submission)
                    loadSubmissionDetails(submission.id)
                    setShowChatModal(true)
                  }}
                  className="text-xs"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadFormAsText(submission)} className="text-xs">
                  <FileDown className="h-3 w-3 mr-1" />
                  Text
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadAllImages(submission.id)}
                  className="text-xs"
                >
                  <ImageIcon className="h-3 w-3 mr-1" />
                  Images
                </Button>
              </div>

              <div className="pt-2 border-t border-emerald-100 flex gap-2">
                <Select
                  value={submission.status}
                  onValueChange={(newStatus) => handleUpdateStatus(submission.id, newStatus)}
                >
                  <SelectTrigger className="w-full border-emerald-200 focus:border-emerald-500 text-sm h-9 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteSubmission(submission.id)}
                  className="h-9 px-3"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSubmission && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl font-bold text-emerald-800">
                {selectedSubmission.form_name} - {selectedSubmission.agent_name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                View and manage form submission details, images, and data
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Status and Metadata */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedSubmission.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewingAsAgent(!viewingAsAgent)}
                    className="text-xs"
                  >
                    {viewingAsAgent ? "View as Admin" : "View as Agent"}
                  </Button>
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                </div>
              </div>

              {/* Images Section */}
              {submissionImages.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base md:text-lg font-semibold text-emerald-800">Uploaded Images</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {submissionImages.map((image) => (
                      <div key={image.id} className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium capitalize">
                          {image.image_type.replace(/_/g, " ")}
                        </Label>
                        <div className="aspect-video w-full bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg overflow-hidden">
                          <img
                            src={image.image_url || "/placeholder.svg"}
                            alt={image.image_type}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Data Section */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-semibold text-emerald-800">Form Data</h3>
                {isEditing ? (
                  <div className="space-y-4">
                    {Object.entries(selectedSubmission.form_data).map(([key, value]) => (
                      <div key={key}>
                        <Label htmlFor={key} className="capitalize text-xs sm:text-sm">
                          {key.replace(/_/g, " ")}
                        </Label>
                        {typeof value === "string" && value.length > 100 ? (
                          <Textarea
                            id={key}
                            value={value as string}
                            onChange={(e) =>
                              setSelectedSubmission({
                                ...selectedSubmission,
                                form_data: { ...selectedSubmission.form_data, [key]: e.target.value },
                              })
                            }
                            className="border-emerald-200 focus:border-emerald-500 text-sm"
                            rows={3}
                          />
                        ) : (
                          <Input
                            id={key}
                            value={value as string}
                            onChange={(e) =>
                              setSelectedSubmission({
                                ...selectedSubmission,
                                form_data: { ...selectedSubmission.form_data, [key]: e.target.value },
                              })
                            }
                            className="border-emerald-200 focus:border-emerald-500 text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                    {Object.entries(selectedSubmission.form_data).map(([key, value]) => {
                      const displayValue = viewingAsAgent ? maskSensitiveField(String(value), key) : String(value)
                      const isSensitive = SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))

                      return (
                        <div key={key} className="break-words">
                          <strong className="capitalize">{key.replace(/_/g, " ")}:</strong>
                          <p
                            className={`mt-1 ${isSensitive && viewingAsAgent ? "text-red-600 font-mono" : "text-emerald-600"}`}
                          >
                            {displayValue}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadFormAsText(selectedSubmission)}
                    className="flex-1 text-sm"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download Text
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadAllImages(selectedSubmission.id)}
                    className="flex-1 text-sm"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Download Images
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setShowDetailsModal(false)
                    }}
                    className="flex-1 text-sm"
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSubmission(selectedSubmission)
                      setShowChatModal(true)
                      setShowDetailsModal(false)
                    }}
                    className="flex-1 text-sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1 text-sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1 text-sm">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateSubmission}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedSubmission && (
        <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
          <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl font-bold text-emerald-800">
                Chat - {selectedSubmission.form_name}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-emerald-600">
                Agent: {selectedSubmission.agent_name}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg min-h-[300px] sm:min-h-[400px] max-h-[500px]">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">No messages yet. Start the conversation!</div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 ${
                        msg.sender_type === "admin"
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-emerald-200 text-gray-800"
                      }`}
                    >
                      <div className="text-xs opacity-75 mb-1">
                        {msg.sender_type === "admin" ? "Admin" : "Agent"} •{" "}
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                      <p className="text-xs sm:text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-emerald-200">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 border-emerald-200 focus:border-emerald-500 text-sm"
              />
              <Button onClick={handleSendMessage} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

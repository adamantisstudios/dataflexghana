"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, Clock, CheckCircle, Truck, AlertCircle, FileText, Download, MessageSquare, Send } from "lucide-react"
import { supabase, type FormSubmission } from "@/lib/supabase"
import { format } from "date-fns"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

interface ChatMessage {
  id: string
  submission_id: string
  sender_type: "agent" | "admin"
  message: string
  created_at: string
}

interface SubmissionsListProps {
  agentId: string
  onUpdate: () => void
  tableName?: string // Added optional tableName parameter to support different submission tables
  submissions?: FormSubmission[] // Add optional submissions prop to accept data from parent
}

export function SubmissionsList({
  agentId,
  onUpdate,
  tableName = "form_submissions",
  submissions: initialSubmissions,
}: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>(initialSubmissions || [])
  const [loading, setLoading] = useState(!initialSubmissions) // Only load if no initial submissions provided
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showChatDialog, setShowChatDialog] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
    if (initialSubmissions) {
      setSubmissions(initialSubmissions)
      setLoading(false)
    }
  }, [initialSubmissions])

  useEffect(() => {
    if (!agentId || agentId === "" || agentId === "undefined" || agentId === "null") {
      setLoading(false)
      return
    }

    if (!initialSubmissions) {
      loadSubmissions()
    }
  }, [agentId, tableName, initialSubmissions])

  const loadSubmissions = async () => {
    if (!agentId || agentId === "" || agentId === "undefined" || agentId === "null") {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("agent_id", agentId)
        .order("submitted_at", { ascending: false })

      if (error) {
        throw error
      }

      setSubmissions(data || [])
    } catch (error) {
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />
      case "processing":
        return <AlertCircle className="h-5 w-5 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "delivered":
        return <Truck className="h-5 w-5 text-purple-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "delivered":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleViewSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission)
    setShowViewDialog(true)
  }

  const downloadAllImages = async () => {
    if (!selectedSubmission?.form_data?.images) {
      toast.error("No images to download")
      return
    }

    try {
      const images = selectedSubmission.form_data.images
      for (const imageUrl of images) {
        const link = document.createElement("a")
        link.href = imageUrl
        link.download = `image-${Date.now()}.jpg`
        link.click()
      }
      toast.success("Images downloaded successfully")
    } catch (error) {
      console.error("Error downloading images:", error)
      toast.error("Failed to download images")
    }
  }

  const getFormTypeLabel = (formId: string): string => {
    const formLabels: Record<string, string> = {
      "birth-certificate": "Birth Certificate",
      "sole-proprietorship": "Sole Proprietorship",
      "tin-registration": "TIN Registration",
      "1": "Sole Proprietorship",
      "2": "Birth Certificate",
      "3": "TIN Registration",
    }
    return formLabels[formId] || "Unknown Form"
  }

  const formatFormData = (formData: any) => {
    if (!formData) return []

    const entries: Array<{ label: string; value: string }> = []

    const sensitiveFields = [
      "ghanaCardNumber",
      "ghana_card_number",
      "tinNumber",
      "tin_number",
      "passportNumber",
      "passport_number",
      "driverLicenseNumber",
      "driver_license_number",
      "socialSecurityNumber",
      "ssn",
      "bankAccountNumber",
      "bank_account_number",
      "creditCardNumber",
      "credit_card_number",
    ]

    // Common fields mapping
    const fieldLabels: Record<string, string> = {
      full_name: "Full Name",
      firstName: "First Name",
      lastName: "Last Name",
      middleName: "Middle Name",
      businessName: "Business Name",
      business_name: "Business Name",
      email: "Email Address",
      phone: "Phone Number",
      phoneNumber: "Phone Number",
      address: "Address",
      city: "City",
      region: "Region",
      ghanaCardNumber: "Ghana Card Number",
      ghana_card_number: "Ghana Card Number",
      dateOfBirth: "Date of Birth",
      date_of_birth: "Date of Birth",
      placeOfBirth: "Place of Birth",
      place_of_birth: "Place of Birth",
      nationality: "Nationality",
      gender: "Gender",
      businessType: "Business Type",
      business_type: "Business Type",
      businessAddress: "Business Address",
      business_address: "Business Address",
      registrationNumber: "Registration Number",
      registration_number: "Registration Number",
      tinNumber: "TIN Number",
      tin_number: "TIN Number",
      formType: "Form Type",
      form_type: "Form Type",
    }

    // Process each field
    Object.entries(formData).forEach(([key, value]) => {
      // Skip images and internal fields
      if (key === "images" || key === "signature" || !value) return

      const label =
        fieldLabels[key] ||
        key
          .replace(/_/g, " ")
          .replace(/([A-Z])/g, " $1")
          .trim()

      let displayValue: string
      if (sensitiveFields.includes(key) && typeof value === "string") {
        // Show only last 4 characters, mask the rest with asterisks
        const valueStr = String(value)
        if (valueStr.length > 4) {
          displayValue = "*".repeat(valueStr.length - 4) + valueStr.slice(-4)
        } else {
          displayValue = "*".repeat(valueStr.length)
        }
      } else {
        displayValue = typeof value === "object" ? JSON.stringify(value) : String(value)
      }

      entries.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value: displayValue,
      })
    })

    return entries
  }

  const loadChatMessages = async (submissionId: string) => {
    try {
      const { data, error } = await supabase
        .from("compliance_chat")
        .select("*")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setChatMessages(data || [])
    } catch (error) {
      console.error("[v0] Error loading chat messages:", error)
      toast.error("Failed to load chat messages")
    }
  }

  const handleSendMessage = async () => {
    if (!selectedSubmission || !newMessage.trim()) return

    try {
      const { error } = await supabase.from("compliance_chat").insert({
        submission_id: selectedSubmission.id,
        sender_type: "agent",
        message: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage("")
      loadChatMessages(selectedSubmission.id)
      toast.success("Message sent")
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      toast.error("Failed to send message")
    }
  }

  const handleOpenChat = (submission: FormSubmission) => {
    setSelectedSubmission(submission)
    loadChatMessages(submission.id)
    setShowChatDialog(true)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Submissions</h2>
          <p className="text-sm text-gray-600 mt-1">Track the status of your compliance form submissions</p>
        </div>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!agentId || agentId === "" || agentId === "undefined" || agentId === "null") {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Submissions</h2>
          <p className="text-sm text-gray-600 mt-1">Track the status of your compliance form submissions</p>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-500 mb-2">Unable to load submissions</p>
          <p className="text-sm text-gray-400">Please log in again to continue</p>
        </div>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Submissions</h2>
          <p className="text-sm text-gray-600 mt-1">Track the status of your compliance form submissions</p>
        </div>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No submissions yet</p>
          <p className="text-sm text-gray-400">Click "New Submission" to get started</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Submissions</h2>
          <p className="text-sm text-gray-600 mt-1">Track the status of your compliance form submissions</p>
        </div>
        <div className="space-y-3">
          {submissions.map((submission) => {
            const formData = submission.form_data as any
            const formType = getFormTypeLabel(submission.form_id)
            let displayName = "Unknown"

            if (formType === "Sole Proprietorship") {
              displayName = formData?.businessName || formData?.business_name || formData?.firstName || "Unknown"
            } else {
              displayName = formData?.firstName || formData?.full_name?.split(" ")[0] || "Unknown"
            }

            const formName = `${formType} - ${displayName}`

            return (
              <div
                key={submission.id}
                className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border-l-4 border-blue-500 hover:bg-white/80 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1">{getStatusIcon(submission.status)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 break-words">{formName}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(submission.submitted_at), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(submission.status)} border text-xs shrink-0`}>
                      {submission.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmission(submission)}
                      className="text-xs sm:text-sm w-full"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="truncate">View Details</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenChat(submission)}
                      className="text-xs sm:text-sm w-full"
                    >
                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="truncate">Chat</span>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Submission Details</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View the details of your compliance form submission
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-3 sm:space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm sm:text-base">Status:</span>
                <Badge className={`${getStatusColor(selectedSubmission.status)} text-xs`}>
                  {selectedSubmission.status}
                </Badge>
              </div>

              <div>
                <span className="font-semibold text-sm sm:text-base">Submitted:</span>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {format(new Date(selectedSubmission.submitted_at), "MMMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>

              <div>
                <span className="font-semibold text-base sm:text-lg">Form Information</span>
                <div className="mt-3 space-y-2 sm:space-y-3">
                  {formatFormData(selectedSubmission.form_data).map((field, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-700">{field.label}</p>
                      <p className="text-xs sm:text-sm text-gray-900 mt-1 break-words">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSubmission.form_data?.images && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAllImages}
                    className="w-full bg-transparent text-xs sm:text-sm"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Download All Images
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedSubmission && (
        <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
          <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-blue-800">
                Chat - {getFormTypeLabel(selectedSubmission.form_id)}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-blue-600">
                Communicate with admin about your submission
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg min-h-[300px] sm:min-h-[400px] max-h-[500px]">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-xs sm:text-sm">
                  No messages yet. Start the conversation with admin!
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === "agent" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 ${
                        msg.sender_type === "agent"
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-blue-200 text-gray-800"
                      }`}
                    >
                      <div className="text-xs opacity-75 mb-1">
                        {msg.sender_type === "agent" ? "You" : "Admin"} •{" "}
                        {format(new Date(msg.created_at), "MMM dd, h:mm a")}
                      </div>
                      <p className="text-xs sm:text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-blue-200">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 border-blue-200 focus:border-blue-500 text-xs sm:text-sm"
              />
              <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

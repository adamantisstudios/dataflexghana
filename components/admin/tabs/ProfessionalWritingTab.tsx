"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Eye, Trash2, Share2, Download, Mail, Copy, CheckCircle, Clock, Loader, Package } from "lucide-react"

interface ProfessionalWritingSubmission {
  id: string
  agent_id: string
  agent_name: string
  agent_contact: string
  service_type: string
  status: string
  form_data: any
  document_url: string | null
  image_url: string | null
  submitted_at: string
  completed_document_url: string | null
  admin_notes: string | null
}

export default function ProfessionalWritingTab() {
  const [submissions, setSubmissions] = useState<ProfessionalWritingSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<ProfessionalWritingSubmission | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showWorkDialog, setShowWorkDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [workData, setWorkData] = useState({
    status: "processing",
    completedDocument: null as File | null,
    adminNotes: "",
  })

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("professional_writing_submissions")
        .select(
          `
          *,
          agents!professional_writing_submissions_agent_id_fkey (
            full_name,
            phone_number
          )
        `,
        )
        .order("submitted_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading submissions:", error)
        throw error
      }

      const transformedData = (data || []).map((sub: any) => ({
        ...sub,
        agent_name: sub.agents?.full_name || "Unknown Agent",
        agent_contact: sub.agents?.phone_number || "N/A",
      }))

      setSubmissions(transformedData)
    } catch (error) {
      console.error("[v0] Error loading submissions:", error)
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(
    () => ({
      total: submissions.length,
      pending: submissions.filter((s) => s.status === "pending").length,
      processing: submissions.filter((s) => s.status === "processing").length,
      delivered: submissions.filter((s) => s.status === "delivered").length,
    }),
    [submissions],
  )

  const filteredSubmissions = useMemo(
    () =>
      filterStatus === "all"
        ? submissions
        : submissions.filter((s) => s.status.toLowerCase() === filterStatus.toLowerCase()),
    [submissions, filterStatus],
  )

  const handleViewDetails = (submission: ProfessionalWritingSubmission) => {
    setSelectedSubmission(submission)
    setShowDetailsDialog(true)
  }

  const handleWorkOnSubmission = (submission: ProfessionalWritingSubmission) => {
    setSelectedSubmission(submission)
    setWorkData({
      status: submission.status,
      completedDocument: null,
      adminNotes: submission.admin_notes || "",
    })
    setShowWorkDialog(true)
  }

  const handleUpdateStatus = async (submissionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("professional_writing_submissions")
        .update({ status: newStatus })
        .eq("id", submissionId)

      if (error) throw error
      toast.success("Status updated")
      loadSubmissions()
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast.error("Failed to update status")
    }
  }

  const handleSaveWork = async () => {
    if (!selectedSubmission) return

    try {
      let completedDocumentUrl = selectedSubmission.completed_document_url

      if (workData.completedDocument) {
        const fileName = `completed-${selectedSubmission.id}-${Date.now()}.pdf`
        const { error: uploadError } = await supabase.storage
          .from("professional-writing-documents")
          .upload(fileName, workData.completedDocument)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("professional-writing-documents").getPublicUrl(fileName)
        completedDocumentUrl = urlData.publicUrl
      }

      const { error } = await supabase
        .from("professional_writing_submissions")
        .update({
          status: workData.status,
          completed_document_url: completedDocumentUrl,
          admin_notes: workData.adminNotes,
        })
        .eq("id", selectedSubmission.id)

      if (error) throw error

      toast.success("Work saved successfully")
      setShowWorkDialog(false)
      loadSubmissions()
    } catch (error) {
      console.error("[v0] Error saving work:", error)
      toast.error("Failed to save work")
    }
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm("Are you sure you want to permanently delete this submission?")) return

    try {
      const { error } = await supabase.from("professional_writing_submissions").delete().eq("id", submissionId)

      if (error) throw error

      toast.success("Submission deleted")
      loadSubmissions()
    } catch (error) {
      console.error("[v0] Error deleting submission:", error)
      toast.error("Failed to delete submission")
    }
  }

  const handleCopyText = (submission: ProfessionalWritingSubmission) => {
    const formattedText = `
PROFESSIONAL WRITING SUBMISSION
================================
Agent: ${submission.agent_name}
Contact: ${submission.agent_contact}
Service: ${submission.service_type.replace("-", " ")}
Status: ${submission.status}
Submitted: ${new Date(submission.submitted_at).toLocaleString()}

FORM DATA:
${Object.entries(submission.form_data || {})
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

${submission.admin_notes ? `ADMIN NOTES:\n${submission.admin_notes}` : ""}
    `.trim()

    navigator.clipboard.writeText(formattedText)
    toast.success("Text copied to clipboard!")
  }

  const handleShareViaWhatsApp = (submission: ProfessionalWritingSubmission) => {
    if (!submission.completed_document_url) {
      toast.error("No completed document to share")
      return
    }

    const message = `Hi ${submission.agent_name}, your ${submission.service_type.replace("-", " ")} is ready! Download: ${submission.completed_document_url}`
    const whatsappUrl = `https://wa.me/${submission.agent_contact}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleShareViaEmail = (submission: ProfessionalWritingSubmission) => {
    if (!submission.completed_document_url) {
      toast.error("No completed document to share")
      return
    }

    const subject = `Your ${submission.service_type.replace("-", " ")} is Ready`
    const body = `Hi ${submission.agent_name},\n\nYour ${submission.service_type.replace("-", " ")} has been completed and is ready for download.\n\nDownload: ${submission.completed_document_url}\n\nBest regards,\nDataFlex Team`
    const mailtoUrl = `mailto:${submission.agent_contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoUrl
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Professional Writing Services
          </h2>
          <p className="text-sm text-gray-600 mt-1">Manage agent writing service requests</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Submissions</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
        {/* Total */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-blue-500 text-white p-3 rounded-lg opacity-20">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Pending</p>
                <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
              </div>
              <div className="bg-yellow-500 text-white p-3 rounded-lg opacity-20">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Processing</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{stats.processing}</p>
              </div>
              <div className="bg-purple-500 text-white p-3 rounded-lg opacity-20">
                <Loader className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivered */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Delivered</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{stats.delivered}</p>
              </div>
              <div className="bg-green-500 text-white p-3 rounded-lg opacity-20">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle className="text-lg text-gray-900">Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm">No submissions found</p>
            </div>
          ) : (
            <div className="max-h-[700px] overflow-y-auto">
              {filteredSubmissions.map((submission, index) => (
                <div
                  key={submission.id}
                  className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition-all ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row - Agent Info and Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{submission.agent_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {submission.service_type.replace("-", " ")}
                          </Badge>
                          <Badge
                            className="text-xs capitalize"
                            style={{
                              backgroundColor:
                                submission.status === "pending"
                                  ? "#fef3c7"
                                  : submission.status === "processing"
                                    ? "#e9d5ff"
                                    : submission.status === "completed"
                                      ? "#dcfce7"
                                      : "#d1fae5",
                              color:
                                submission.status === "pending"
                                  ? "#b45309"
                                  : submission.status === "processing"
                                    ? "#7e22ce"
                                    : submission.status === "completed"
                                      ? "#166534"
                                      : "#047857",
                            }}
                          >
                            {submission.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <Select
                        value={submission.status}
                        onValueChange={(value) => handleUpdateStatus(submission.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Contact and Date */}
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Contact:</span> {submission.agent_contact}
                      </p>
                      <p>
                        <span className="font-medium">Submitted:</span>{" "}
                        {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>

                    {/* Action Buttons - Mobile Responsive Grid */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(submission)}
                        className="text-xs h-8 flex-1 sm:flex-none"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyText(submission)}
                        className="text-xs h-8 flex-1 sm:flex-none"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Text
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWorkOnSubmission(submission)}
                        className="text-xs h-8 flex-1 sm:flex-none"
                      >
                        Work On
                      </Button>

                      {submission.completed_document_url && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(submission.completed_document_url, "_blank")}
                            className="text-xs h-8 flex-1 sm:flex-none"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShareViaWhatsApp(submission)}
                            className="text-xs h-8 flex-1 sm:flex-none"
                          >
                            <Share2 className="h-3 w-3 mr-1" />
                            WhatsApp
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShareViaEmail(submission)}
                            className="text-xs h-8 flex-1 sm:flex-none"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSubmission(submission.id)}
                        className="text-xs h-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-600">Agent Name</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedSubmission.agent_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Contact</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedSubmission.agent_contact}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Service Type</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedSubmission.service_type.replace("-", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Status</p>
                  <Badge className="mt-1">{selectedSubmission.status}</Badge>
                </div>
              </div>

              {selectedSubmission.form_data && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs font-bold text-blue-900 mb-3 uppercase">Form Data</p>
                  <div className="text-sm text-gray-700 space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(selectedSubmission.form_data).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between gap-2 pb-2 border-b border-blue-200 last:border-b-0"
                      >
                        <span className="font-medium text-blue-900 capitalize">{key.replace(/_/g, " ")}:</span>
                        <span className="text-gray-700 text-right flex-1">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.document_url && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-xs font-bold text-green-900 mb-2 uppercase">Uploaded Document</p>
                  <a
                    href={selectedSubmission.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 font-medium text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download Document
                  </a>
                </div>
              )}

              {selectedSubmission.image_url && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Profile Image</p>
                  <img
                    src={selectedSubmission.image_url || "/placeholder.svg"}
                    alt="Profile"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              {selectedSubmission.admin_notes && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <p className="text-xs font-bold text-purple-900 mb-2 uppercase">Admin Notes</p>
                  <p className="text-sm text-gray-700">{selectedSubmission.admin_notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleCopyText(selectedSubmission)} variant="outline" className="flex-1 text-sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Text
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Work Dialog */}
      <Dialog open={showWorkDialog} onOpenChange={setShowWorkDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Work on Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
                <p className="text-sm font-bold text-gray-900">
                  {selectedSubmission.agent_name} - {selectedSubmission.service_type.replace("-", " ")}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2 uppercase">Status</label>
                <Select value={workData.status} onValueChange={(value) => setWorkData({ ...workData, status: value })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2 uppercase">
                  Upload Completed Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setWorkData({ ...workData, completedDocument: e.target.files?.[0] || null })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2"
                />
                {workData.completedDocument && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    File selected: {workData.completedDocument.name}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2 uppercase">Admin Notes</label>
                <Textarea
                  value={workData.adminNotes}
                  onChange={(e) => setWorkData({ ...workData, adminNotes: e.target.value })}
                  placeholder="Add notes about your work..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowWorkDialog(false)} className="text-sm h-9">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveWork}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white text-sm h-9"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Work
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

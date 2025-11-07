"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, X, Phone, Calendar, User, LinkIcon, Loader2, Clock } from "lucide-react"
import { toast } from "sonner"
import { getCurrentAdmin } from "@/lib/auth"

interface Invitation {
  id: string
  referral_code: string
  referred_agent_id: string
  referred_phone: string
  referred_name: string
  admin_approval_status: "pending" | "approved" | "rejected"
  admin_rejection_reason?: string
  referred_user_registered: boolean
  referred_user_registered_at?: string
  admin_approved_at?: string
  created_at: string
  updated_at: string
  referral_links: {
    id: string
    code: string
    agent_id: string
    agents: {
      id: string
      agent_name: string
      full_name: string
      email: string
    }
  }
}

interface InvitationManagementTabProps {
  getCachedData: () => Invitation[] | undefined
  setCachedData: (data: Invitation[]) => void
}

export default function InvitationManagementTab({ getCachedData, setCachedData }: InvitationManagementTabProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [filteredInvitations, setFilteredInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [approveNotes, setApproveNotes] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const admin = getCurrentAdmin()

  const loadInvitations = async (page = 1) => {
    try {
      setLoading(true)
      const cachedData = getCachedData()

      if (cachedData && page === 1) {
        setInvitations(cachedData)
      } else {
        const response = await fetch(
          `/api/admin/invitations?status=${statusFilter}&page=${page}&search=${encodeURIComponent(searchTerm)}`,
        )
        const result = await response.json()

        if (result.success) {
          setInvitations(result.data)
          setCachedData(result.data)
          setTotalPages(result.totalPages)
        }
      }
    } catch (error) {
      console.error("Error loading invitations:", error)
      toast.error("Failed to load invitations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    loadInvitations(1)
  }, [statusFilter, searchTerm])

  useEffect(() => {
    loadInvitations(currentPage)
  }, [currentPage])

  const handleApprove = async () => {
    if (!selectedInvitation || !admin) return

    try {
      setProcessingId(selectedInvitation.id)
      const response = await fetch(`/api/admin/invitations/${selectedInvitation.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: admin.id,
          notes: approveNotes,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Invitation approved successfully")
        setApproveDialogOpen(false)
        setApproveNotes("")
        loadInvitations(currentPage)
      } else {
        toast.error(result.error || "Failed to approve invitation")
      }
    } catch (error) {
      console.error("Error approving invitation:", error)
      toast.error("Failed to approve invitation")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!selectedInvitation || !admin || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    try {
      setProcessingId(selectedInvitation.id)
      const response = await fetch(`/api/admin/invitations/${selectedInvitation.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: admin.id,
          reason: rejectReason,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Invitation rejected successfully")
        setRejectDialogOpen(false)
        setRejectReason("")
        loadInvitations(currentPage)
      } else {
        toast.error(result.error || "Failed to reject invitation")
      }
    } catch (error) {
      console.error("Error rejecting invitation:", error)
      toast.error("Failed to reject invitation")
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {invitations.filter((i) => i.admin_approval_status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {invitations.filter((i) => i.admin_approval_status === "approved").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <X className="h-4 w-4" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {invitations.filter((i) => i.admin_approval_status === "rejected").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <User className="h-4 w-4" />
              Registered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {invitations.filter((i) => i.referred_user_registered).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-blue-200 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-blue-800">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <Input
                placeholder="Search by name, phone, or referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Loading invitations...</p>
          </Card>
        ) : invitations.length === 0 ? (
          <Card className="p-8 text-center bg-blue-50 border-blue-200">
            <p className="text-gray-600">No invitations found</p>
          </Card>
        ) : (
          invitations.map((invitation) => (
            <Card key={invitation.id} className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg text-blue-900">{invitation.referred_name}</h3>
                      <Badge className={getStatusBadgeColor(invitation.admin_approval_status)}>
                        {invitation.admin_approval_status.replace("_", " ")}
                      </Badge>
                      {invitation.referred_user_registered && (
                        <Badge className="bg-emerald-100 text-emerald-800">Registered</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-4 w-4 text-blue-600" />
                        {invitation.referred_phone}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <LinkIcon className="h-4 w-4 text-blue-600" />
                        Code: {invitation.referral_code}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="h-4 w-4 text-blue-600" />
                        Agent: {invitation.referral_links?.agents?.agent_name || "Unknown"}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {formatDate(invitation.created_at)}
                      </div>
                    </div>

                    {invitation.admin_rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{invitation.admin_rejection_reason}</p>
                      </div>
                    )}

                    {invitation.referred_user_registered_at && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          Registered: {formatDate(invitation.referred_user_registered_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  {invitation.admin_approval_status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          setSelectedInvitation(invitation)
                          setApproveDialogOpen(true)
                        }}
                        disabled={processingId === invitation.id}
                      >
                        {processingId === invitation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedInvitation(invitation)
                          setRejectDialogOpen(true)
                        }}
                        disabled={processingId === invitation.id}
                      >
                        {processingId === invitation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Invitation</DialogTitle>
            <DialogDescription>
              Approving this invitation will allow {selectedInvitation?.referred_name} to complete registration using
              the referral code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Admin Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about this approval..."
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                className="min-h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={processingId !== null}
            >
              {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Invitation</DialogTitle>
            <DialogDescription>
              Rejecting this invitation will prevent {selectedInvitation?.referred_name} from using this referral code
              to register.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rejection Reason (Required)</label>
              <Textarea
                placeholder="Explain why this invitation is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId !== null || !rejectReason.trim()}
            >
              {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

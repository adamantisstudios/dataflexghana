"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Phone, Calendar, User, DollarSign, Loader2, Clock, AlertTriangle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getCurrentAdmin } from "@/lib/auth"

interface Invitation {
  id: string
  credit_amount: number
  status: "pending" | "confirmed" | "credited" | "paid_out"
  created_at: string
  referring_agent_id: string
  referred_agent_id: string
  referring_agent_name: string
  referred_agent_name: string
  referred_phone: string
  referring_phone: string
}

interface InvitationManagementTabProps {
  getCachedData: () => Invitation[] | undefined
  setCachedData: (data: Invitation[]) => void
}

export default function InvitationManagementTab({ getCachedData, setCachedData }: InvitationManagementTabProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<"confirmed" | "credited" | "paid_out">("confirmed")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [clearDataType, setClearDataType] = useState<"day" | "month">("day")

  const admin = getCurrentAdmin()

  const loadInvitations = async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/invitations?status=${statusFilter}&page=${page}&search=${encodeURIComponent(searchTerm)}`,
      )
      const result = await response.json()

      if (result.success) {
        setInvitations(result.data)
        setCachedData(result.data)
        setTotalPages(result.totalPages)
      } else {
        toast.error(result.error || "Failed to load invitations")
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

  const handleUpdateStatus = async () => {
    if (!selectedInvitation || !admin) return

    try {
      setProcessingId(selectedInvitation.id)
      const response = await fetch(`/api/admin/invitations/${selectedInvitation.id}/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: admin.id,
          status: newStatus,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Payment status updated to ${newStatus}`)
        setUpdateDialogOpen(false)

        // Instead of trying to keep it visible, just reload all data to ensure consistency
        setInvitations((prev) => prev.filter((inv) => inv.id !== selectedInvitation.id))

        // Reload the current page to show fresh data
        setTimeout(() => {
          loadInvitations(currentPage)
        }, 300)
      } else {
        toast.error(result.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    } finally {
      setProcessingId(null)
    }
  }

  const clearOldInvitations = async () => {
    if (
      !confirm(
        `Are you sure you want to clear invitation records from ${clearDataType === "day" ? "today" : "this month"}? This action cannot be undone.`,
      )
    ) {
      return
    }
    try {
      setProcessingId("clearing")
      const now = new Date()
      let cutoffDate: Date
      if (clearDataType === "day") {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const response = await fetch("/api/admin/clear-old-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: admin?.id,
          cutoff_date: cutoffDate.toISOString(),
          record_type: "invitations",
          time_range: clearDataType,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Cleared ${result.count} invitation records`)
        setShowClearDialog(false)
        loadInvitations(1)
      } else {
        toast.error(result.error || "Failed to clear records")
      }
    } catch (error) {
      console.error("Error clearing records:", error)
      toast.error("Failed to clear records")
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "credited":
        return "bg-green-100 text-green-800"
      case "paid_out":
        return "bg-emerald-100 text-emerald-800"
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

  const stats = {
    pending: invitations.filter((i) => i.status === "pending").length,
    confirmed: invitations.filter((i) => i.status === "confirmed").length,
    credited: invitations.filter((i) => i.status === "credited").length,
    paid_out: invitations.filter((i) => i.status === "paid_out").length,
    total_amount: invitations.reduce((sum, i) => sum + i.credit_amount, 0),
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 md:gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-yellow-800 flex items-center gap-2">
              <Clock className="h-3 w-3 md:h-4 md:w-4" />
              <span>Pending</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-yellow-900">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-blue-800 flex items-center gap-2">
              <Check className="h-3 w-3 md:h-4 md:w-4" />
              <span>Confirmed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-900">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-green-800 flex items-center gap-2">
              <Check className="h-3 w-3 md:h-4 md:w-4" />
              <span>Credited</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-900">{stats.credited}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-emerald-800 flex items-center gap-2">
              <Check className="h-3 w-3 md:h-4 md:w-4" />
              <span>Paid Out</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-emerald-900">{stats.paid_out}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-purple-800 flex items-center gap-2">
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-blue-600" />
              <span>Total</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-purple-900">${stats.total_amount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-200 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base text-blue-800">Filters & Search</CardTitle>
            <Button
              onClick={() => setShowClearDialog(true)}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Old Records
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-700 mb-1.5 block">Payment Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="credited">Credited</SelectItem>
                  <SelectItem value="paid_out">Paid Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs md:text-sm font-medium text-gray-700 mb-1.5 block">Search</label>
              <Input
                placeholder="Search by agent name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-6 md:p-8 text-center">
            <Loader2 className="h-6 md:h-8 w-6 md:w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm md:text-base text-gray-600">Loading payment records...</p>
          </Card>
        ) : invitations.length === 0 ? (
          <Card className="p-6 md:p-8 text-center bg-blue-50 border-blue-200">
            <p className="text-sm md:text-base text-gray-600">
              {statusFilter !== "pending" ? "No records found with this status" : "No payment records found"}
            </p>
          </Card>
        ) : (
          invitations.map((invitation) => (
            <Card key={invitation.id} className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <h3 className="font-semibold text-sm md:text-base text-blue-900 truncate">
                        {invitation.referring_agent_name}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={`${getStatusBadgeColor(invitation.status)} text-xs`}>
                          {invitation.status.replace("_", " ")}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          ${invitation.credit_amount.toFixed(2)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                      <div className="flex items-center gap-2 text-gray-700 truncate">
                        <Phone className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-blue-600" />
                        <span className="truncate">{invitation.referring_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 truncate">
                        <User className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-blue-600" />
                        <span className="truncate">Referred: {invitation.referred_agent_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 truncate">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-blue-600" />
                        <span className="truncate text-xs">{formatDate(invitation.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {invitation.status !== "paid_out" && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 text-xs md:text-sm"
                      onClick={() => {
                        setSelectedInvitation(invitation)
                        setUpdateDialogOpen(true)
                      }}
                      disabled={processingId === invitation.id}
                    >
                      {processingId === invitation.id ? (
                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      ) : (
                        "Update Status"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="text-xs md:text-sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
        </div>
      )}

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Update Payment Status</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Update the payment status for {selectedInvitation?.referring_agent_name}'s referral credit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-700 mb-1.5 block">New Status</label>
              <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="credited">Credited</SelectItem>
                  <SelectItem value="paid_out">Paid Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs md:text-sm font-medium text-blue-900 mb-1">Amount:</p>
              <p className="text-sm md:text-base font-bold text-blue-900">
                ${selectedInvitation?.credit_amount.toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)} className="text-xs md:text-sm">
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-xs md:text-sm"
              onClick={handleUpdateStatus}
              disabled={processingId !== null}
            >
              {processingId ? <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin mr-2" /> : null}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="w-[95vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Clear Invitation Records
            </DialogTitle>
            <DialogDescription>Remove old invitation records to keep your system clean</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-700 mb-1.5 block">Time Range</label>
              <Select value={clearDataType} onValueChange={(value: any) => setClearDataType(value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs md:text-sm font-medium text-red-900 mb-1">Warning:</p>
              <p className="text-xs text-red-700">
                This will permanently delete invitation records older than the selected date. This action cannot be
                undone.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowClearDialog(false)} className="text-xs md:text-sm">
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-xs md:text-sm"
              onClick={clearOldInvitations}
              disabled={processingId !== null}
            >
              {processingId ? <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin mr-2" /> : null}
              Clear Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

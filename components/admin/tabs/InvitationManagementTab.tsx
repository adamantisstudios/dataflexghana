"use client"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Phone, Calendar, User, Loader2, RefreshCw, Download, Clock, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getCurrentAdmin } from "@/lib/auth"

interface Invitation {
  id: string
  referring_agent_id: string
  referred_agent_id: string
  referring_agent_name: string
  referring_agent_phone: string
  referred_agent_name: string
  referred_agent_phone: string
  status: "pending" | "confirmed" | "credited" | "paid_out"
  credit_amount: number
  created_at: string
  credited_at?: string
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
  const [processingId, setProcessingId] = useState<string | null>(null)
  const lastLoadRef = useRef<number>(0)
  const admin = getCurrentAdmin()

  const getAvailableStatusTransitions = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
      pending: ["confirmed"],
      confirmed: ["credited"],
      credited: ["paid_out"],
      paid_out: [],
    }
    return transitions[currentStatus] || []
  }

  const loadInvitations = async (page = 1, forceRefresh = false) => {
    try {
      const now = Date.now()
      if (!forceRefresh && now - lastLoadRef.current < 500) {
        return
      }
      lastLoadRef.current = now
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
        console.error("[v0] Failed to load invitations:", result.error)
        toast.error(result.error || "Failed to load invitations")
      }
    } catch (error) {
      console.error("[v0] Error loading invitations:", error)
      toast.error("Failed to load invitations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    loadInvitations(1, true)
  }, [statusFilter, searchTerm])

  useEffect(() => {
    loadInvitations(currentPage, true)
  }, [currentPage])

  const handleUpdateStatus = async (invitationId: string, newStatus: string) => {
    if (!admin) return
    try {
      setProcessingId(invitationId)
      const response = await fetch(`/api/admin/invitations/${invitationId}/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: admin.id, status: newStatus }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success(`✓ Status updated to ${newStatus}`)
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === invitationId
              ? {
                  ...inv,
                  status: newStatus as "pending" | "confirmed" | "credited" | "paid_out",
                  credited_at: newStatus === "credited" ? new Date().toISOString() : inv.credited_at,
                }
              : inv,
          ),
        )
        setTimeout(() => loadInvitations(currentPage, true), 800)
      } else {
        console.error("[v0] Failed to update status:", result.error)
        toast.error(result.error || "Failed to update status")
      }
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast.error("Failed to update status")
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to delete this invitation record?")) return
    try {
      setProcessingId(invitationId)
      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })
      const result = await response.json()
      if (result.success) {
        toast.success("Invitation deleted successfully")
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
      } else {
        toast.error(result.error || "Failed to delete invitation")
      }
    } catch (error) {
      console.error("[v0] Error deleting invitation:", error)
      toast.error("Failed to delete invitation")
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "credited":
        return "bg-blue-100 text-blue-800"
      case "paid_out":
        return "bg-purple-100 text-purple-800"
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

  const downloadInvitationsCSV = (records: Invitation[]) => {
    const headers = ["ID", "Agent", "Phone", "Referred Person", "Referred Phone", "Status", "Amount", "Date"]
    const rows = records.map((inv) => [
      inv.id,
      inv.referring_agent_name,
      inv.referring_agent_phone || "-",
      inv.referred_agent_name,
      inv.referred_agent_phone || "-",
      inv.status,
      `₵${inv.credit_amount}`,
      formatDate(inv.created_at),
    ])
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invitations-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const stats = {
    pending: invitations.filter((i) => i.status === "pending").length,
    confirmed: invitations.filter((i) => i.status === "confirmed").length,
    credited: invitations.filter((i) => i.status === "credited").length,
    paid_out: invitations.filter((i) => i.status === "paid_out").length,
    total: invitations.length,
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
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-green-800 flex items-center gap-2">
              <Check className="h-3 w-3 md:h-4 md:w-4" />
              <span>Confirmed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-900">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-blue-800 flex items-center gap-2">
              <Clock className="h-3 w-3 md:h-4 md:w-4" />
              <span>Credited</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-900">{stats.credited}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-purple-800 flex items-center gap-2">
              <Check className="h-3 w-3 md:h-4 md:w-4" />
              <span>Paid Out</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-purple-900">{stats.paid_out}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-purple-800 flex items-center gap-2">
              <Check className="h-3 w-3 md:h-4 md:w-4" />
              <span>Total</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-purple-900">{stats.total}</div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-blue-200 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base text-blue-800">Filters & Search</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => loadInvitations(currentPage, true)}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => downloadInvitationsCSV(invitations)}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-700 mb-1.5 block">Status Filter</label>
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
            <p className="text-sm md:text-base text-gray-600">Loading referral records...</p>
          </Card>
        ) : invitations.length === 0 ? (
          <Card className="p-6 md:p-8 text-center bg-blue-50 border-blue-200">
            <p className="text-sm md:text-base text-gray-600">
              {statusFilter !== "pending" ? "No records found with this status" : "No referral records found"}
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
                          {invitation.status}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800 text-xs">₵{invitation.credit_amount}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                      <div className="flex items-center gap-2 text-gray-700 truncate">
                        <Phone className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-blue-600" />
                        <span className="truncate">{invitation.referring_agent_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 truncate">
                        <User className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-blue-600" />
                        <span className="truncate">{invitation.referred_agent_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 truncate">
                        <Phone className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-blue-600" />
                        <span className="truncate">{invitation.referred_agent_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 truncate">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-blue-600" />
                        <span className="truncate text-xs">{formatDate(invitation.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Select
                      value={invitation.status}
                      onValueChange={(value) => handleUpdateStatus(invitation.id, value)}
                      disabled={processingId === invitation.id}
                    >
                      <SelectTrigger className="w-full md:w-40 border-blue-200 text-sm">
                        <SelectValue placeholder={invitation.status} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableStatusTransitions(invitation.status).length > 0 ? (
                          getAvailableStatusTransitions(invitation.status).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value={invitation.status} disabled>
                            No transitions available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteInvitation(invitation.id)}
                      disabled={processingId === invitation.id}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
    </div>
  )
}

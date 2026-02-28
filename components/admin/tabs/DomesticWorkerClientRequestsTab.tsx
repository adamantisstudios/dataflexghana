"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Eye, Trash2, Search, MapPin, Phone, Calendar, Loader2, Copy } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface ClientRequest {
  id: string
  client_full_name: string
  client_phone: string
  client_email: string | null
  exact_location: string
  number_of_people_needing_support: number | null
  person_needing_support: string | null
  religious_faith: string | null
  salary_estimation: string | null
  working_hours_days: string | null
  worker_type: "live-in" | "live-out" | null
  faith_preference: "same-faith" | "any-faith" | "different-faith" | null
  start_date_preference: string | null
  additional_info: string | null
  status: "pending" | "processing" | "completed" | "cancelled"
  assigned_worker_id: string | null
  created_at: string
  updated_at: string
  submitted_from: "agent" | "public" | null
  request_source: string | null
}

export default memo(function DomesticWorkerClientRequestsTab() {
  const [requests, setRequests] = useState<ClientRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterSource, setFilterSource] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("domestic_workers_client_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error("Error loading requests:", error)
      toast.error("Failed to load client requests")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("domestic_workers_client_requests")
        .update({ status: newStatus })
        .eq("id", requestId)

      if (error) throw error

      toast.success("Request status updated")
      loadRequests()
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update request status")
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from("domestic_workers_client_requests").delete().eq("id", requestId)

      if (error) throw error

      toast.success("Request deleted")
      setShowModal(false)
      loadRequests()
    } catch (error) {
      console.error("Error deleting request:", error)
      toast.error("Failed to delete request")
    }
  }

  const copyRequestDetails = (request: ClientRequest) => {
    const details = `--- Client Domestic Worker Request ---

📝 Client Information
Name: ${request.client_full_name}
Phone: ${request.client_phone}
Email: ${request.client_email || "—"}
Location: ${request.exact_location}
Submitted From: ${request.submitted_from === "public" ? "Public Portal" : "Agent Portal"}

👥 Requirements
People Needing Support: ${request.number_of_people_needing_support || "—"}
Person Type: ${request.person_needing_support || "—"}
Worker Type: ${request.worker_type || "—"}
Faith Preference: ${request.faith_preference || "—"}
Religious Faith: ${request.religious_faith || "—"}

💰 Financial Information
Salary Range: ${request.salary_estimation || "Not specified"}
Working Hours/Days: ${request.working_hours_days || "—"}
Start Date: ${request.start_date_preference || "—"}

📋 Additional Info
${request.additional_info || "None provided"}

✅ Status: ${request.status}`

    navigator.clipboard.writeText(details)
    toast.success("Request details copied!")
  }

  const memoizedFilteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        request.client_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.client_phone.includes(searchTerm) ||
        request.exact_location.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === "all" || request.status === filterStatus
      const matchesSource = filterSource === "all" || request.submitted_from === filterSource

      return matchesSearch && matchesStatus && matchesSource
    })
  }, [requests, searchTerm, filterStatus, filterSource])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-blue-700">Loading client requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-800">Client Domestic Worker Requests</h2>
          <p className="text-blue-600">Manage requests from clients seeking domestic workers</p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {requests.filter((r) => r.status === "pending").length} pending
        </Badge>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-blue-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search" className="text-xs font-medium">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                id="search"
                placeholder="Name, phone, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-8 text-xs border-blue-200"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status-filter" className="text-xs font-medium">
              Status
            </Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs border-blue-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="source-filter" className="text-xs font-medium">
              Submitted From
            </Label>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="h-8 text-xs border-blue-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="agent">Agent Portal</SelectItem>
                <SelectItem value="public">Public Portal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-blue-600">
          Showing {memoizedFilteredRequests.length} of {requests.length} requests
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memoizedFilteredRequests.map((request) => (
          <Card key={request.id} className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg text-blue-800">{request.client_full_name}</CardTitle>
                <Badge
                  className={
                    request.status === "pending"
                      ? "bg-yellow-500"
                      : request.status === "processing"
                        ? "bg-blue-500"
                        : request.status === "completed"
                          ? "bg-green-500"
                          : "bg-red-500"
                  }
                >
                  {request.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Badge variant="outline" className="text-xs">
                  {request.submitted_from === "public" ? "Public" : "Agent"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-blue-600">
                  <Phone className="h-4 w-4" />
                  <span>{request.client_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <MapPin className="h-4 w-4" />
                  <span>{request.exact_location}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 space-y-1">
                <div>
                  <strong>Worker Type:</strong> {request.worker_type || "Not specified"}
                </div>
                <div>
                  <strong>Salary Range:</strong> {request.salary_estimation || "Not specified"}
                </div>
                <div>
                  <strong>People Needing Support:</strong> {request.number_of_people_needing_support || "1"}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(request)
                    setShowModal(true)
                  }}
                  className="flex-1 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyRequestDetails(request)}
                  className="flex-1 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={request.status === "pending" ? "default" : "outline"}
                  onClick={() => handleUpdateStatus(request.id, "pending")}
                  className="flex-1 text-xs"
                >
                  Pending
                </Button>
                <Button
                  size="sm"
                  variant={request.status === "processing" ? "default" : "outline"}
                  onClick={() => handleUpdateStatus(request.id, "processing")}
                  className="flex-1 text-xs"
                >
                  Processing
                </Button>
                <Button
                  size="sm"
                  variant={request.status === "completed" ? "default" : "outline"}
                  onClick={() => handleUpdateStatus(request.id, "completed")}
                  className="flex-1 text-xs"
                >
                  Completed
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {memoizedFilteredRequests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-blue-600">No requests found matching your criteria.</p>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-blue-800">
                Request Details - {selectedRequest.client_full_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Name:</strong> {selectedRequest.client_full_name}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedRequest.client_phone}
                </div>
                <div>
                  <strong>Email:</strong> {selectedRequest.client_email || "Not provided"}
                </div>
                <div>
                  <strong>Location:</strong> {selectedRequest.exact_location}
                </div>
                <div>
                  <strong>People Needing Support:</strong> {selectedRequest.number_of_people_needing_support || "1"}
                </div>
                <div>
                  <strong>Person Type:</strong> {selectedRequest.person_needing_support || "Not specified"}
                </div>
                <div>
                  <strong>Worker Type:</strong> {selectedRequest.worker_type || "Not specified"}
                </div>
                <div>
                  <strong>Faith Preference:</strong> {selectedRequest.faith_preference || "Any"}
                </div>
                <div>
                  <strong>Religious Faith:</strong> {selectedRequest.religious_faith || "Not specified"}
                </div>
                <div>
                  <strong>Salary Range:</strong> {selectedRequest.salary_estimation || "Not specified"}
                </div>
                <div>
                  <strong>Working Hours/Days:</strong> {selectedRequest.working_hours_days || "Not specified"}
                </div>
                <div>
                  <strong>Start Date:</strong> {selectedRequest.start_date_preference || "Not specified"}
                </div>
                <div>
                  <strong>Status:</strong> {selectedRequest.status}
                </div>
                <div>
                  <strong>Submitted From:</strong>{" "}
                  {selectedRequest.submitted_from === "public" ? "Public Portal" : "Agent"}
                </div>
              </div>

              {selectedRequest.additional_info && (
                <div>
                  <strong>Additional Information:</strong>
                  <p className="mt-1 text-sm text-blue-600 bg-blue-50 p-3 rounded">{selectedRequest.additional_info}</p>
                </div>
              )}

              <div className="text-xs text-gray-500">
                <div>Created: {new Date(selectedRequest.created_at).toLocaleString()}</div>
                <div>Updated: {new Date(selectedRequest.updated_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-blue-200">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Close
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Request</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this request? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        handleDeleteRequest(selectedRequest.id)
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
})

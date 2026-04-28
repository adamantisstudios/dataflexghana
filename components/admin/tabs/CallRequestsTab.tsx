"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabase } from "@/lib/supabase"
import { Search, Filter, Phone, Mail, Clock, CheckCircle, XCircle, User, Home } from "lucide-react"

interface CallRequest {
  id: string
  property_id: string
  agent_name: string
  agent_email?: string
  agent_phone?: string
  property_title: string
  property_price: number
  property_currency: string
  request_message?: string
  status: string
  created_at: string
  updated_at: string
}

interface CallRequestsTabProps {
  getCachedData: () => CallRequest[] | undefined
  setCachedData: (data: CallRequest[]) => void
}

export default function CallRequestsTab({ getCachedData, setCachedData }: CallRequestsTabProps) {
  const [callRequests, setCallRequests] = useState<CallRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<CallRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 12
  const requestsListRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    if (requestsListRef.current) {
      requestsListRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  useEffect(() => {
    const loadCallRequests = async () => {
      const cachedData = getCachedData()
      if (cachedData) {
        setCallRequests(cachedData)
        setLoading(false)
        return
      }

      try {
        const { data: requestsData, error: requestsError } = await supabase
          .from("call_requests")
          .select("*")
          .order("created_at", { ascending: false })

        if (requestsError) throw requestsError

        setCallRequests(requestsData || [])
        setCachedData(requestsData || [])
      } catch (error) {
        console.error("Error loading call requests:", error)
        alert("Failed to load call requests data.")
      } finally {
        setLoading(false)
      }
    }

    loadCallRequests()
  }, [getCachedData, setCachedData])

  useEffect(() => {
    const filtered = callRequests.filter((request) => {
      const matchesSearch =
        request.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.agent_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.agent_phone?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "All Status" || request.status === statusFilter

      return matchesSearch && matchesStatus
    })

    setFilteredRequests(filtered)
    setCurrentPage(1)
  }, [searchTerm, callRequests, statusFilter])

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === "GHS" ? "₵" : "$"
    return `${symbol}${price.toLocaleString()}`
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("call_requests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", requestId)

      if (error) throw error

      const updatedRequests = callRequests.map((request) =>
        request.id === requestId ? { ...request, status: newStatus, updated_at: new Date().toISOString() } : request,
      )
      setCallRequests(updatedRequests)
      setCachedData(updatedRequests)
    } catch (error) {
      console.error("Error updating request status:", error)
      alert("Failed to update request status")
    }
  }

  const deleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this call request? This action cannot be undone.")) return

    try {
      const { error } = await supabase.from("call_requests").delete().eq("id", requestId)
      if (error) throw error

      const updatedRequests = callRequests.filter((request) => request.id !== requestId)
      setCallRequests(updatedRequests)
      setCachedData(updatedRequests)
    } catch (error) {
      console.error("Error deleting call request:", error)
      alert("Failed to delete call request")
    }
  }

  const getPaginatedData = (data: CallRequest[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => {
    if (totalPages <= 1) return null

    const getVisiblePages = () => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768
      const maxVisible = isMobile ? 3 : 5
      if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
      }
      const start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
      const end = Math.min(totalPages, start + maxVisible - 1)
      const adjustedStart = Math.max(1, end - maxVisible + 1)
      return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i)
    }

    const visiblePages = getVisiblePages()

    return (
      <div className="flex justify-center mt-4 sm:mt-6">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (currentPage > 1) {
                    onPageChange(currentPage - 1)
                  }
                }}
                className={`${currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
            {visiblePages.map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  if (currentPage < totalPages) {
                    onPageChange(currentPage + 1)
                  }
                }}
                className={`${currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case "contacted":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Contacted</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-emerald-800">Call Back Requests</h2>
          <div className="text-sm text-emerald-600 flex items-center">Total: {filteredRequests.length} requests</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Status">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              {filteredRequests.filter((r) => r.status === "pending").length} pending
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filteredRequests.filter((r) => r.status === "contacted").length} contacted
            </Badge>
          </div>
        </div>
      </div>

      <div ref={requestsListRef} className="space-y-4">
        {getPaginatedData(filteredRequests, currentPage).length === 0 ? (
          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Phone className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
                <h3 className="text-xl font-semibold text-emerald-800 mb-2">No Call Requests Found</h3>
                <p className="text-emerald-600">
                  {searchTerm || statusFilter !== "All Status"
                    ? "No requests match your current filters."
                    : "No call back requests have been submitted yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          getPaginatedData(filteredRequests, currentPage).map((request) => (
            <Card
              key={request.id}
              className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-emerald-800 text-lg flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {request.agent_name}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-800 font-medium">{request.property_title}</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(request.property_price, request.property_currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {request.agent_email && (
                      <p className="text-emerald-600 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {request.agent_email}
                      </p>
                    )}
                    {request.agent_phone && (
                      <p className="text-emerald-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {request.agent_phone}
                      </p>
                    )}
                    <p className="text-emerald-500 text-xs flex items-center gap-1 col-span-2">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">Requested:</span> {formatTimestamp(request.created_at)}
                    </p>
                  </div>

                  {request.request_message && (
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <p className="text-sm text-emerald-700">
                        <span className="font-medium">Message:</span> {request.request_message}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-emerald-100">
                    <Button
                      size="sm"
                      onClick={() => updateRequestStatus(request.id, "contacted")}
                      disabled={request.status === "contacted"}
                      className="bg-blue-600 hover:bg-blue-700 text-xs disabled:opacity-50"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Mark Contacted
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => updateRequestStatus(request.id, "completed")}
                      disabled={request.status === "completed"}
                      className="bg-green-600 hover:bg-green-700 text-xs disabled:opacity-50"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRequestStatus(request.id, "cancelled")}
                      disabled={request.status === "cancelled"}
                      className="border-red-300 text-red-600 hover:bg-red-50 text-xs disabled:opacity-50"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteRequest(request.id)}
                      className="text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={getTotalPages(filteredRequests.length)}
        onPageChange={(page) => {
          setCurrentPage(page)
          scrollToTop()
        }}
      />
    </div>
  )
}

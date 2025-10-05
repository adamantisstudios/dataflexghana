"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { supabase, type Agent } from "@/lib/supabase"
import { cleanOrdersData, getBundleDisplayName, canUpdateOrderStatus, type CleanedOrder } from "@/lib/bundle-data-handler"
import {
  ArrowLeft,
  Smartphone,
  Filter,
  Clock,
  CheckCircle,
  X,
  Wallet,
  CreditCard,
  MessageCircle,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Save,
  XCircle,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 10

// Simple cache implementation
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const getCachedData = async <T,>(key: string, fetcher: () => Promise<T>): Promise<T> => {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key)!
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data
    }
  }

  const data = await fetcher()
  cache.set(key, { data, timestamp: Date.now() })
  return data
}

export default function AdminAgentDataOrdersPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [orders, setOrders] = useState<CleanedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [providerFilter, setProviderFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Order status update state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [adminMessage, setAdminMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CleanedOrder | null>(null)

  // Memoized filtered and paginated data
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]

    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.recipient_phone.includes(searchTerm) ||
          order.payment_reference.toLowerCase().includes(searchTermLower) ||
          order.data_bundles?.name.toLowerCase().includes(searchTermLower) ||
          order.data_bundles?.provider.toLowerCase().includes(searchTermLower),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (providerFilter !== "all") {
      filtered = filtered.filter((order) => order.data_bundles?.provider === providerFilter)
    }

    return filtered
  }, [orders, searchTerm, statusFilter, providerFilter])

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrders, currentPage])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  }, [filteredOrders.length])

  // Stats calculations
  const stats = useMemo(() => {
    return {
      total: orders.length,
      completed: orders.filter((order) => order.status === "completed").length,
      pending: orders.filter((order) => order.status === "pending").length,
      commission: orders
        .filter((order) => order.status === "completed")
        .reduce((sum, order) => sum + order.commission_amount, 0),
    }
  }, [orders])

  // Load agent data (cached)
  const loadAgent = useCallback(async () => {
    try {
      const agentData = await getCachedData(`agent-${agentId}`, async () => {
        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .eq("id", agentId)
          .single()
        if (error) throw error
        return data
      })
      setAgent(agentData)
    } catch (error) {
      console.error("Error loading agent:", error)
      toast.error("Failed to load agent data")
      router.push("/admin/agents")
    }
  }, [agentId, router])

  const fetchOrders = useCallback(async () => {
    if (!agentId) return

    try {
      console.log('🔄 Loading orders for agent:', agentId)

      // CRITICAL FIX: Use the same query structure as the agent page to avoid validity_days error
      const { data, error } = await supabase
        .from("data_orders")
        .select(`
          *,
          data_bundles (
            id,
            name,
            provider,
            size_gb,
            price,
            commission_rate,
            validity_days,
            validity_months,
            description,
            is_active
          )
        `)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error loading orders:", JSON.stringify(error, null, 2))
        throw error
      }

      console.log('📦 Raw orders data:', data?.length || 0, 'orders')
      
      // CRITICAL FIX: Clean and validate the orders data
      const cleanedOrders = cleanOrdersData(data || [])
      console.log('✅ Cleaned orders data:', cleanedOrders.length, 'orders')
      
      // Log sample order for debugging
      if (cleanedOrders.length > 0) {
        console.log('📋 Sample cleaned order:', {
          id: cleanedOrders[0].id,
          bundle_name: cleanedOrders[0].data_bundles?.name,
          bundle_provider: cleanedOrders[0].data_bundles?.provider,
          bundle_size: cleanedOrders[0].data_bundles?.size_gb,
          bundle_price: cleanedOrders[0].data_bundles?.price,
          bundle_status: cleanedOrders[0].bundle_status
        })
      }

      setOrders(cleanedOrders)
    } catch (error) {
      console.error("Error loading orders:", error)
      toast.error("Failed to load orders. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [agentId])

  // Initial load
  useEffect(() => {
    if (agentId) {
      const loadData = async () => {
        setLoading(true)
        try {
          await Promise.all([loadAgent(), fetchOrders()])
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [agentId, loadAgent, fetchOrders])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, providerFilter])

  const refreshOrders = useCallback(async () => {
    // Clear cache for this agent
    cache.delete(`orders-${agentId}`)
    await fetchOrders()
    toast.success("Orders refreshed")
  }, [agentId, fetchOrders])

  // CRITICAL FIX: Add order status update functionality
  const updateOrderStatus = async (orderId: string, status: string, message?: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/data-orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          admin_message: message
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update order status')
      }

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status, admin_message: message, updated_at: new Date().toISOString() }
            : order
        )
      )

      toast.success(`Order status updated to ${status}`)
      setEditingOrderId(null)
      setShowStatusDialog(false)
      setSelectedOrder(null)
      setNewStatus("")
      setAdminMessage("")
    } catch (error: any) {
      console.error('Error updating order status:', error)
      toast.error(error.message || 'Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  const openStatusDialog = (order: CleanedOrder) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setAdminMessage(order.admin_message || "")
    setShowStatusDialog(true)
  }

  const handleStatusUpdate = () => {
    if (!selectedOrder || !newStatus) return
    
    // Check if status update is allowed
    const updateValidation = canUpdateOrderStatus(selectedOrder, newStatus)
    if (!updateValidation.canUpdate) {
      toast.error(updateValidation.reason)
      return
    }

    updateOrderStatus(selectedOrder.id, newStatus, adminMessage)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "canceled":
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const downloadReport = async () => {
    if (!agent) return
    setIsDownloading(true)
    try {
      const ordersToDownload = [...filteredOrders]
      if (ordersToDownload.length === 0) {
        toast.error("No orders found matching your current filters.")
        return
      }
      const headers = [
        "Order ID",
        "Date",
        "Time",
        "Bundle Name",
        "Provider",
        "Size (GB)",
        "Recipient Phone",
        "Amount (GH₵)",
        "Commission (GH₵)",
        "Payment Method",
        "Status",
        "Payment Reference",
        "Admin Message",
      ]
      const csvContent = [
        headers.join(","),
        ...ordersToDownload.map((order) => {
          const timestamp = formatTimestamp(order.created_at)
          return [
            order.id,
            `"${timestamp.date}"`,
            `"${timestamp.time}"`,
            `"${order.data_bundles?.name || ""}"`,
            order.data_bundles?.provider || "",
            order.data_bundles?.size_gb || "",
            order.recipient_phone,
            order.data_bundles?.price?.toFixed(2) || "0.00",
            order.commission_amount.toFixed(2),
            order.payment_method,
            order.status,
            `"${order.payment_reference}"`,
            `"${order.admin_message || "No message"}"`,
          ].join(",")
        }),
      ].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      let filterDescription = ""
      if (statusFilter !== "all" || providerFilter !== "all" || searchTerm) {
        const filters = []
        if (statusFilter !== "all") filters.push(statusFilter)
        if (providerFilter !== "all") filters.push(providerFilter)
        if (searchTerm) filters.push("search")
        filterDescription = `-${filters.join("-")}`
      }
      const timestamp = format(new Date(), "yyyy-MM-dd-HHmm")
      link.setAttribute("download", `${agent.full_name}-data-orders${filterDescription}-${timestamp}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Successfully downloaded ${ordersToDownload.length} order${ordersToDownload.length !== 1 ? "s" : ""}!`)
    } catch (error) {
      console.error("Error downloading report:", error)
      toast.error("Failed to download report. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading agent data orders...</p>
        </div>
      </div>
    )
  }
  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Not Found</h2>
          <p className="text-gray-600 mb-6">The requested agent could not be found.</p>
          <Button asChild>
            <Link href="/admin/agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Link>
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button variant="outline" size="sm" asChild className="w-fit bg-transparent">
              <Link href={`/admin/agents/${agentId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Agent Details
              </Link>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Data Orders</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Orders for {agent.full_name} ({agent.phone_number})
              </p>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Orders</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-green-100 text-xs sm:text-sm font-medium">Completed</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.completed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-amber-100 text-xs sm:text-sm font-medium">Pending</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Commission</p>
                <p className="text-lg sm:text-xl font-bold">
                  GH₵ {stats.commission.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Filters and Actions */}
        <Card className="border-blue-200 bg-white shadow-lg mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Data Orders ({filteredOrders.length} total)
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Showing {paginatedOrders.length} of {filteredOrders.length} orders
                  {(statusFilter !== "all" || providerFilter !== "all" || searchTerm) && (
                    <span className="ml-2 text-blue-600 font-medium">• Filtered results</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={refreshOrders}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={downloadReport}
                  disabled={isDownloading || filteredOrders.length === 0}
                  variant="outline"
                  size="sm"
                  className="border-green-200 text-green-700 hover:bg-green-50 bg-white min-w-[140px]"
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="relative">
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500">
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="MTN">MTN</SelectItem>
                  <SelectItem value="AirtelTigo">AirtelTigo</SelectItem>
                  <SelectItem value="Telecel">Telecel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>
        {/* Orders List */}
        <div className="space-y-4">
          {paginatedOrders.length === 0 ? (
            <Card className="border-blue-200 bg-white shadow-lg">
              <CardContent className="text-center py-12">
                <Smartphone className="h-16 w-16 mx-auto mb-4 text-blue-300" />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">No Orders Found</h3>
                <p className="text-blue-600 mb-6">
                  {searchTerm || statusFilter !== "all" || providerFilter !== "all"
                    ? "No orders match your current filters."
                    : "This agent hasn't placed any data orders yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedOrders.map((order) => {
                const timestamp = formatTimestamp(order.created_at)
                return (
                  <Card
                    key={order.id}
                    className="border-blue-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border-2 border-blue-200 shrink-0">
                              <img
                                src={
                                  order.data_bundles?.provider === "MTN"
                                    ? "/images/mtn.jpg"
                                    : order.data_bundles?.provider === "AirtelTigo"
                                      ? "/images/airteltigo.jpg"
                                      : "/images/telecel.jpg"
                                }
                                alt={`${order.data_bundles?.provider} logo`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-blue-800 text-xl mb-1">
                                {getBundleDisplayName(order.data_bundles)}
                              </h3>
                              <p className="text-blue-600 font-medium mb-2">
                                {order.data_bundles?.size_gb}GB • {order.data_bundles?.provider}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-blue-600">
                                  {timestamp.date} at {timestamp.time}
                                </span>
                                {order.bundle_status !== 'valid' && (
                                  <Badge variant="destructive" className="text-xs">
                                    {order.bundle_status === 'missing' ? 'Bundle Missing' : 'Bundle Invalid'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-start lg:items-end gap-3">
                            <Badge
                              className={`${getStatusColor(order.status)} flex items-center gap-1 text-sm px-3 py-1`}
                            >
                              {getStatusIcon(order.status)}
                              {order.status.toUpperCase()}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-sm px-3 py-1 ${
                                order.payment_method === "wallet"
                                  ? "border-purple-300 text-purple-700 bg-purple-50"
                                  : "border-blue-300 text-blue-700 bg-blue-50"
                              }`}
                            >
                              {order.payment_method === "wallet" ? (
                                <Wallet className="h-4 w-4 mr-1" />
                              ) : (
                                <CreditCard className="h-4 w-4 mr-1" />
                              )}
                              {order.payment_method === "wallet" ? "Wallet Payment" : "Manual Payment"}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                              Recipient
                            </p>
                            <p className="text-sm text-blue-800 font-bold">{order.recipient_phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                              Amount
                            </p>
                            <p className="text-sm text-blue-800 font-bold">
                              GH₵ {order.data_bundles?.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                              Commission
                            </p>
                            <p className="text-sm text-green-600 font-bold">
                              +GH₵ {order.commission_amount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                              Reference
                            </p>
                            <p className="text-xs text-blue-800 font-mono bg-white px-2 py-1 rounded border">
                              {order.payment_reference}
                            </p>
                          </div>
                        </div>
                        
                        {/* Admin Message Section */}
                        {order.admin_message && (
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">Admin Message:</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{order.admin_message}</p>
                          </div>
                        )}

                        {/* Admin Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
                          <Button
                            onClick={() => openStatusDialog(order)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update Status
                          </Button>
                          <Button
                            onClick={() => openStatusDialog(order)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Edit Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {totalPages > 1 && (
                <Card className="border-blue-200 bg-white shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-blue-600">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}{" "}
                        orders
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              className={
                                currentPage === page
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "border-blue-200 text-blue-700 hover:bg-blue-50"
                              }
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent className="w-[95vw] max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-blue-800 flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Update Order Status
              </DialogTitle>
              <DialogDescription className="text-blue-600">
                Update the status and add an admin message for this order
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm font-medium text-blue-800">Order Details:</p>
                  <p className="text-sm text-blue-700">
                    {getBundleDisplayName(selectedOrder.data_bundles)} - {selectedOrder.recipient_phone}
                  </p>
                  <p className="text-xs text-blue-600">
                    {formatTimestamp(selectedOrder.created_at).date} at {formatTimestamp(selectedOrder.created_at).time}
                  </p>
                  {selectedOrder.bundle_status !== 'valid' && (
                    <div className="mt-2">
                      <Badge variant="destructive" className="text-xs">
                        ⚠️ {selectedOrder.bundle_status === 'missing' ? 'Bundle data missing' : 'Bundle data invalid'}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="border-blue-200 focus:border-blue-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Admin Message (Optional)</label>
                  <Textarea
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    placeholder="Add a message for the agent about this order..."
                    className="border-blue-200 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={isUpdating || !newStatus}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Order
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowStatusDialog(false)}
                    variant="outline"
                    disabled={isUpdating}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

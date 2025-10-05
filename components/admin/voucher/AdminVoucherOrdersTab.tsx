"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import {
  Search,
  Filter,
  Package,
  Eye,
  Edit,
  CreditCard,
  Mail,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { getCurrentAdmin } from "@/lib/unified-auth-system"

interface VoucherOrder {
  id: string
  agent_id: string
  agent_name: string
  product_id: string
  quantity: number
  total_cost: number
  payment_reference: string
  payment_number: string
  delivery_method: "email" | "whatsapp"
  delivery_contact: string
  status: "pending" | "processing" | "delivered" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  // Joined data
  product_title?: string
  product_image_url?: string
  unit_price?: number
  agent_phone?: string
  agent_email?: string
}

interface AdminVoucherOrdersTabProps {
  adminId: string
}

export function AdminVoucherOrdersTab({ adminId }: AdminVoucherOrdersTabProps) {
  const [orders, setOrders] = useState<VoucherOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<VoucherOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<VoucherOrder | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<string>("")
  const [statusNote, setStatusNote] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
  })

  // Load orders
  const loadOrders = async () => {
    try {
      setLoading(true)

      const admin = getCurrentAdmin()
      if (!admin) {
        throw new Error("Admin authentication required")
      }

      // Use the API endpoint instead of direct Supabase call
      const response = await fetch("/api/admin/voucher/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": JSON.stringify(admin),
        },
        credentials: "include", // Include cookies for authentication
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to load orders")
      }

      const transformedOrders = result.orders || []
      setOrders(transformedOrders)
      calculateStats(transformedOrders)

      if (transformedOrders.length === 0) {
        toast.info("No voucher orders found")
      }
    } catch (error) {
      console.error("Error loading orders:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load orders"
      toast.error(errorMessage)
      setOrders([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const calculateStats = (ordersList: VoucherOrder[]) => {
    const today = new Date().toISOString().split("T")[0]

    const totalOrders = ordersList.length
    const pendingOrders = ordersList.filter((o) => o.status === "pending").length
    const processingOrders = ordersList.filter((o) => o.status === "processing").length
    const completedOrders = ordersList.filter((o) => o.status === "completed").length
    const cancelledOrders = ordersList.filter((o) => o.status === "cancelled").length
    const totalRevenue = ordersList.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total_cost, 0)
    const todayOrders = ordersList.filter((o) => o.created_at.startsWith(today)).length
    const todayRevenue = ordersList
      .filter((o) => o.created_at.startsWith(today) && o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total_cost, 0)

    setStats({
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
    })
  }

  // Filter orders
  useEffect(() => {
    let filtered = orders

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.product_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.delivery_contact.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  // Load data on mount
  useEffect(() => {
    loadOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "delivered":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <RefreshCw className="h-4 w-4" />
      case "delivered":
        return <Package className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const handleViewDetails = (order: VoucherOrder) => {
    setSelectedOrder(order)
    setShowDetailsDialog(true)
  }

  const handleUpdateStatus = (order: VoucherOrder) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setStatusNote("")
    setShowStatusDialog(true)
  }

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return

    setUpdatingStatus(true)
    try {
      const admin = getCurrentAdmin()
      if (!admin) {
        throw new Error("Admin authentication required")
      }

      // Use the API endpoint instead of direct Supabase RPC call
      const response = await fetch(`/api/admin/voucher/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Auth": JSON.stringify(admin),
        },
        credentials: "include",
        body: JSON.stringify({
          status: newStatus,
          note: statusNote,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to update order status")
      }

      toast.success("Order status updated successfully")
      setShowStatusDialog(false)
      setSelectedOrder(null)
      setNewStatus("")
      setStatusNote("")

      // Reload orders
      await loadOrders()
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update order status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute:
        date.toLocaleDateString() +
        " - " +
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-blue-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-blue-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-800">E-Orders Management</h2>
          <p className="text-blue-600">View and manage all voucher card orders</p>
        </div>
        <Button
          onClick={loadOrders}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-blue-100 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-100 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-amber-100 mt-1">Need verification</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-emerald-100 mt-1">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">GH₵ {stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-purple-100 mt-1">Total earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
          <Input
            placeholder="Search by agent, product, reference, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-blue-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 border-blue-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-blue-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  {searchTerm || statusFilter !== "all" ? "No matching orders found" : "No orders yet"}
                </h3>
                <p className="text-blue-600">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Orders will appear here when agents start purchasing voucher cards"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const timestamps = formatTimestamp(order.created_at)

            return (
              <Card
                key={order.id}
                className="border-blue-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-4">
                  {/* Product Image, Title and Status - Top Section */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={order.product_image_url || "/placeholder.svg"}
                          alt={order.product_title || "Product"}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder.svg?height=64&width=64"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-blue-800 text-sm line-clamp-2 leading-tight">
                          {order.product_title || "Unknown Product"}
                        </h3>
                        <Badge className={`${getStatusColor(order.status)} text-xs mt-1`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        </Badge>
                      </div>
                    </div>

                    {/* Order ID, Date and Time - Below top section */}
                    <div className="text-xs text-blue-600 space-y-1">
                      <p className="font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                      <p>{timestamps.absolute}</p>
                    </div>

                    {/* Agent Details and Order Details - Side by side */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="font-medium text-blue-700">Agent Details</p>
                        <p className="text-blue-800 font-medium">{order.agent_name}</p>
                        <p className="text-blue-600">Qty: {order.quantity}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-blue-700">Order Details</p>
                        <p className="text-blue-800 font-semibold">GH₵ {order.total_cost.toFixed(2)}</p>
                        <p className="text-blue-600">Unit: GH₵ {(order.total_cost / order.quantity).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Payment Details and Delivery Details - Side by side */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="font-medium text-blue-700">Payment Details</p>
                        <p className="text-blue-800 font-mono text-xs">{order.payment_reference.slice(-6)}</p>
                        <p className="text-blue-600">{order.payment_number}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-blue-700">Delivery Details</p>
                        <p className="text-blue-800 flex items-center gap-1">
                          {order.delivery_method === "email" ? (
                            <Mail className="h-3 w-3" />
                          ) : (
                            <MessageSquare className="h-3 w-3" />
                          )}
                          {order.delivery_method}
                        </p>
                        <p className="text-blue-600 truncate">{order.delivery_contact}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-blue-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                        className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50 text-xs h-8"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(order)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs h-8 px-3"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">
                Showing {filteredOrders.length} of {orders.length} orders
              </span>
              <div className="flex items-center gap-4">
                <span className="text-blue-700">
                  Total Revenue: GH₵{" "}
                  {filteredOrders
                    .filter((o) => o.status !== "cancelled")
                    .reduce((sum, order) => sum + order.total_cost, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800">
              <Eye className="h-5 w-5" />
              Order Details
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Product Info */}
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg overflow-hidden flex-shrink-0">
                      <ImageWithFallback
                        src={selectedOrder.product_image_url || "/placeholder.svg"}
                        alt={selectedOrder.product_title || "Product"}
                        className="w-full h-full object-cover"
                        fallbackSrc="/placeholder.svg?height=80&width=80"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-800">{selectedOrder.product_title}</h3>
                      <p className="text-sm text-blue-600 mt-1">Order #{selectedOrder.id}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(selectedOrder.status)}>
                          {getStatusIcon(selectedOrder.status)}
                          <span className="ml-1">
                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-800 text-lg">Agent Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-blue-600">Name</Label>
                      <p className="font-semibold text-blue-800">{selectedOrder.agent_name}</p>
                    </div>
                    {selectedOrder.agent_phone && (
                      <div>
                        <Label className="text-blue-600">Phone</Label>
                        <p className="text-blue-800">{selectedOrder.agent_phone}</p>
                      </div>
                    )}
                    {selectedOrder.agent_email && (
                      <div>
                        <Label className="text-blue-600">Email</Label>
                        <p className="text-blue-800">{selectedOrder.agent_email}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-800 text-lg">Order Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-blue-600">Quantity</Label>
                      <p className="text-blue-800">{selectedOrder.quantity}</p>
                    </div>
                    <div>
                      <Label className="text-blue-600">Unit Price</Label>
                      <p className="text-blue-800">
                        GH₵{" "}
                        {selectedOrder.unit_price?.toFixed(2) ||
                          (selectedOrder.total_cost / selectedOrder.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-blue-600">Total Cost</Label>
                      <p className="font-semibold text-blue-800">GH₵ {selectedOrder.total_cost.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-800 text-lg">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-blue-600">Payment Reference</Label>
                      <p className="text-blue-800 font-mono text-sm">{selectedOrder.payment_reference}</p>
                    </div>
                    <div>
                      <Label className="text-blue-600">MoMo Number</Label>
                      <p className="text-blue-800">{selectedOrder.payment_number}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-800 text-lg">Delivery Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-blue-600">Method</Label>
                      <p className="text-blue-800 capitalize flex items-center gap-2">
                        {selectedOrder.delivery_method === "email" ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                        {selectedOrder.delivery_method}
                      </p>
                    </div>
                    <div>
                      <Label className="text-blue-600">Contact</Label>
                      <p className="text-blue-800">{selectedOrder.delivery_contact}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timestamps */}
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800 text-lg">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-blue-600">Created</Label>
                    <p className="text-blue-800">{formatTimestamp(selectedOrder.created_at).absolute}</p>
                  </div>
                  <div>
                    <Label className="text-blue-600">Last Updated</Label>
                    <p className="text-blue-800">{formatTimestamp(selectedOrder.updated_at).absolute}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800">
              <Edit className="h-5 w-5" />
              Update Order Status
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <Label className="text-blue-700">Order</Label>
                <p className="text-blue-800 font-sem">
                  {selectedOrder.product_title} - {selectedOrder.agent_name}
                </p>
              </div>

              <div>
                <Label className="text-blue-700">Current Status</Label>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1">
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </Badge>
              </div>

              <div>
                <Label htmlFor="new-status" className="text-blue-700">
                  New Status
                </Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-note" className="text-blue-700">
                  Note (Optional)
                </Label>
                <Textarea
                  id="status-note"
                  placeholder="Add a note about this status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updatingStatus || !newStatus || newStatus === selectedOrder?.status}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {updatingStatus ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

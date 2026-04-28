"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Search,
  Filter,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Download,
  MapPin,
  Phone,
  CreditCard,
  Wallet,
  MessageCircle,
  AlertCircle,
  Trash2,
  MoreHorizontal,
  User,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  type WholesaleOrder,
  getWholesaleOrdersAdmin,
  updateWholesaleOrderStatusAdmin,
  deleteWholesaleOrderAdmin,
  updateWholesaleOrderCommissionPaidAdmin,
} from "@/lib/wholesale"
import { handleWholesaleOrderStatusChange } from "@/lib/order-status-handlers"

interface OrderManagementProps {
  onOrdersChange?: () => void
}

export default function OrderManagement({ onOrdersChange }: OrderManagementProps) {
  const [orders, setOrders] = useState<WholesaleOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<WholesaleOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [paymentFilter, setPaymentFilter] = useState("All")
  const [selectedOrder, setSelectedOrder] = useState<WholesaleOrder | null>(null)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [adminMessage, setAdminMessage] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)

  // PAGINATION FIX: Add pagination state management
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, paymentFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      console.log("🔄 Loading wholesale orders via admin API...")

      // Enhanced order loading with retry mechanism using admin API
      let retryCount = 0
      const maxRetries = 3
      let data = null

      while (retryCount < maxRetries && !data) {
        try {
          const result = await getWholesaleOrdersAdmin()
          data = result
          break
        } catch (error) {
          retryCount++
          console.warn(`⚠️ Admin API attempt ${retryCount} failed:`, error)

          if (retryCount < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
          } else {
            throw error
          }
        }
      }

      console.log("✅ Successfully loaded orders via admin API:", {
        count: data?.length || 0,
        orders: data?.slice(0, 3).map((o) => ({ id: o.id, status: o.status, agent: o.agents?.full_name })) || [],
      })

      if (data && data.length > 0) {
        console.log("[v0] First order from admin API:", data[0])
        console.log("[v0] First order variant_data from admin API:", data[0].variant_data)
      }

      setOrders(data || [])
    } catch (error) {
      console.error("❌ Error loading wholesale orders via admin API:", error)

      // Enhanced error handling with user-friendly messages
      let errorMessage = "Failed to load orders"

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      } else if (error && typeof error === "object") {
        errorMessage =
          (error as any).message ||
          (error as any).error_description ||
          (error as any).details ||
          JSON.stringify(error) ||
          "Database connection error"
      }

      // Show user-friendly error message
      console.error("Displaying error to user:", errorMessage)

      // Set empty orders array to prevent UI issues
      setOrders([])

      // You could add a toast notification here if available
      // toast.error(`Failed to load orders: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.agents?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.wholesale_products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((order) => order.status === statusFilter.toLowerCase())
    }

    if (paymentFilter !== "All") {
      filtered = filtered.filter((order) => order.payment_method === paymentFilter.toLowerCase())
    }

    setFilteredOrders(filtered)
  }

  // PAGINATION FIX: Add pagination helper functions
  const getPaginatedData = (data: WholesaleOrder[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  // PAGINATION FIX: Add pagination controls component
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "in_transit":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />
      case "confirmed":
        return <CheckCircle className="h-3 w-3" />
      case "processing":
        return <Package className="h-3 w-3" />
      case "in_transit":
        return <Truck className="h-3 w-3" />
      case "delivered":
        return <CheckCircle className="h-3 w-3" />
      case "canceled":
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      console.log(`[v0] Status change initiated: ${orderId} -> ${newStatus}`)

      // PAGINATION FIX: Store current page before update to preserve it
      const currentPageBeforeUpdate = currentPage

      const order = orders.find((o) => o.id === orderId)
      const oldStatus = order?.status

      console.log(`[v0] Order found:`, { orderId, oldStatus, newStatus, commission: order?.commission_amount })

      await updateWholesaleOrderStatusAdmin(orderId, newStatus as WholesaleOrder["status"])
      console.log(`[v0] Status updated successfully in database`)

      if (
        oldStatus !== "completed" &&
        oldStatus !== "delivered" &&
        (newStatus === "completed" || newStatus === "delivered")
      ) {
        console.log("🎯 Wholesale order marked as completed/delivered, triggering commission creation:", {
          orderId,
          oldStatus,
          newStatus,
        })

        try {
          const result = await handleWholesaleOrderStatusChange(orderId, oldStatus || "pending", newStatus, "admin")
          console.log(`[v0] Commission handler result:`, result)

          if (result.success && result.commissionChange?.action === "created") {
            console.log("✅ Wholesale commission created successfully:", result.commissionChange)
            // Show success message to admin
            alert(
              `Order ${newStatus}! Commission of GH₵${result.commissionChange.amount.toFixed(2)} has been credited to the agent.`,
            )
          } else if (!result.success) {
            console.error("❌ Failed to create wholesale commission:", result.message)
            alert(`Order status updated, but commission creation failed: ${result.message}`)
          }
        } catch (commissionError) {
          console.error("❌ Error triggering wholesale commission:", commissionError)
          alert("Order status updated, but there was an error processing the commission.")
        }
      }

      // PAGINATION FIX: Update orders without calling loadOrders() to avoid full reload
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as WholesaleOrder["status"] } : order,
        ),
      )

      // PAGINATION FIX: Restore the current page after update
      setCurrentPage(currentPageBeforeUpdate)

      onOrdersChange?.()
      console.log(`[v0] Status change completed successfully`)
    } catch (error) {
      console.error("❌ Error updating order status:", error)
      alert("Failed to update order status")
    }
  }

  // PAGINATION FIX: Preserve current page during commission updates
  const handleCommissionPaid = async (orderId: string, paid: boolean) => {
    try {
      // PAGINATION FIX: Store current page before update to preserve it
      const currentPageBeforeUpdate = currentPage

      await updateWholesaleOrderCommissionPaidAdmin(orderId, paid)

      // PAGINATION FIX: Update orders without calling loadOrders() to avoid full reload
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, commission_paid: paid } : order)),
      )

      // PAGINATION FIX: Restore the current page after update
      setCurrentPage(currentPageBeforeUpdate)

      onOrdersChange?.()
    } catch (error) {
      console.error("Error updating commission paid status:", error)
      alert("Failed to update commission status")
    }
  }

  const handleDelete = async (orderId: string) => {
    setOrderToDelete(orderId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!orderToDelete) return

    try {
      await deleteWholesaleOrderAdmin(orderToDelete)
      loadOrders()
      onOrdersChange?.()
      setShowDeleteDialog(false)
      setOrderToDelete(null)
    } catch (error) {
      console.error("Error deleting order:", error)
      alert("Failed to delete order")
    }
  }

  const openOrderDialog = (order: WholesaleOrder) => {
    setSelectedOrder(order)
    setShowOrderDialog(true)
  }

  const openMessageDialog = (order: WholesaleOrder) => {
    setSelectedOrder(order)
    setAdminMessage(order.admin_notes || "")
    setShowMessageDialog(true)
  }

  const handleSendMessage = async () => {
    if (!selectedOrder) return

    try {
      await updateWholesaleOrderStatusAdmin(selectedOrder.id, selectedOrder.status, adminMessage)
      setShowMessageDialog(false)
      setAdminMessage("")
      loadOrders()
      onOrdersChange?.()
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
    }
  }

  const downloadOrdersCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No orders to download")
      return
    }

    const headers = [
      "Order ID",
      "Date",
      "Agent Name",
      "Agent Phone",
      "Product",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Commission",
      "Commission Paid",
      "Payment Method",
      "Payment Reference",
      "Status",
      "Delivery Address",
      "Delivery Phone",
      "Admin Notes",
    ]

    const csvData = filteredOrders.map((order) => [
      order.id,
      formatDate(order.created_at),
      order.agents?.full_name || "N/A",
      order.agents?.phone_number || "N/A",
      order.wholesale_products?.name || "N/A",
      order.quantity,
      `GH₵ ${order.unit_price.toFixed(2)}`,
      `GH₵ ${order.total_amount.toFixed(2)}`,
      `GH₵ ${order.commission_amount.toFixed(2)}`,
      order.commission_paid ? "Yes" : "No",
      order.payment_method === "wallet" ? "Wallet" : "Manual",
      order.payment_reference || "N/A",
      order.status,
      order.delivery_address,
      order.delivery_phone,
      order.admin_notes || "",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `wholesale-orders-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-800 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Wholesale Orders
          </h2>
          <p className="text-emerald-600">Manage and track wholesale orders from agents</p>
        </div>
        <Button
          onClick={downloadOrdersCSV}
          variant="outline"
          className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
        >
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-emerald-200 focus:border-emerald-500"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Payment Methods</SelectItem>
                <SelectItem value="wallet">Wallet Payment</SelectItem>
                <SelectItem value="manual">Manual Payment</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                {filteredOrders.length} orders
              </Badge>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                {filteredOrders.filter((o) => o.status === "pending").length} pending
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List - REDESIGNED */}
      {filteredOrders.length === 0 ? (
        <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-6 text-center py-12">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
            <h3 className="text-xl font-semibold text-emerald-800 mb-2">No Orders Found</h3>
            <p className="text-emerald-600">
              {searchTerm || statusFilter !== "All" || paymentFilter !== "All"
                ? "No orders match your current filters."
                : "No wholesale orders have been placed yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* PAGINATION FIX: Use paginated data instead of all filtered orders */}
          {getPaginatedData(filteredOrders, currentPage).map((order) => (
            <Card
              key={order.id}
              className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-4">
                {/* Mobile-First Compact Layout */}
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Compact Product Image */}
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={order.wholesale_products?.image_urls?.[0] || "/placeholder.svg?height=64&width=64"}
                          alt={order.wholesale_products?.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=64&width=64"
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-emerald-800 text-sm sm:text-base truncate">
                          {order.wholesale_products?.name}
                        </h3>
                        <p className="text-xs text-emerald-600 mb-1">
                          #{order.id.slice(-8)} • {formatDate(order.created_at)}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-700 truncate">{order.agents?.full_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <Badge className={`${getStatusColor(order.status)} text-xs px-2 py-1 flex-shrink-0`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize hidden sm:inline">{order.status.replace("_", " ")}</span>
                    </Badge>
                  </div>

                  {/* Key Info Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-emerald-600 mb-1">Quantity</p>
                      <p className="font-medium text-emerald-800">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600 mb-1">Total</p>
                      <p className="font-semibold text-emerald-800">GH₵ {order.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600 mb-1">Commission</p>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <p className="font-medium text-green-600 text-xs">GH₵ {order.commission_amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            (GH₵ {(order.commission_amount / order.quantity).toFixed(2)} × {order.quantity})
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs px-1 py-0 ${
                            order.commission_paid
                              ? "border-green-200 text-green-700 bg-green-50"
                              : "border-amber-200 text-amber-700 bg-amber-50"
                          }`}
                        >
                          {order.commission_paid ? "✓" : "○"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-emerald-600 mb-1">Payment</p>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0 ${
                          order.payment_method === "wallet"
                            ? "border-purple-200 text-purple-700 bg-purple-50"
                            : "border-blue-200 text-blue-700 bg-blue-50"
                        }`}
                      >
                        {order.payment_method === "wallet" ? (
                          <Wallet className="h-2 w-2 mr-1" />
                        ) : (
                          <CreditCard className="h-2 w-2 mr-1" />
                        )}
                        {order.payment_method === "wallet" ? "Wallet" : "Manual"}
                      </Badge>
                    </div>
                  </div>

                  {/* Delivery Info (Collapsible on mobile) */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-emerald-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-32">{order.delivery_address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{order.delivery_phone}</span>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {order.admin_notes && (
                    <div className="bg-amber-50 rounded-md p-2 border border-amber-200">
                      <p className="text-amber-800 text-xs">{order.admin_notes}</p>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
                    {/* Status Selector */}
                    <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
                      <SelectTrigger className="w-32 h-8 text-xs border-emerald-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 px-2 bg-transparent">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openOrderDialog(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openMessageDialog(order)}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          {order.admin_notes ? "Edit Message" : "Add Message"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* PAGINATION FIX: Add pagination controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={getTotalPages(filteredOrders.length)}
        onPageChange={setCurrentPage}
      />

      {/* Order Detail Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-emerald-800 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Details
                </DialogTitle>
                <DialogDescription>
                  Order #{selectedOrder.id.slice(-8)} • {formatDate(selectedOrder.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Order Status */}
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(selectedOrder.status)} text-base px-3 py-1`}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-2 capitalize">{selectedOrder.status.replace("_", " ")}</span>
                  </Badge>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-800">GH₵ {selectedOrder.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-green-600">
                      Commission: GH₵ {selectedOrder.commission_amount.toFixed(2)}
                      {selectedOrder.commission_paid && " (Paid)"}
                    </p>
                  </div>
                </div>

                {/* Product Details */}
                <Card className="border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 text-lg">Product Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={
                            selectedOrder.wholesale_products?.image_urls?.[0] || "/placeholder.svg?height=80&width=80"
                          }
                          alt={selectedOrder.wholesale_products?.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=80&width=80"
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-emerald-800 mb-1">
                          {selectedOrder.wholesale_products?.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-emerald-600">Unit Price:</p>
                            <p className="font-medium">GH₵ {selectedOrder.unit_price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-emerald-600">Quantity:</p>
                            <p className="font-medium">{selectedOrder.quantity}</p>
                          </div>
                          <div>
                            <p className="text-emerald-600">Commission per item:</p>
                            <p className="font-medium text-green-600">
                              GH₵ {(selectedOrder.commission_amount / selectedOrder.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Selected Product Variants for This Order */}
                        {selectedOrder.variant_data && Object.keys(selectedOrder.variant_data).length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-emerald-600 text-sm font-medium mb-2">Selected Variants:</p>
                            <div className="space-y-2">
                              {Object.entries(selectedOrder.variant_data).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-start p-2 bg-emerald-50 rounded">
                                  <p className="font-medium text-emerald-700 text-sm capitalize">{key}:</p>
                                  <p className="text-gray-600 text-sm font-semibold">{String(value)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Product Variants Display */}
                        {selectedOrder.wholesale_products?.variants && (
                          (() => {
                            let variants = selectedOrder.wholesale_products.variants
                            if (typeof variants === 'string') {
                              try {
                                variants = JSON.parse(variants)
                              } catch (e) {
                                variants = null
                              }
                            }
                            
                            if (Array.isArray(variants) && variants.length > 0) {
                              return (
                                <div className="mt-4 pt-4 border-t">
                                  <p className="text-emerald-600 text-sm font-medium mb-2">Available Variants:</p>
                                  <div className="space-y-2">
                                    {variants.map((variant: any, idx: number) => (
                                      <div key={idx} className="text-sm">
                                        <p className="font-medium text-emerald-700">{variant.type}:</p>
                                        <p className="text-gray-600">{variant.values.join(", ")}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })()
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Information */}
                <Card className="border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 text-lg">Agent Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-emerald-600 text-sm">Name:</p>
                        <p className="font-medium text-emerald-800">{selectedOrder.agents?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-emerald-600 text-sm">Phone:</p>
                        <p className="font-medium text-emerald-800">{selectedOrder.agents?.phone_number}</p>
                      </div>
                      <div>
                        <p className="text-emerald-600 text-sm">Region:</p>
                        <p className="font-medium text-emerald-800">{selectedOrder.agents?.region}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment & Delivery Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-emerald-200">
                    <CardHeader>
                      <CardTitle className="text-emerald-800 text-lg flex items-center gap-2">
                        {selectedOrder.payment_method === "wallet" ? (
                          <Wallet className="h-4 w-4" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                        Payment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-emerald-600 text-sm">Payment Method:</p>
                          <Badge
                            variant="outline"
                            className={
                              selectedOrder.payment_method === "wallet"
                                ? "border-purple-200 text-purple-700 bg-purple-50"
                                : "border-blue-200 text-blue-700 bg-blue-50"
                            }
                          >
                            {selectedOrder.payment_method === "wallet" ? "Wallet Payment" : "Manual Payment"}
                          </Badge>
                        </div>
                        {selectedOrder.payment_reference && (
                          <div>
                            <p className="text-emerald-600 text-sm">Reference:</p>
                            <p className="font-medium text-emerald-800">{selectedOrder.payment_reference}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-emerald-200">
                    <CardHeader>
                      <CardTitle className="text-emerald-800 text-lg flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-emerald-600 text-sm">Address:</p>
                          <p className="text-emerald-800">{selectedOrder.delivery_address}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600 text-sm">Phone:</p>
                          <p className="font-medium text-emerald-800 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedOrder.delivery_phone}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Admin Notes */}
                {selectedOrder.admin_notes && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="text-amber-800 text-lg">Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-amber-700">{selectedOrder.admin_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">Add Admin Message</DialogTitle>
            <DialogDescription>
              Add a message or note to this order. This will be visible to the agent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="message" className="text-emerald-700">
                Message
              </Label>
              <Textarea
                id="message"
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="Enter your message or note..."
                className="mt-1.5 border-emerald-200 focus:border-emerald-500"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMessageDialog(false)}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Save Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-800">Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Deleting this order will permanently remove it from the system. All associated data will be lost.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Download,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
  Wallet,
  Star,
  DollarSign,
  RefreshCw,
} from "lucide-react"
import { WholesaleOrder, getWholesaleOrdersByAgent } from "@/lib/wholesale"
import { Agent } from "@/lib/supabase"

interface OrderHistoryProps {
  agent: Agent | null
}

export default function OrderHistory({ agent }: OrderHistoryProps) {
  const [orders, setOrders] = useState<WholesaleOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<WholesaleOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [paymentFilter, setPaymentFilter] = useState("All")
  const [selectedOrder, setSelectedOrder] = useState<WholesaleOrder | null>(null)
  const [showOrderDialog, setShowOrderDialog] = useState(false)

  useEffect(() => {
    if (agent) {
      loadOrders()
    }
  }, [agent])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, paymentFilter])

  const loadOrders = async (showRefreshIndicator = false) => {
    if (!agent) return

    if (showRefreshIndicator) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const data = await getWholesaleOrdersByAgent(agent.id)
      setOrders(data)
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadOrders(true)
  }

  const filterOrders = () => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.wholesale_products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const openOrderDialog = (order: WholesaleOrder) => {
    setSelectedOrder(order)
    setShowOrderDialog(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "yellow", icon: Clock },
      processing: { color: "blue", icon: Package },
      shipped: { color: "purple", icon: Truck },
      delivered: { color: "green", icon: CheckCircle },
      cancelled: { color: "red", icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPaymentBadge = (paymentMethod: string) => {
    const Icon = paymentMethod === 'wallet' ? Wallet : CreditCard
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-emerald-800 flex items-center gap-2">
            <Package className="h-5 w-5 md:h-6 md:w-6" />
            Order History
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Loading your orders...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg md:text-xl text-emerald-800 flex items-center gap-2">
              <Package className="h-5 w-5 md:h-6 md:w-6" />
              Order History
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Track your wholesale orders
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Payments</SelectItem>
              <SelectItem value="wallet">Wallet</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List - Mobile/Responsive */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-3 text-emerald-300" />
              <p className="text-emerald-600 text-sm">No orders found</p>
              {orders.length === 0 && (
                <p className="text-emerald-500 text-xs mt-2">
                  Your orders will appear here after you make a purchase
                </p>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-3 sm:p-4 space-y-3 bg-white shadow-sm">
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base text-emerald-800 truncate">
                        {order.wholesale_products?.name || 'Product'}
                      </h4>
                      <p className="text-xs text-emerald-600 break-all">#{order.id}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {getStatusBadge(order.status)}
                      {getPaymentBadge(order.payment_method)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex justify-between sm:block">
                    <span className="text-emerald-600">Quantity:</span>
                    <span className="ml-1 font-medium">{order.quantity}</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-emerald-600">Amount:</span>
                    <span className="ml-1 font-medium">GH₵{order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-emerald-600">Commission:</span>
                    <span className="ml-1 font-medium text-green-600">GH₵{order.commission_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-emerald-600">Date:</span>
                    <span className="ml-1 font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openOrderDialog(order)}
                    className="text-xs flex-1 sm:flex-none"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Order Details</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Order #{selectedOrder?.id}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Product</h4>
                    <p className="text-sm">{selectedOrder.wholesale_products?.name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Quantity</h4>
                    <p className="text-sm">{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Unit Price</h4>
                    <p className="text-sm">GH₵{selectedOrder.unit_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Total Amount</h4>
                    <p className="text-sm font-bold">GH₵{selectedOrder.total_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Commission</h4>
                    <p className="text-sm text-green-600">GH₵{selectedOrder.commission_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Status</h4>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Payment Method</h4>
                    <div className="mt-1">{getPaymentBadge(selectedOrder.payment_method)}</div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Order Date</h4>
                    <p className="text-sm">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedOrder.delivery_address && (
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Delivery Address</h4>
                    <p className="text-sm">{selectedOrder.delivery_address}</p>
                  </div>
                )}

                {selectedOrder.delivery_phone && (
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Delivery Phone</h4>
                    <p className="text-sm">{selectedOrder.delivery_phone}</p>
                  </div>
                )}

                {selectedOrder.payment_reference && (
                  <div>
                    <h4 className="font-medium text-sm md:text-base">Payment Reference</h4>
                    <p className="text-sm">{selectedOrder.payment_reference}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

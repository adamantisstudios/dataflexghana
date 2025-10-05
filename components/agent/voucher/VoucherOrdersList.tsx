"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { 
  Search, 
  Filter, 
  Package, 
  CreditCard, 
  Mail, 
  MessageSquare,
  Eye,
  RefreshCw
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface VoucherOrder {
  id: string
  agent_id: string
  agent_name: string
  product_id: string
  quantity: number
  total_cost: number
  payment_reference: string
  payment_number: string
  delivery_method: 'email' | 'whatsapp'
  delivery_contact: string
  status: 'pending' | 'processing' | 'delivered' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  product_title?: string
  product_image_url?: string
  unit_price?: number
}

interface VoucherOrdersListProps {
  orders: VoucherOrder[]
  loading?: boolean
  onRefresh?: () => void
  onViewDetails?: (order: VoucherOrder) => void
}

export function VoucherOrdersList({ 
  orders, 
  loading = false, 
  onRefresh,
  onViewDetails 
}: VoucherOrdersListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [filteredOrders, setFilteredOrders] = useState<VoucherOrder[]>(orders)

  useEffect(() => {
    let filtered = orders
    if (searchTerm.trim()) {
      filtered = filtered.filter(order =>
        order.product_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.payment_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.delivery_contact.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter)
    }
    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delivered': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting admin payment verification'
      case 'processing': return 'Payment verified; preparing delivery'
      case 'delivered': return 'Sent via selected delivery method'
      case 'completed': return 'Order closed'
      case 'cancelled': return 'Order cancelled by admin'
      default: return 'Unknown status'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit" 
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="flex gap-3">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
          <Input
            placeholder="Search by product, reference, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm h-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm h-9 text-sm">
              <Filter className="h-4 w-4 mr-1" />
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
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 h-9"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <CardContent className="text-center py-8">
              <Package className="h-10 w-10 mx-auto mb-3 text-emerald-300" />
              <h3 className="text-base font-semibold text-emerald-800 mb-1">
                {searchTerm || statusFilter !== "all" ? "No matching orders" : "No orders yet"}
              </h3>
              <p className="text-emerald-600 text-sm">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Your orders will appear here once created."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const timestamps = formatTimestamp(order.created_at)

            return (
              <Card 
                key={order.id} 
                className="border-emerald-200 bg-white/95 backdrop-blur-sm hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-emerald-50 flex-shrink-0">
                        <ImageWithFallback
                          src={order.product_image_url || "/placeholder.svg"}
                          alt={order.product_title || "Product"}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder.svg?height=56&width=56"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-emerald-800 text-sm">
                          {order.product_title || "Unknown Product"}
                        </h3>
                        <p className="text-xs text-emerald-600">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[11px] text-emerald-500">{timestamps.relative} • {timestamps.absolute}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-xs px-2 py-0.5`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-emerald-600 font-medium">Quantity & Cost</p>
                      <p className="text-emerald-800">{order.quantity} × GH₵ {order.unit_price?.toFixed(2) || (order.total_cost / order.quantity).toFixed(2)}</p>
                      <p className="font-semibold text-emerald-800">Total: GH₵ {order.total_cost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600 font-medium flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Payment Ref
                      </p>
                      <p className="text-emerald-800 font-mono truncate">{order.payment_reference}</p>
                      <p className="text-emerald-600">{order.payment_number}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600 font-medium flex items-center gap-1">
                        {order.delivery_method === 'email' ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />} Delivery
                      </p>
                      <p className="text-emerald-800 capitalize">{order.delivery_method}</p>
                      <p className="text-emerald-600 truncate">{order.delivery_contact}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600 font-medium">Status</p>
                      <p className="text-emerald-800">{getStatusDescription(order.status)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {onViewDetails && (
                    <div className="flex justify-end pt-2 border-t border-emerald-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(order)}
                        className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 h-8 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" /> View Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-700">
                Showing {filteredOrders.length} of {orders.length} orders
              </span>
              <span className="text-emerald-700 font-medium">
                Total Spent: GH₵ {filteredOrders.reduce((sum, order) => sum + order.total_cost, 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Wifi, RefreshCw, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface DataOrder {
  id: string
  network: string
  data_bundle: string
  amount: number
  phone_number: string
  reference_code: string
  payment_method: string
  created_at: string
}

const PAYMENT_METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  manual: { bg: "bg-blue-100", text: "text-blue-800" },
  paystack: { bg: "bg-purple-100", text: "text-purple-800" },
  unknown: { bg: "bg-gray-100", text: "text-gray-800" },
}

export function DataOrdersList() {
  const [orders, setOrders] = useState<DataOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<DataOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("data_orders_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)

      if (error) {
        throw error
      }
      setOrders(Array.isArray(data) ? data : [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error("[v0] Error loading data orders:", error)
      toast.error("Failed to load data orders")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    // Refresh every 10 seconds
    const interval = setInterval(loadOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const matchesSearch =
        order.phone_number.includes(searchTerm) ||
        order.data_bundle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.reference_code.includes(searchTerm)

      const matchesNetwork = serviceFilter === "all" || order.network === serviceFilter

      return matchesSearch && matchesNetwork
    })

    setFilteredOrders(filtered)
  }, [orders, searchTerm, serviceFilter])

  const getNetworkBadge = (network: string) => {
    const badgeConfig: Record<string, { bg: string; text: string }> = {
      MTN: { bg: "bg-yellow-100", text: "text-yellow-800" },
      AirtelTigo: { bg: "bg-orange-100", text: "text-orange-800" },
      Telecel: { bg: "bg-red-100", text: "text-red-800" },
    }
    const config = badgeConfig[network] || { bg: "bg-gray-100", text: "text-gray-800" }
    return (
      <Badge className={`${config.bg} ${config.text} border border-gray-300 text-xs`}>
        {network}
      </Badge>
    )
  }

  const getPaymentMethodBadge = (method: string) => {
    const config = PAYMENT_METHOD_COLORS[method] || PAYMENT_METHOD_COLORS.unknown
    return (
      <Badge className={`${config.bg} ${config.text} border border-gray-300 text-xs capitalize`}>
        {method}
      </Badge>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const uniqueNetworks = Array.from(new Set(orders.map((o) => o.network)))

  const todayOrders = orders.filter((o) => {
    const orderDate = new Date(o.created_at).toLocaleDateString()
    const today = new Date().toLocaleDateString()
    return orderDate === today
  }).length

  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-2"></div>
        <span className="text-xs sm:text-sm text-gray-600">Loading data orders...</span>
      </div>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1">
            <CardTitle className="text-xs sm:text-base flex items-center gap-2">
              <Wifi className="h-3 w-3 sm:h-4 sm:w-4" />
              Data Bundle Orders
            </CardTitle>
            <CardDescription className="text-xs">Track all data bundle orders logged</CardDescription>
          </div>
          <Button
            onClick={loadOrders}
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2"
            disabled={loading}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 pt-2 sm:pt-3 space-y-3">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
            <Input
              placeholder="Search by phone, bundle, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs py-1 h-8"
            />
          </div>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="text-xs py-1 h-8">
              <SelectValue placeholder="Filter by network" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Networks</SelectItem>
              {uniqueNetworks.map((network) => (
                <SelectItem key={network} value={network}>
                  {network}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <p className="text-xs text-blue-600 font-medium truncate">Total</p>
            <p className="text-base sm:text-lg font-bold text-blue-900">{orders.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <p className="text-xs text-green-600 font-medium truncate">Today</p>
            <p className="text-base sm:text-lg font-bold text-green-900">{todayOrders}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded p-2">
            <p className="text-xs text-amber-600 font-medium truncate">Revenue</p>
            <p className="text-sm sm:text-base font-bold text-amber-900 truncate">₵{totalRevenue.toFixed(0)}</p>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto border rounded-lg">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="py-2 px-2">Phone</TableHead>
                <TableHead className="py-2 px-2">Network</TableHead>
                <TableHead className="py-2 px-2">Data Bundle</TableHead>
                <TableHead className="py-2 px-2 text-right">Amount</TableHead>
                <TableHead className="py-2 px-2">Reference Code</TableHead>
                <TableHead className="py-2 px-2">Payment</TableHead>
                <TableHead className="py-2 px-2">Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-3 text-gray-500 text-xs">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <TableCell className="py-2 px-2 font-mono text-xs">{order.phone_number}</TableCell>
                    <TableCell className="py-2 px-2">{getNetworkBadge(order.network)}</TableCell>
                    <TableCell className="py-2 px-2 text-xs font-medium">{order.data_bundle}</TableCell>
                    <TableCell className="py-2 px-2 text-right font-semibold text-xs">₵{order.amount.toFixed(2)}</TableCell>
                    <TableCell className="py-2 px-2 font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <span>{order.reference_code}</span>
                        <button
                          onClick={() => copyToClipboard(order.reference_code)}
                          className="p-0.5 hover:bg-gray-200 rounded"
                        >
                          <Copy className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-2">{getPaymentMethodBadge(order.payment_method)}</TableCell>
                    <TableCell className="py-2 px-2 text-gray-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-xs">
              No orders found
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="border shadow-sm hover:shadow-md transition">
                <CardContent className="p-3 space-y-3">
                  {/* Header: Network, Payment Method, Date */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-2">
                      {getNetworkBadge(order.network)}
                      {getPaymentMethodBadge(order.payment_method)}
                    </div>
                    <p className="text-xs text-gray-500 text-right">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div className="bg-gray-50 rounded p-2 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium">Phone Number</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">{order.phone_number}</p>
                  </div>

                  {/* Data Bundle & Amount */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-50 rounded p-2 border border-emerald-200">
                      <p className="text-xs text-emerald-600 font-medium">Data Bundle</p>
                      <p className="font-semibold text-sm text-emerald-900">{order.data_bundle}</p>
                    </div>
                    <div className="bg-amber-50 rounded p-2 border border-amber-200">
                      <p className="text-xs text-amber-600 font-medium">Amount</p>
                      <p className="font-semibold text-sm text-amber-900">₵{order.amount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Reference Code with Copy Button */}
                  <div className="bg-blue-50 rounded p-2 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-1">Reference Code</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm font-bold text-blue-900 break-all">{order.reference_code}</p>
                      <button
                        onClick={() => copyToClipboard(order.reference_code)}
                        className="p-1.5 hover:bg-blue-100 rounded flex-shrink-0"
                        title="Copy reference code"
                      >
                        <Copy className="h-4 w-4 text-blue-600" />
                      </button>
                    </div>
                  </div>

                  {/* Time */}
                  <p className="text-xs text-gray-500 text-right">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <p className="text-xs text-gray-400 text-right mt-2">Updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </CardContent>
    </Card>
  )
}

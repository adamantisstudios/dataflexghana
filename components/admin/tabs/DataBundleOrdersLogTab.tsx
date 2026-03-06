"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { toast } from "sonner"
import { Search, Download, Copy, Check, AlertCircle, Wifi, Trash2 } from "lucide-react"
import { format } from "date-fns"

interface DataOrderLog {
  id: string
  network: string
  data_bundle: string
  amount: number
  phone_number: string
  reference_code: string
  payment_method: string
  created_at: string
  updated_at: string
}

interface DataBundleOrdersLogTabProps {
  getCachedData: () => DataOrderLog[] | undefined
  setCachedData: (data: DataOrderLog[]) => void
}

export default function DataBundleOrdersLogTab({
  getCachedData,
  setCachedData,
}: DataBundleOrdersLogTabProps) {
  const [orders, setOrders] = useState<DataOrderLog[]>([])
  const [filteredOrders, setFilteredOrders] = useState<DataOrderLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [copiedRefs, setCopiedRefs] = useState<Set<string>>(new Set())
  const [copiedNumbers, setCopiedNumbers] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const itemsPerPage = 12

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Delete this order from the log? This cannot be undone.")) return
    setDeletingIds((prev) => new Set([...prev, orderId]))
    try {
      const response = await fetch(`/api/admin/data-orders/log/${orderId}`, { method: "DELETE" })
      const result = await response.json()
      if (response.ok && result.success) {
        const updated = orders.filter((o) => o.id !== orderId)
        setOrders(updated)
        setCachedData(updated)
        toast.success("Order deleted successfully")
      } else {
        toast.error(result.message || "Failed to delete order")
      }
    } catch (err) {
      console.error("[v0] Error deleting order:", err)
      toast.error("Failed to delete order")
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
    }
  }

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const cachedData = getCachedData()
      
      if (cachedData && cachedData.length > 0) {
        setOrders(cachedData)
        setFilteredOrders(cachedData)
        setLoading(false)
        return
      }

      const response = await fetch("/api/admin/data-orders/log-list")
      if (!response.ok) {
        throw new Error("Failed to fetch data orders log")
      }

      const data = await response.json()
      if (data.success && data.data) {
        setOrders(data.data)
        setCachedData(data.data)
        setFilteredOrders(data.data)
      }
    } catch (error) {
      console.error("[v0] Error loading data orders log:", error)
      toast.error("Failed to load data orders log")
    } finally {
      setLoading(false)
    }
  }, [getCachedData, setCachedData])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Filter orders based on search term
  useEffect(() => {
    const filtered = orders.filter((order) =>
      order.phone_number.includes(searchTerm) ||
      order.network.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.data_bundle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.reference_code.includes(searchTerm) ||
      order.payment_method.includes(searchTerm.toLowerCase())
    )
    setFilteredOrders(filtered)
    setCurrentPage(1)
  }, [searchTerm, orders])

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const copyToClipboard = (text: string, type: "reference" | "number") => {
    navigator.clipboard.writeText(text)
    
    if (type === "reference") {
      setCopiedRefs((prev) => new Set([...prev, text]))
      setTimeout(() => {
        setCopiedRefs((prev) => {
          const newSet = new Set(prev)
          newSet.delete(text)
          return newSet
        })
      }, 2000)
    } else {
      setCopiedNumbers((prev) => new Set([...prev, text]))
      setTimeout(() => {
        setCopiedNumbers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(text)
          return newSet
        })
      }, 2000)
    }
    toast.success(`${type === "reference" ? "Reference Code" : "Number"} copied to clipboard`)
  }

  const exportToCSV = () => {
    const headers = [
      "Phone Number",
      "Network",
      "Data Bundle",
      "Amount (₵)",
      "Reference Code",
      "Payment Method",
      "Order Date",
    ]
    
    const csvContent = [
      headers.join(","),
      ...filteredOrders.map((order) =>
        [
          order.phone_number,
          order.network,
          order.data_bundle,
          order.amount.toFixed(2),
          order.reference_code,
          order.payment_method,
          format(new Date(order.created_at), "dd/MM/yyyy HH:mm:ss"),
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `data-orders-log-${format(new Date(), "dd-MM-yyyy")}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success("Data exported successfully")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Data Bundle Orders Log</h2>
        <Button
          onClick={exportToCSV}
          disabled={filteredOrders.length === 0}
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <Card className="border-emerald-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
            <Input
              placeholder="Search by phone, network, bundle, or reference code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-emerald-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-2xl font-bold text-emerald-800">{orders.length}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Filtered Results</div>
            <div className="text-2xl font-bold text-blue-800">{filteredOrders.length}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-2xl font-bold text-green-800">
              ₵{orders.reduce((sum, order) => sum + order.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Active Networks</div>
            <div className="text-2xl font-bold text-amber-800">
              {new Set(orders.map((o) => o.network)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards Grid */}
      {filteredOrders.length === 0 ? (
        <Card className="border-emerald-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No data bundle orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedOrders.map((order) => (
              <Card key={order.id} className="border-emerald-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-4 space-y-3">
                  {/* Header: Network Badge & Payment Method & Date */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {order.network}
                      </Badge>
                      <Badge
                        className={`capitalize ${
                          order.payment_method === "manual"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {order.payment_method}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(order.created_at), "dd/MM/yy")}
                    </span>
                  </div>

                  {/* Phone Number */}
                  <div className="bg-gray-50 rounded p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">Phone Number</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-gray-900">{order.phone_number}</span>
                      <button
                        onClick={() => copyToClipboard(order.phone_number, "number")}
                        className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        title="Copy phone number"
                      >
                        {copiedNumbers.has(order.phone_number) ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Data Bundle & Amount */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-50 rounded p-3 border border-emerald-200">
                      <p className="text-xs text-emerald-600 font-medium mb-1">Data Bundle</p>
                      <p className="font-semibold text-emerald-900">{order.data_bundle}</p>
                    </div>
                    <div className="bg-amber-50 rounded p-3 border border-amber-200">
                      <p className="text-xs text-amber-600 font-medium mb-1">Amount</p>
                      <p className="font-bold text-amber-900">₵{order.amount.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Reference Code */}
                  <div className="bg-blue-50 rounded p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-1">Reference Code</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="font-mono text-sm font-bold text-blue-900 break-all">
                        {order.reference_code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(order.reference_code, "reference")}
                        className="p-1 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                        title="Copy reference code"
                      >
                        {copiedRefs.has(order.reference_code) ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Time & Delete */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-gray-500">
                      {format(new Date(order.created_at), "h:mm a")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={deletingIds.has(order.id)}
                      className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      title="Delete order (after attended to)"
                    >
                      {deletingIds.has(order.id) ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Info */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {paginatedOrders.length} of {filteredOrders.length} orders
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-emerald-200"
                >
                  <PaginationPrevious className="w-4 h-4" />
                </Button>
              </PaginationItem>

              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNumber: number
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <Button
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={
                        currentPage === pageNumber
                          ? "bg-emerald-600 text-white"
                          : "border-emerald-200"
                      }
                    >
                      {pageNumber}
                    </Button>
                  </PaginationItem>
                )
              })}

              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-emerald-200"
                >
                  <PaginationNext className="w-4 h-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

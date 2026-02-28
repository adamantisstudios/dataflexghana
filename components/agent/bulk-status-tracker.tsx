"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trash2, Package } from "lucide-react"

interface BulkOrderStatus {
  id: string
  source: string
  row_count: number
  accepted_count: number
  rejected_count: number
  status: string
  created_at: string
}

export default function BulkStatusTracker() {
  const [orders, setOrders] = useState<BulkOrderStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    const agentData = localStorage.getItem("agent")
    if (agentData) {
      try {
        const parsed = JSON.parse(agentData)
        setAgentId(parsed.id)
        loadOrders(parsed.id)
      } catch (error) {
        console.error("Failed to parse agent data:", error)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!agentId) return

    const interval = setInterval(() => {
      loadOrders(agentId)
    }, 5000)

    return () => clearInterval(interval)
  }, [agentId])

  const loadOrders = async (id: string) => {
    try {
      console.log("[v0] Loading bulk orders for agent:", id)
      const response = await fetch(`/api/agent/bulk-orders/status?agent_id=${id}`)
      if (!response.ok) {
        console.error("[v0] Failed to fetch orders, status:", response.status)
        throw new Error("Failed to fetch orders")
      }
      const data = await response.json()
      console.log("[v0] Bulk orders loaded:", data?.length || 0, "items")
      setOrders(Array.isArray(data) ? data : [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error loading orders:", error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const deleteBulkOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this bulk order? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch("/api/agent/bulk-orders/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete")
      }

      if (agentId) await loadOrders(agentId)
      alert("Bulk order deleted successfully")
    } catch (error) {
      console.error("Error deleting bulk order:", error)
      alert("Failed to delete bulk order: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "pending_admin_review":
        return "bg-amber-100 text-amber-800 border border-amber-300"
      case "processing":
        return "bg-purple-100 text-purple-800 border border-purple-300"
      case "completed":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300"
      case "canceled":
        return "bg-red-100 text-red-800 border border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300"
    }
  }

  const handleRefresh = () => {
    if (agentId) loadOrders(agentId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 sm:py-8">
        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-emerald-600 border-t-transparent mr-2 flex-shrink-0"></div>
        <span className="text-xs sm:text-sm text-emerald-600">Loading orders...</span>
      </div>
    )
  }

  return (
    <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg w-full overflow-hidden">
      <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg text-emerald-800 flex items-center gap-2 truncate">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Bulk Order Status</span>
            </CardTitle>
            <CardDescription className="text-emerald-600 text-xs sm:text-sm mt-1">
              Track your submitted bulk orders
            </CardDescription>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex-shrink-0 text-xs sm:text-sm bg-transparent"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
        {orders.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <Package className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">No bulk orders submitted yet</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-4 border border-emerald-100 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                      {order.source.toUpperCase()} Order
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 truncate">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} text-xs whitespace-nowrap flex-shrink-0`}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm bg-gradient-to-r from-gray-50 to-white rounded p-2 border border-gray-100">
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Total</p>
                    <p className="font-bold text-gray-900">{order.row_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-600 text-xs">Accepted</p>
                    <p className="font-bold text-emerald-700">✓ {order.accepted_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-red-600 text-xs">Rejected</p>
                    <p className="font-bold text-red-700">✗ {order.rejected_count}</p>
                  </div>
                </div>

                <div className="flex gap-1 sm:gap-2 justify-end">
                  <Button
                    onClick={() => deleteBulkOrder(order.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8 px-2 sm:px-3"
                    disabled={order.status !== "pending" && order.status !== "pending_admin_review"}
                    title={
                      order.status !== "pending" && order.status !== "pending_admin_review"
                        ? "Can only delete pending orders"
                        : ""
                    }
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

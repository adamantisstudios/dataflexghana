"use client"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabase, type DataOrder } from "@/lib/supabase"
import { enhancedSupabase } from "@/lib/supabase-enhanced"
import { useOptimisticOrderUpdate } from "@/hooks/use-optimistic-updates"
import { FloatingRefreshButton } from "@/components/admin/FloatingRefreshButton"
import { realtimeManager } from "@/lib/realtime-manager"
import { connectionManager } from "@/lib/connection-manager"
import { getStoredAdmin } from "@/lib/auth"
import OrderCleanupDialog from "@/components/admin/OrderCleanupDialog"
import { safeCommissionDisplay } from "@/lib/commission-calculator"
import {
  Search,
  Filter,
  MessageCircle,
  Trash2,
  Download,
  Wallet,
  CreditCard,
  AlertCircle,
  Wifi,
  WifiOff,
  CheckCircle2,
  Database,
} from "lucide-react"
import { getBundleDisplayName } from "@/lib/bundle-data-handler"

interface OrdersTabProps {
  getCachedData: () => DataOrder[] | undefined
  setCachedData: (data: DataOrder[]) => void
}

export default function OrdersTab({ getCachedData, setCachedData }: OrdersTabProps) {
  const [dataOrders, setDataOrders] = useState<DataOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<DataOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [orderSearchTerm, setOrderSearchTerm] = useState("")
  const [ordersFilterAdmin, setOrdersFilterAdmin] = useState("All Orders")
  const [currentOrdersPage, setCurrentOrdersPage] = useState(1)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DataOrder | null>(null)
  const [adminMessage, setAdminMessage] = useState("")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState(connectionManager.getConnectionStatus())
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [showCleanupDialog, setShowCleanupDialog] = useState(false)

  const itemsPerPage = 12
  const ordersListRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null)
  const connectionUnsubscribeRef = useRef<(() => void) | null>(null)

  // Use optimistic updates hook
  const { updateOrderStatus, isUpdating } = useOptimisticOrderUpdate()

  const scrollToTop = () => {
    ordersListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // Memoized filter function for better performance
  const filterOrders = useCallback((orders: DataOrder[], searchTerm: string, statusFilter: string) => {
    let filtered = orders

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.agents?.full_name?.toLowerCase().includes(lowerSearchTerm) ||
          order.recipient_phone?.includes(searchTerm) ||
          order.payment_reference?.toLowerCase().includes(lowerSearchTerm) ||
          order.data_bundles?.name?.toLowerCase().includes(lowerSearchTerm),
      )
    }

    // Apply status filter
    if (statusFilter !== "All Orders") {
      filtered = filtered.filter((order) => {
        switch (statusFilter) {
          case "Pending":
            return order.status === "pending"
          case "Processing":
            return order.status === "processing"
          case "Completed":
            return order.status === "completed"
          case "Canceled":
            return order.status === "canceled"
          default:
            return true
        }
      })
    }

    return filtered
  }, [])

  // Memoized filtered orders
  const memoizedFilteredOrders = useMemo(() => {
    return filterOrders(dataOrders, orderSearchTerm, ordersFilterAdmin)
  }, [dataOrders, orderSearchTerm, ordersFilterAdmin, filterOrders])

  // Update filtered orders when memoized result changes
  useEffect(() => {
    setFilteredOrders(memoizedFilteredOrders)
  }, [memoizedFilteredOrders])

  // Setup real-time subscription for order updates
  const setupRealtimeSubscription = useCallback(() => {
    console.log("Setting up real-time subscription for data_orders...")

    const unsubscribe = realtimeManager.subscribe("orders_tab_subscription", "data_orders", (payload) => {
      console.log("Real-time order update received:", payload)

      if (payload.eventType === "INSERT") {
        const newOrder = payload.new as DataOrder
        setDataOrders((prev) => {
          const updated = [newOrder, ...prev]
          setCachedData(updated)
          return updated
        })
      } else if (payload.eventType === "UPDATE") {
        const updatedOrder = payload.new as DataOrder
        setDataOrders((prev) => {
          const updated = prev.map((order) => (order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order))
          setCachedData(updated)
          return updated
        })
      } else if (payload.eventType === "DELETE") {
        const deletedOrder = payload.old as DataOrder
        setDataOrders((prev) => {
          const updated = prev.filter((order) => order.id !== deletedOrder.id)
          setCachedData(updated)
          return updated
        })
      }

      setRealtimeConnected(true)
    })

    realtimeUnsubscribeRef.current = unsubscribe
    setRealtimeConnected(true)
  }, [setCachedData])

  // Setup connection monitoring
  useEffect(() => {
    const unsubscribe = connectionManager.addConnectionListener((status) => {
      setConnectionStatus(status)

      // Update connection error based on status
      if (!status.isOnline) {
        setConnectionError("No internet connection. Please check your network.")
      } else if (!status.isConnected) {
        setConnectionError("Database connection lost. Attempting to reconnect...")
      } else if (!status.isSessionValid) {
        setConnectionError("Session expired. Refreshing authentication...")
      } else {
        setConnectionError(null)
      }
    })

    connectionUnsubscribeRef.current = unsubscribe
    return unsubscribe
  }, [])

  // Enhanced data loading with connection handling
  const loadOrders = useCallback(
    async (forceRefresh = false) => {
      if (loadingRef.current) return
      loadingRef.current = true
      setLoading(true)

      try {
        // Check cache first unless forcing refresh
        if (!forceRefresh) {
          const cachedData = getCachedData()
          if (cachedData && cachedData.length > 0) {
            setDataOrders(cachedData)
            setLoading(false)
            loadingRef.current = false
            return
          }
        }

        // Clear any previous connection errors
        setConnectionError(null)

        let data, error

        try {
          // Try enhanced Supabase client first
          let result
          try {
            // First attempt: query with admin_hidden filter
            result = await enhancedSupabase
              .from("data_orders")
              .select(
                `*, agents (full_name, phone_number), data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price, commission_rate, validity_days)`,
              )
              .or("admin_hidden.is.null,admin_hidden.eq.false") // Only show orders that are not hidden from admin view
              .order("created_at", { ascending: false })
          } catch (columnError) {
            // If admin_hidden column doesn't exist, fall back to query without it
            console.warn("admin_hidden column not found, querying without filter:", columnError)
            result = await enhancedSupabase
              .from("data_orders")
              .select(
                `*, agents (full_name, phone_number), data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price, commission_rate, validity_days)`,
              )
              .order("created_at", { ascending: false })
          }

          data = result.data
          error = result.error
        } catch (enhancedError) {
          console.warn("Enhanced Supabase client failed, falling back to regular client:", enhancedError)

          // Fallback to regular supabase client
          let result
          try {
            // First attempt: query with admin_hidden filter
            result = await supabase
              .from("data_orders")
              .select(
                `*, agents (full_name, phone_number), data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price, commission_rate, validity_days)`,
              )
              .or("admin_hidden.is.null,admin_hidden.eq.false")
              .order("created_at", { ascending: false })
          } catch (columnError) {
            // If admin_hidden column doesn't exist, fall back to query without it
            console.warn("admin_hidden column not found in fallback, querying without filter:", columnError)
            result = await supabase
              .from("data_orders")
              .select(
                `*, agents (full_name, phone_number), data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price, commission_rate, validity_days)`,
              )
              .order("created_at", { ascending: false })
          }

          data = result.data
          error = result.error
        }

        if (error) {
          throw error
        }

        const ordersData = data || []
        console.log(`✅ Successfully loaded ${ordersData.length} data orders`)

        const processedOrders = ordersData.map((order) => ({
          ...order,
          // Ensure commission_amount is properly calculated if missing
          commission_amount:
            order.commission_amount ||
            (order.data_bundles?.price && order.data_bundles?.commission_rate
              ? order.data_bundles.price * order.data_bundles.commission_rate
              : 0),
        }))

        setDataOrders(processedOrders)
        setCachedData(processedOrders)
        setLastRefresh(new Date())

        // Clear connection error on successful load
        setConnectionError(null)
      } catch (error: any) {
        // Enhanced error logging with detailed information
        const errorMessage = error?.message || "Unknown error occurred"
        const errorDetails = {
          message: errorMessage,
          originalError: error?.originalError || error,
          originalMessage: error?.originalMessage,
          code: error?.code || error?.originalCode,
          details: error?.details,
          hint: error?.hint,
          cause: error?.cause,
          stack: error?.stack,
        }

        // Fix: Properly log the error details as a string instead of object
        console.error("Error loading data orders:", JSON.stringify(errorDetails, null, 2))

        // Set a user-friendly error message
        setConnectionError(`Failed to load orders: ${errorMessage}`)

        // Clear data on error
        setDataOrders([])
        setCachedData([])
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    },
    [getCachedData, setCachedData],
  )

  // Initial load and setup
  useEffect(() => {
    loadOrders()
    setupRealtimeSubscription()

    // Cleanup function
    return () => {
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current()
      }
      if (connectionUnsubscribeRef.current) {
        connectionUnsubscribeRef.current()
      }
    }
  }, [loadOrders, setupRealtimeSubscription])

  // CRITICAL FIX: Enhanced order status update with comprehensive validation
  const handleUpdateOrderStatus = useCallback(
    async (orderId: string, status: string) => {
      try {
        // CRITICAL FIX: Enhanced input validation
        if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
          setConnectionError("Invalid order ID provided")
          return
        }

        if (!status || typeof status !== "string" || status.trim() === "") {
          setConnectionError("Invalid status provided")
          return
        }

        // Validate status value against allowed values
        const validStatuses = ["pending", "processing", "completed", "canceled", "cancelled"]
        const normalizedStatus = status.toLowerCase().trim()
        if (!validStatuses.includes(normalizedStatus)) {
          setConnectionError(`Invalid status: "${status}". Must be one of: ${validStatuses.join(", ")}`)
          return
        }

        // Check if admin is logged in using localStorage-based authentication
        const admin = getStoredAdmin()
        if (!admin) {
          setConnectionError("Session expired. Please refresh the page.")
          return
        }

        // Find the order to validate it exists and check current status
        const orderToUpdate = dataOrders.find((order) => order && order.id === orderId)
        if (!orderToUpdate) {
          setConnectionError("Order not found. The page will be refreshed.")
          setTimeout(() => window.location.reload(), 2000)
          return
        }

        // CRITICAL FIX: Check if status is actually changing
        if (orderToUpdate.status === normalizedStatus) {
          console.log(`Order ${orderId} already has status "${normalizedStatus}", no update needed`)
          return // No need to update if status is the same
        }

        // CRITICAL FIX: Validate business logic for status transitions
        const currentStatus = orderToUpdate.status?.toLowerCase()
        if (currentStatus === "completed" && normalizedStatus !== "completed") {
          setConnectionError("Cannot change status of completed orders")
          return
        }

        if (currentStatus === "canceled" && normalizedStatus !== "canceled") {
          setConnectionError("Cannot change status of canceled orders")
          return
        }

        // Clear any previous connection errors
        setConnectionError(null)

        console.log(`Updating order ${orderId} from "${currentStatus}" to "${normalizedStatus}"`)

        // CRITICAL FIX: Use the enhanced optimistic update with better error handling
        await updateOrderStatus(orderId, normalizedStatus, dataOrders, setDataOrders, setCachedData)

        if (normalizedStatus === "completed" && currentStatus !== "completed") {
          console.log(`Order ${orderId} completed - commission should be automatically processed`)

          // Refresh the orders to get updated commission data
          setTimeout(() => {
            loadOrders()
          }, 1000)
        }

        console.log(`Successfully updated order ${orderId} to status "${normalizedStatus}"`)
      } catch (error: any) {
        console.error("Order status update failed:", error)

        // CRITICAL FIX: Enhanced error handling with specific error types
        let errorMessage = "Failed to update order status. Please try again."

        if (error?.message) {
          const msg = error.message.toLowerCase()
          if (msg.includes("network") || msg.includes("connection") || msg.includes("timeout")) {
            errorMessage = "Network connection issue. Please check your internet and try again."
          } else if (msg.includes("permission") || msg.includes("unauthorized") || msg.includes("access denied")) {
            errorMessage = "You do not have permission to update this order. Please contact an administrator."
          } else if (msg.includes("validation") || msg.includes("constraint") || msg.includes("check")) {
            errorMessage = "Order validation failed. Please refresh the page and try again."
          } else if (msg.includes("not found") || msg.includes("deleted") || msg.includes("pgrst116")) {
            errorMessage = "This order no longer exists. The page will be refreshed."
            setTimeout(() => window.location.reload(), 2000)
          } else if (msg.includes("duplicate") || msg.includes("unique")) {
            errorMessage = "Conflicting update detected. Please refresh the page and try again."
          } else if (msg.includes("transaction validation failed")) {
            errorMessage = "Transaction validation failed. Please verify the order details and try again."
          } else {
            errorMessage = `Update failed: ${error.message}`
          }
        }

        setConnectionError(errorMessage)

        // CRITICAL FIX: Auto-clear error message after a delay
        setTimeout(() => {
          setConnectionError(null)
        }, 5000)
      }
    },
    [dataOrders, setDataOrders, setCachedData, updateOrderStatus, loadOrders],
  )

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this data order? This action cannot be undone.")) return

    try {
      // Check if admin is logged in using localStorage-based authentication
      const admin = getStoredAdmin()
      if (!admin) {
        setConnectionError("Session expired. Please refresh the page.")
        return
      }

      let error

      try {
        // Try enhanced Supabase client first
        const result = await enhancedSupabase.from("data_orders").delete().eq("id", orderId)
        error = result.error
      } catch (enhancedError) {
        console.warn("Enhanced Supabase client failed for delete, falling back to regular client:", enhancedError)

        // Fallback to regular supabase client
        const result = await supabase.from("data_orders").delete().eq("id", orderId)
        error = result.error
      }

      if (error) throw error

      const updatedOrders = dataOrders.filter((order) => order.id !== orderId)
      setDataOrders(updatedOrders)
      setCachedData(updatedOrders)
      alert("Data order deleted successfully!")
    } catch (error) {
      console.error("Error deleting data order:", error)
      alert("Failed to delete data order.")
    }
  }

  const openMessageDialog = (order: DataOrder) => {
    setSelectedOrder(order)
    setAdminMessage(order.admin_message || "")
    setShowMessageDialog(true)
  }

  const handleSendMessage = async () => {
    if (!selectedOrder || !adminMessage.trim()) return

    try {
      // Check if admin is logged in using localStorage-based authentication
      const admin = getStoredAdmin()
      if (!admin) {
        setConnectionError("Session expired. Please refresh the page.")
        return
      }

      let error

      try {
        // Try enhanced Supabase client first
        const result = await enhancedSupabase
          .from("data_orders")
          .update({ admin_message: adminMessage.trim() })
          .eq("id", selectedOrder.id)

        error = result.error
      } catch (enhancedError) {
        console.warn(
          "Enhanced Supabase client failed for message update, falling back to regular client:",
          enhancedError,
        )

        // Fallback to regular supabase client
        const result = await supabase
          .from("data_orders")
          .update({ admin_message: adminMessage.trim() })
          .eq("id", selectedOrder.id)

        error = result.error
      }

      if (error) throw error

      alert("Message sent successfully!")

      const updatedOrders = dataOrders.map((order) =>
        order.id === selectedOrder.id ? { ...order, admin_message: adminMessage.trim() } : order,
      )
      setDataOrders(updatedOrders)
      setCachedData(updatedOrders)
      setShowMessageDialog(false)
      setAdminMessage("")
      setSelectedOrder(null)
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  // Enhanced refresh function that restores all connections
  const handleCompleteRefresh = useCallback(async () => {
    console.log("Performing complete refresh...")

    try {
      // Force reconnect all systems
      await connectionManager.forceReconnect()

      // Reload data
      await loadOrders(true)

      // Reconnect realtime subscriptions
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current()
      }
      setupRealtimeSubscription()

      setLastRefresh(new Date())
      console.log("Complete refresh successful")
    } catch (error) {
      console.error("Complete refresh failed:", error)
    }
  }, [loadOrders, setupRealtimeSubscription])

  // Handle orders updated after cleanup
  const handleOrdersUpdated = useCallback(() => {
    loadOrders(true)
  }, [loadOrders])

  const downloadDataOrdersCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No data to download")
      return
    }

    const headers = [
      "Date",
      "Agent",
      "Bundle Name",
      "Provider",
      "Size (GB)",
      "Price (GH₵)",
      "Recipient Phone",
      "Payment Method",
      "Payment Reference",
      "Commission (GH₵)",
      "Status",
      "Commission Paid",
    ]

    const csvData = filteredOrders.map((order) => [
      new Date(order.created_at).toLocaleDateString(),
      order.agents?.full_name || "",
      order.data_bundles?.name || "",
      order.data_bundles?.provider || "",
      order.data_bundles?.size_gb || "",
      order.data_bundles?.price?.toFixed(2) || "",
      order.recipient_phone || "",
      order.payment_method === "wallet" ? "Wallet" : "Manual",
      order.payment_reference || "",
      safeCommissionDisplay(order.commission_amount).toFixed(2),
      order.status || "",
      order.commission_paid ? "Yes" : "No",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `admin-data-orders-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPaginatedData = (data: any[], currentPage: number) => {
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

    return (
      <div className="flex justify-center mt-4 sm:mt-6">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (currentPage > 1) {
                    onPageChange(currentPage - 1)
                    scrollToTop()
                  }
                }}
                className={`${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => {
                      onPageChange(pageNum)
                      scrollToTop()
                    }}
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
                    scrollToTop()
                  }
                }}
                className={`${
                  currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Enhanced Loading Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Enhanced Loading Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-full sm:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Enhanced Loading Cards */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
                  <div className="h-10 bg-gray-200 rounded w-full sm:w-40 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-full sm:w-32 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-full sm:w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Status Message */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
            <span className="font-medium">Loading data orders...</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest order information</p>
        </div>
      </div>
    )
  }

  // Enhanced Empty State with Error Recovery
  if (!loading && filteredOrders.length === 0 && !connectionError) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-emerald-800">
              <span className="hidden sm:inline">Data Order Management</span>
              <span className="sm:hidden">Orders</span>
            </h2>
            <div className="flex items-center gap-2">
              {realtimeConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:inline">Live Updates</span>
                  <span className="text-xs font-medium sm:hidden">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:inline">Reconnecting...</span>
                  <span className="text-xs font-medium sm:hidden">Offline</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowCleanupDialog(true)}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 bg-transparent w-full sm:w-auto"
            >
              <Database className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Cleanup Orders</span>
              <span className="sm:hidden">Cleanup</span>
            </Button>
            <Button
              onClick={downloadDataOrdersCSV}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent w-full sm:w-auto"
              disabled
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Download CSV</span>
              <span className="sm:hidden">Download CSV</span>
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <Select value={ordersFilterAdmin} onValueChange={setOrdersFilterAdmin}>
            <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter Orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Orders">All Orders</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <Database className="h-12 w-12 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {orderSearchTerm || ordersFilterAdmin !== "All Orders" ? "No matching orders found" : "No data orders yet"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {orderSearchTerm || ordersFilterAdmin !== "All Orders"
              ? "Try adjusting your search terms or filters to find what you're looking for."
              : "Data orders will appear here once agents start placing orders. The system is ready and waiting for new orders."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {(orderSearchTerm || ordersFilterAdmin !== "All Orders") && (
              <Button
                onClick={() => {
                  setOrderSearchTerm("")
                  setOrdersFilterAdmin("All Orders")
                }}
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Clear Filters
              </Button>
            )}
            <Button onClick={() => loadOrders(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Refresh Orders
            </Button>
          </div>
        </div>

        {/* Enhanced Floating Refresh Button */}
        <FloatingRefreshButton onRefresh={handleCompleteRefresh} showConnectionStatus={true} />

        {/* Order Cleanup Dialog */}
        <OrderCleanupDialog
          open={showCleanupDialog}
          onOpenChange={setShowCleanupDialog}
          orders={dataOrders}
          onOrdersUpdated={handleOrdersUpdated}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 relative">
      {/* Connection Status Banner */}
      {connectionError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{connectionError}</span>
          </div>
        </div>
      )}

      {/* Real-time Status Indicator */}
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-emerald-800">
              <span className="hidden sm:inline">Data Order Management</span>
              <span className="sm:hidden">Orders</span>
            </h2>
            {isUpdating && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Updating...
              </Badge>
            )}
            <div className="flex items-center gap-2">
              {realtimeConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:inline">Live Updates</span>
                  <span className="text-xs font-medium sm:hidden">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs font-medium hidden sm:inline">Reconnecting...</span>
                  <span className="text-xs font-medium sm:hidden">Offline</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowCleanupDialog(true)}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-700 hover:bg-red-50 bg-transparent w-full sm:w-auto"
            >
              <Database className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Cleanup Orders</span>
              <span className="sm:hidden">Cleanup</span>
            </Button>
            <Button
              onClick={downloadDataOrdersCSV}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Download CSV</span>
              <span className="sm:hidden">Download CSV</span>
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <Select value={ordersFilterAdmin} onValueChange={setOrdersFilterAdmin}>
            <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter Orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Orders">All Orders</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div ref={ordersListRef} className="space-y-4">
        {getPaginatedData(filteredOrders, currentOrdersPage).map((order) => (
          <Card
            key={order.id}
            className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-emerald-800">{getBundleDisplayName(order.data_bundles)}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      <Badge
                        variant="outline"
                        className={
                          order.payment_method === "wallet"
                            ? "border-purple-200 text-purple-700 bg-purple-50"
                            : "border-blue-200 text-blue-700 bg-blue-50"
                        }
                      >
                        {order.payment_method === "wallet" ? (
                          <Wallet className="h-3 w-3 mr-1" />
                        ) : (
                          <CreditCard className="h-3 w-3 mr-1" />
                        )}
                        {order.payment_method === "wallet" ? "Wallet" : "Manual"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p className="text-emerald-600">
                      <span className="font-medium">Agent:</span> {order.agents?.full_name}
                    </p>
                    <p className="text-emerald-600">
                      <span className="font-medium">To:</span> {order.recipient_phone}
                    </p>
                    <p className="text-emerald-600">
                      <span className="font-medium">Reference:</span> {order.payment_reference}
                    </p>
                    <p className="text-xs text-emerald-500">
                      <span className="font-medium">Ordered:</span> {formatTimestamp(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">
                        GH₵ {order.data_bundles?.price?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-xs text-emerald-600">
                        Commission: GH₵ {safeCommissionDisplay(order.commission_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-full sm:w-40 border-emerald-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openMessageDialog(order)}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {order.admin_message ? "Edit Message" : "Send Message"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteOrder(order.id)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PaginationControls
        currentPage={currentOrdersPage}
        totalPages={getTotalPages(filteredOrders.length)}
        onPageChange={setCurrentOrdersPage}
      />

      {/* Enhanced Floating Refresh Button */}
      <FloatingRefreshButton onRefresh={handleCompleteRefresh} showConnectionStatus={true} />

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>Send Message to Agent</DialogTitle>
            <DialogDescription>
              Send a message to the agent regarding this order. This message will be visible to the agent in their
              dashboard.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="orderId" className="text-right">
                  Order ID
                </Label>
                <Input type="text" id="orderId" value={selectedOrder.id} className="col-span-3" disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message" className="text-right">
                  Message
                </Label>
                <Textarea
                  id="message"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleSendMessage}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Cleanup Dialog */}
      <OrderCleanupDialog
        open={showCleanupDialog}
        onOpenChange={setShowCleanupDialog}
        orders={dataOrders}
        onOrdersUpdated={handleOrdersUpdated}
      />
    </div>
  )
}

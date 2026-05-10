"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  WifiOff,
  Database,
  Copy,
  Check,
  MapPin,
  User,
  Hash,
  Calendar,
  Package,
  TrendingUp,
} from "lucide-react"
import { getBundleDisplayName } from "@/lib/bundle-data-handler"
import { toast } from "sonner"

interface OrdersTabProps {
  getCachedData?: () => DataOrder[] | undefined
  setCachedData?: (data: DataOrder[]) => void
}

const ORDERS_PER_PAGE = 12
const INITIAL_PAGES_TO_LOAD = 3
const POLLING_INTERVAL_MS = 3 * 60 * 1000

export default function OrdersTab({ getCachedData, setCachedData }: OrdersTabProps = {}) {
  // ---------- State ----------
  const [allOrders, setAllOrders] = useState<DataOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<DataOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [orderSearchTerm, setOrderSearchTerm] = useState("")
  const [combinedOrderFilter, setCombinedOrderFilter] = useState("All Orders")
  const [currentPage, setCurrentPage] = useState(1)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DataOrder | null>(null)
  const [adminMessage, setAdminMessage] = useState(
    "We cannot verify this manual order or find proof of payment. Check and ensure you pay manually to 0557943392. Make sure to also use the payment ID or reference number to ensure your order is processed. If you have paid but our system did not detect it, send proof of payment to 0242799990. Thank You."
  )
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showCleanupDialog, setShowCleanupDialog] = useState(false)
  const [copiedPhoneNumbers, setCopiedPhoneNumbers] = useState<Set<string>>(new Set())
  const [copiedReferenceCodes, setCopiedReferenceCodes] = useState<Set<string>>(new Set())
  const [totalFilteredCount, setTotalFilteredCount] = useState<number | null>(null)
  const [loadingPage, setLoadingPage] = useState<number | null>(null)

  const ordersListRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fetchedPagesRef = useRef<Set<number>>(new Set())
  const { updateOrderStatus, isUpdating } = useOptimisticOrderUpdate()

  // ---------- Scroll to top on page change ----------
  useEffect(() => {
    if (ordersListRef.current) {
      ordersListRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [currentPage])

  // ---------- Helper: detect if filters are active ----------
  const isFilterActive = orderSearchTerm.trim() !== "" || combinedOrderFilter !== "All Orders"

  // ---------- Helper: build filter query ----------
  const buildFilteredQuery = useCallback(async (page: number, searchTerm: string, combinedFilter: string) => {
    const start = (page - 1) * ORDERS_PER_PAGE
    const end = start + ORDERS_PER_PAGE - 1

    let query = enhancedSupabase
      .from("data_orders")
      .select(
        `*, agents (full_name, phone_number), data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price, commission_rate, validity_days)`,
        { count: "exact" }
      )
      .or("admin_hidden.is.null,admin_hidden.eq.false")
      .order("created_at", { ascending: false })

    if (combinedFilter !== "All Orders") {
      if (combinedFilter === "Manual Orders") {
        query = query.eq("payment_method", "manual")
      } else if (combinedFilter === "Wallet Orders") {
        query = query.eq("payment_method", "wallet")
      } else if (["Pending", "Processing", "Completed", "Canceled"].includes(combinedFilter)) {
        const statusMap: Record<string, string> = {
          Pending: "pending",
          Processing: "processing",
          Completed: "completed",
          Canceled: "canceled",
        }
        query = query.eq("status", statusMap[combinedFilter])
      }
    }

    if (searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`
      query = query.or(
        `agents.full_name.ilike.${term},recipient_phone.ilike.${term},payment_reference.ilike.${term},data_bundles.name.ilike.${term}`
      )
    }

    const { data, error, count } = await query.range(start, end)
    if (error) throw error
    return { data: data || [], count: count || 0 }
  }, [])

  // ---------- Load filtered data (server-side) ----------
  const loadFilteredPage = useCallback(async (page: number) => {
    setLoadingPage(page)
    try {
      const { data, count } = await buildFilteredQuery(page, orderSearchTerm, combinedOrderFilter)
      const processed = data.map(order => ({
        ...order,
        commission_amount:
          order.commission_amount ||
          (order.data_bundles?.price && order.data_bundles?.commission_rate
            ? order.data_bundles.price * order.data_bundles.commission_rate
            : 0),
      }))
      setFilteredOrders(processed)
      setTotalFilteredCount(count)
    } catch (err: any) {
      console.error("Filtered load error", err)
      setConnectionError(`Filter failed: ${err.message}`)
      setFilteredOrders([])
      setTotalFilteredCount(0)
    } finally {
      setLoadingPage(null)
    }
  }, [orderSearchTerm, combinedOrderFilter, buildFilteredQuery])

  // ---------- Load lazy pages (unfiltered) ----------
  const fetchPageFromDb = useCallback(async (page: number): Promise<DataOrder[]> => {
    const start = (page - 1) * ORDERS_PER_PAGE
    const end = start + ORDERS_PER_PAGE - 1

    let data, error
    try {
      let result
      try {
        result = await enhancedSupabase
          .from("data_orders")
          .select(
            `*, agents (full_name, phone_number), data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price, commission_rate, validity_days)`
          )
          .or("admin_hidden.is.null,admin_hidden.eq.false")
          .order("created_at", { ascending: false })
          .range(start, end)
      } catch (colError) {
        result = await supabase
          .from("data_orders")
          .select(
            `*, agents (full_name, phone_number), data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price, commission_rate, validity_days)`
          )
          .or("admin_hidden.is.null,admin_hidden.eq.false")
          .order("created_at", { ascending: false })
          .range(start, end)
      }
      data = result.data
      error = result.error
    } catch (err) {
      const result = await supabase
        .from("data_orders")
        .select(
          `*, agents (full_name, phone_number), data_bundles!fk_data_orders_bundle_id (name, provider, size_gb, price, commission_rate, validity_days)`
        )
        .or("admin_hidden.is.null,admin_hidden.eq.false")
        .order("created_at", { ascending: false })
        .range(start, end)
      data = result.data
      error = result.error
    }

    if (error) throw error
    return (data || []).map(order => ({
      ...order,
      commission_amount:
        order.commission_amount ||
        (order.data_bundles?.price && order.data_bundles?.commission_rate
          ? order.data_bundles.price * order.data_bundles.commission_rate
          : 0),
    }))
  }, [])

  const loadInitialPages = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const pages = Array.from({ length: INITIAL_PAGES_TO_LOAD }, (_, i) => i + 1)
      const results = await Promise.all(pages.map(p => fetchPageFromDb(p)))
      const combined = results.flat()
      const unique = new Map<string, DataOrder>()
      combined.forEach(o => unique.set(o.id, o))
      const sorted = Array.from(unique.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setAllOrders(sorted)
      if (setCachedData) setCachedData(sorted)
      pages.forEach(p => fetchedPagesRef.current.add(p))
    } catch (err: any) {
      setConnectionError(`Failed to load: ${err.message}`)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [fetchPageFromDb, setCachedData])

  const loadPage = useCallback(async (page: number) => {
    if (fetchedPagesRef.current.has(page)) return
    setLoadingPage(page)
    try {
      const newOrders = await fetchPageFromDb(page)
      setAllOrders(prev => {
        const map = new Map<string, DataOrder>()
        prev.forEach(o => map.set(o.id, o))
        newOrders.forEach(o => map.set(o.id, o))
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        if (setCachedData) setCachedData(merged)
        return merged
      })
      fetchedPagesRef.current.add(page)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPage(null)
    }
  }, [fetchPageFromDb, setCachedData])

  // Polling for unfiltered mode
  const refreshCurrentPage = useCallback(async () => {
    if (isFilterActive) return
    if (!fetchedPagesRef.current.has(currentPage)) return
    try {
      const fresh = await fetchPageFromDb(currentPage)
      setAllOrders(prev => {
        const map = new Map<string, DataOrder>()
        prev.forEach(o => map.set(o.id, o))
        fresh.forEach(o => map.set(o.id, o))
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        if (setCachedData) setCachedData(merged)
        return merged
      })
      setLastRefresh(new Date())
    } catch (err) {}
  }, [currentPage, fetchPageFromDb, setCachedData, isFilterActive])

  // Filter change -> load filtered data
  useEffect(() => {
    if (isFilterActive) {
      loadFilteredPage(1)
      setCurrentPage(1)
    } else {
      setFilteredOrders([])
      setTotalFilteredCount(null)
    }
  }, [orderSearchTerm, combinedOrderFilter, isFilterActive, loadFilteredPage])

  // Lazy loading for unfiltered mode
  useEffect(() => {
    if (!isFilterActive && !loading) {
      if (currentPage > INITIAL_PAGES_TO_LOAD && !fetchedPagesRef.current.has(currentPage)) {
        loadPage(currentPage)
      }
    }
  }, [currentPage, isFilterActive, loading, loadPage])

  // Initial load & polling
  useEffect(() => {
    loadInitialPages()
    pollingIntervalRef.current = setInterval(refreshCurrentPage, POLLING_INTERVAL_MS)
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [loadInitialPages, refreshCurrentPage])

  // Display orders
  const displayOrders = isFilterActive ? filteredOrders : allOrders
  const totalPages = isFilterActive
    ? Math.ceil((totalFilteredCount || 0) / ORDERS_PER_PAGE)
    : Math.ceil(displayOrders.length / ORDERS_PER_PAGE)
  const startIdx = (currentPage - 1) * ORDERS_PER_PAGE
  const paginatedOrders = displayOrders.slice(startIdx, startIdx + ORDERS_PER_PAGE)

  // ---------- CRUD operations ----------
  const handleUpdateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    const order = allOrders.find(o => o.id === orderId) || filteredOrders.find(o => o.id === orderId)
    if (!order) { toast.error("Order not found"); return }
    const current = order.status?.toLowerCase()
    const normalized = newStatus.toLowerCase()
    if (current === normalized) return
    if (current === "completed" || current === "canceled") {
      toast.error(`Cannot change status of ${current} orders`)
      return
    }
    try {
      await updateOrderStatus(orderId, normalized, allOrders, setAllOrders, setCachedData)
      if (isFilterActive) loadFilteredPage(currentPage)
      else refreshCurrentPage()
    } catch (err) {
      toast.error("Update failed")
    }
  }, [allOrders, filteredOrders, updateOrderStatus, setCachedData, isFilterActive, currentPage, loadFilteredPage, refreshCurrentPage])

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Delete this order permanently?")) return
    try {
      const admin = getStoredAdmin()
      if (!admin) throw new Error("Session expired")
      let error
      try {
        const res = await enhancedSupabase.from("data_orders").delete().eq("id", orderId)
        error = res.error
      } catch {
        const res = await supabase.from("data_orders").delete().eq("id", orderId)
        error = res.error
      }
      if (error) throw error
      setAllOrders(prev => prev.filter(o => o.id !== orderId))
      if (setCachedData) setCachedData(allOrders.filter(o => o.id !== orderId))
      if (isFilterActive) loadFilteredPage(currentPage)
      toast.success("Order deleted")
    } catch (err) {
      toast.error("Delete failed")
    }
  }

  const openMessageDialog = (order: DataOrder) => {
    setSelectedOrder(order)
    setAdminMessage(order.admin_message || "We cannot verify this manual order or find proof of payment. Check and ensure you pay manually to 0557943392. Make sure to also use the payment ID or reference number to ensure your order is processed. If you have paid but our system did not detect it, send proof of payment to 0242799990. Thank You.")
    setShowMessageDialog(true)
  }

  const handleSendMessage = async () => {
    if (!selectedOrder || !adminMessage.trim()) return
    try {
      const admin = getStoredAdmin()
      if (!admin) throw new Error("Session expired")
      let error
      try {
        const res = await enhancedSupabase
          .from("data_orders")
          .update({ admin_message: adminMessage.trim() })
          .eq("id", selectedOrder.id)
        error = res.error
      } catch {
        const res = await supabase
          .from("data_orders")
          .update({ admin_message: adminMessage.trim() })
          .eq("id", selectedOrder.id)
        error = res.error
      }
      if (error) throw error
      const updateOrders = (orders: DataOrder[]) =>
        orders.map(o => o.id === selectedOrder.id ? { ...o, admin_message: adminMessage.trim() } : o)
      setAllOrders(updateOrders)
      if (setCachedData) setCachedData(updateOrders(allOrders))
      if (isFilterActive) loadFilteredPage(currentPage)
      toast.success("Message sent")
      setShowMessageDialog(false)
      setSelectedOrder(null)
    } catch (err) {
      toast.error("Send failed")
    }
  }

  const handleCompleteRefresh = useCallback(async () => {
    fetchedPagesRef.current.clear()
    await loadInitialPages()
    if (isFilterActive) await loadFilteredPage(1)
    setLastRefresh(new Date())
    toast.success("Refreshed")
  }, [loadInitialPages, isFilterActive, loadFilteredPage])

  const handleOrdersUpdated = useCallback(() => handleCompleteRefresh(), [handleCompleteRefresh])

  const downloadDataOrdersCSV = () => {
    const ordersToExport = isFilterActive ? filteredOrders : allOrders
    if (ordersToExport.length === 0) { toast.error("No data"); return }
    const headers = ["Date","Agent","Bundle Name","Provider","Size","Price","Phone","Method","Reference","Commission","Status"]
    const rows = ordersToExport.map(o => [
      new Date(o.created_at).toLocaleDateString(),
      o.agents?.full_name || "",
      o.data_bundles?.name || "",
      o.data_bundles?.provider || "",
      o.data_bundles?.size_gb || "",
      o.data_bundles?.price?.toFixed(2) || "",
      o.recipient_phone || "",
      o.payment_method === "wallet" ? "Wallet" : "Manual",
      o.payment_reference || "",
      safeCommissionDisplay(o.commission_amount).toFixed(2),
      o.status || "",
    ])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded")
  }

  const formatTimestamp = (ts: string) => new Date(ts).toLocaleString()
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200"
      case "processing": return "bg-purple-100 text-purple-800 border-purple-200"
      case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "canceled": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100"
    }
  }

  // ---------- Copy with visual feedback ----------
  const handleCopyPhone = async (phone: string) => {
    await navigator.clipboard.writeText(phone)
    setCopiedPhoneNumbers(prev => new Set([...prev, phone]))
    toast.success("Phone copied")
    setTimeout(() => {
      setCopiedPhoneNumbers(prev => {
        const next = new Set(prev)
        next.delete(phone)
        return next
      })
    }, 2000)
  }

  const handleCopyRef = async (ref: string) => {
    await navigator.clipboard.writeText(ref)
    const newSet = new Set([...copiedReferenceCodes, ref])
    setCopiedReferenceCodes(newSet)
    localStorage.setItem("copiedOrderReferences", JSON.stringify(Array.from(newSet)))
    toast.success("Reference copied")
    setTimeout(() => {
      setCopiedReferenceCodes(prev => {
        const next = new Set(prev)
        next.delete(ref)
        return next
      })
    }, 2000)
  }

  const PaginationControls = () => {
    if (totalPages <= 1) return null
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)
    return (
      <div className="flex justify-center mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => currentPage > 1 && setCurrentPage(p => p-1)} className={currentPage <= 1 ? "opacity-50 pointer-events-none" : "cursor-pointer"} />
            </PaginationItem>
            {pages.map(p => (
              <PaginationItem key={p}>
                <PaginationLink onClick={() => setCurrentPage(p)} isActive={currentPage === p}>{p}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => currentPage < totalPages && setCurrentPage(p => p+1)} className={currentPage >= totalPages ? "opacity-50 pointer-events-none" : "cursor-pointer"} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  // Loading skeleton
  if (loading && allOrders.length === 0 && !isFilterActive) {
    return <div className="space-y-4"><div className="h-8 w-48 bg-gray-200 animate-pulse" /><div className="h-10 bg-gray-200 animate-pulse" /><div className="space-y-4">{[...Array(5)].map((_,i) => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded" />)}</div></div>
  }

  // Empty state
  if (!loading && paginatedOrders.length === 0 && !connectionError) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between"><h2 className="text-2xl font-bold text-emerald-800">Orders</h2><div className="flex gap-2"><Button variant="outline" onClick={() => setShowCleanupDialog(true)}>Cleanup</Button><Button variant="outline" onClick={downloadDataOrdersCSV}>CSV</Button></div></div>
        <Input placeholder="Search..." value={orderSearchTerm} onChange={e => setOrderSearchTerm(e.target.value)} />
        <Select value={combinedOrderFilter} onValueChange={setCombinedOrderFilter}><SelectTrigger><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All Orders">All</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Processing">Processing</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Canceled">Canceled</SelectItem><SelectItem value="Manual Orders">Manual</SelectItem><SelectItem value="Wallet Orders">Wallet</SelectItem></SelectContent></Select>
        <div className="text-center py-12"><Database className="h-12 w-12 mx-auto text-gray-300 mb-4" /><p>No orders match</p><Button onClick={() => { setOrderSearchTerm(""); setCombinedOrderFilter("All Orders") }}>Clear filters</Button></div>
      </div>
    )
  }

  // Main render
  return (
    <div className="space-y-4 relative">
      {connectionError && <div className="bg-amber-50 p-3 rounded text-amber-800"><AlertCircle className="h-5 w-5 inline mr-2" />{connectionError}</div>}

      <div className="text-right text-xs text-gray-400 flex justify-end items-center gap-2">
        <WifiOff className="h-3 w-3" /> {isFilterActive ? "Filter mode • real‑time results" : `Auto-refresh every 3 min • Last: ${lastRefresh.toLocaleTimeString()}`}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Data Order Management</h2>
        <div className="flex gap-2"><Button onClick={() => setShowCleanupDialog(true)} variant="outline" size="sm">Cleanup</Button><Button onClick={downloadDataOrdersCSV} variant="outline" size="sm">CSV</Button></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" /><Input placeholder="Search by agent, phone, reference or bundle..." value={orderSearchTerm} onChange={e => { setOrderSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10" /></div>
        <Select value={combinedOrderFilter} onValueChange={val => { setCombinedOrderFilter(val); setCurrentPage(1); }}>
          <SelectTrigger className="w-full sm:w-56"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All Orders">All Orders</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Canceled">Canceled</SelectItem>
            <SelectItem value="Manual Orders">Manual Orders</SelectItem>
            <SelectItem value="Wallet Orders">Wallet Orders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div ref={ordersListRef} className="space-y-4">
        {paginatedOrders.map(order => (
          <Card key={order.id} className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-emerald-800">{getBundleDisplayName(order.data_bundles)}</h3>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      <Badge variant="outline" className={order.payment_method === "wallet" ? "border-purple-200 text-purple-700 bg-purple-50" : "border-blue-200 text-blue-700 bg-blue-50"}>
                        {order.payment_method === "wallet" ? <Wallet className="h-3 w-3 mr-1" /> : <CreditCard className="h-3 w-3 mr-1" />}
                        {order.payment_method === "wallet" ? "Wallet" : "Manual"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p className="flex items-center gap-1 text-emerald-600"><User className="h-3 w-3" /><span className="font-medium">Agent:</span> {order.agents?.full_name}</p>
                    <p className="flex items-center gap-1 text-emerald-600"><MapPin className="h-3 w-3" /><span className="font-medium">Recipient:</span> {order.recipient_phone}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyPhone(order.recipient_phone)}
                        className="h-7 w-7 p-0 ml-1"
                      >
                        {copiedPhoneNumbers.has(order.recipient_phone) ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </p>
                    <p className="flex items-center gap-1 text-emerald-600"><Hash className="h-3 w-3" /><span className="font-medium">Reference:</span> {order.payment_reference}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyRef(order.payment_reference)}
                        className="h-7 w-7 p-0 ml-1"
                      >
                        {copiedReferenceCodes.has(order.payment_reference) ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </p>
                    <p className="flex items-center gap-1 text-xs text-emerald-500"><Calendar className="h-3 w-3" /><span className="font-medium">Ordered:</span> {formatTimestamp(order.created_at)}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      {/* Cedi sign only, no DollarSign icon */}
                      <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                        GH₵ {order.data_bundles?.price?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Commission: GH₵ {safeCommissionDisplay(order.commission_amount).toFixed(2)}
                      </p>
                    </div>
                    {order.data_bundles?.size_gb && (
                      <Badge variant="outline"><Package className="h-3 w-3 mr-1" />{order.data_bundles.size_gb} GB</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
                  <Select value={order.status} onValueChange={val => handleUpdateOrderStatus(order.id, val)} disabled={isUpdating}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="canceled">Canceled</SelectItem></SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => openMessageDialog(order)} className="border-blue-300 text-blue-600 w-full sm:w-auto">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {order.admin_message ? "Edit" : "Send"} Message
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteOrder(order.id)} className="w-full sm:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" />Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {loadingPage !== null && <div className="text-center py-4 text-gray-500">Loading page {loadingPage}...</div>}
      </div>

      <PaginationControls />
      <FloatingRefreshButton onRefresh={handleCompleteRefresh} showConnectionStatus={true} />

      {/* Note: increased Textarea rows to 8 for full message visibility */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>Visible to the agent.</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4 py-4">
              <Label>Order ID</Label>
              <Input value={selectedOrder.id} disabled />
              <Label>Message</Label>
              <Textarea
                value={adminMessage}
                onChange={e => setAdminMessage(e.target.value)}
                rows={8}
                className="resize-y"
              />
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleSendMessage}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OrderCleanupDialog
        open={showCleanupDialog}
        onOpenChange={setShowCleanupDialog}
        orders={allOrders}
        onOrdersUpdated={handleOrdersUpdated}
      />
    </div>
  )
}
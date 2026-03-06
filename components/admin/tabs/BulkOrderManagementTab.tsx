"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FileText, Eye, RefreshCw, Package, Loader2, Download, Copy, FileJson, User, Clock, CreditCard } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { realtimeManager } from "@/lib/realtime-manager"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// -------------------- Types (updated with all DB fields) --------------------
interface AFASubmission {
  id: string
  agent_id: string
  full_name: string
  phone_number: string
  ghana_card: string
  date_of_birth?: string
  location: string
  occupation?: string
  notes?: string
  status: string
  payment_required: boolean
  payment_pin?: string
  payment_verified: boolean
  payment_verified_at?: string
  payment_instructions?: string
  payment_code_sent?: boolean
  admin_processed_by?: string
  admin_processed_at?: string
  verified_by?: string
  created_at: string
  updated_at?: string
  agents?: {
    id: string
    full_name: string
    phone_number: string
  }
}

interface BulkOrder {
  id: string
  agent_id: string
  agent_name?: string
  agent_email?: string
  source: string
  row_count: number
  accepted_count: number
  rejected_count: number
  status: string
  payment_required: boolean
  payment_pin?: string
  payment_verified: boolean
  payment_verified_at?: string
  payment_instructions?: string
  admin_processed_by?: string
  admin_processed_at?: string
  verified_by?: string
  created_at: string
  updated_at?: string
  agents?: {
    id: string
    full_name: string
    phone_number: string
  }
}

interface BulkOrderItem {
  id: string
  bulk_order_id: string
  phone: string
  capacity_gb: number
  network: string
  status: string
  error_message?: string
  created_at: string
}

// -------------------- Helper Functions --------------------
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending_admin_review":
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

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// -------------------- Main Component --------------------
export default function BulkOrderManagementTab() {
  const [afaSubmissions, setAFASubmissions] = useState<AFASubmission[]>([])
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([])
  const [bulkOrderItems, setBulkOrderItems] = useState<BulkOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAFA, setSelectedAFA] = useState<AFASubmission | null>(null)
  const [selectedBulkOrder, setSelectedBulkOrder] = useState<BulkOrder | null>(null)
  const [showAFADetails, setShowAFADetails] = useState(false)
  const [showBulkDetails, setShowBulkDetails] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteConfirmType, setDeleteConfirmType] = useState<string | null>(null)
  const realtimeUnsubscribeRef = useRef<Map<string, () => void>>(new Map())

  useEffect(() => {
    loadData()

    const afaUnsubscribe = realtimeManager.subscribe("afa_admin_tab", "mtnafa_registrations", (payload) => {
      if (payload.eventType === "UPDATE") {
        setAFASubmissions((prev) =>
          prev.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item)),
        )
        if (selectedAFA?.id === payload.new.id) {
          setSelectedAFA({ ...selectedAFA, ...payload.new })
        }
      } else if (payload.eventType === "INSERT") {
        const newItem = { ...payload.new, status: payload.new.status || "pending_admin_review" }
        setAFASubmissions((prev) => [newItem, ...prev])
      } else if (payload.eventType === "DELETE") {
        setAFASubmissions((prev) => prev.filter((item) => item.id !== payload.old.id))
      }
    })

    const bulkUnsubscribe = realtimeManager.subscribe("bulk_admin_tab", "bulk_orders", (payload) => {
      if (payload.eventType === "UPDATE") {
        setBulkOrders((prev) => prev.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item)))
        if (selectedBulkOrder?.id === payload.new.id) {
          setSelectedBulkOrder({ ...selectedBulkOrder, ...payload.new })
        }
      } else if (payload.eventType === "INSERT") {
        const newItem = { ...payload.new, status: payload.new.status || "pending_admin_review" }
        setBulkOrders((prev) => [newItem, ...prev])
      } else if (payload.eventType === "DELETE") {
        setBulkOrders((prev) => prev.filter((item) => item.id !== payload.old.id))
      }
    })

    realtimeUnsubscribeRef.current.set("afa", afaUnsubscribe)
    realtimeUnsubscribeRef.current.set("bulk", bulkUnsubscribe)

    return () => {
      realtimeUnsubscribeRef.current.forEach((unsubscribe) => unsubscribe())
    }
  }, [selectedAFA, selectedBulkOrder])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/bulk-orders-data?status=${statusFilter}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch data")
      }
      const { afa: afaData, bulk: bulkData } = await response.json()

      const afaWithDefaults = (afaData || []).map((item: any) => ({
        ...item,
        status: item.status || "pending_admin_review",
      }))

      const bulkWithDefaults = (bulkData || []).map((item: any) => ({
        ...item,
        status: item.status || "pending_admin_review",
        agent_name: item.agents?.full_name || "Unknown Agent",
        agent_email: item.agents?.phone_number || "",
      }))

      setAFASubmissions(afaWithDefaults)
      setBulkOrders(bulkWithDefaults)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load data: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const loadBulkOrderItems = async (bulkOrderId: string) => {
    setItemsLoading(true)
    try {
      const { data, error } = await supabase
        .from("bulk_order_items")
        .select("*")
        .eq("bulk_order_id", bulkOrderId)
        .order("created_at", { ascending: false })
        .limit(500)
      if (error) throw error
      setBulkOrderItems(data || [])
    } catch (error) {
      console.error("Error loading bulk order items:", error)
      toast.error("Failed to load bulk order items: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setItemsLoading(false)
    }
  }

  const updateAFAStatus = async (afaId: string, newStatus: string) => {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/afa/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: afaId, status: newStatus }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update")
      }
      setAFASubmissions((prev) => prev.map((item) => (item.id === afaId ? { ...item, status: newStatus } : item)))
      if (selectedAFA?.id === afaId) {
        setSelectedAFA({ ...selectedAFA, status: newStatus })
      }
      toast.success("AFA status updated to " + newStatus)
    } catch (error) {
      console.error("Error updating AFA:", error)
      toast.error("Failed to update AFA registration")
    } finally {
      setProcessing(false)
    }
  }

  const updateBulkOrderStatus = async (bulkOrderId: string, newStatus: string) => {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/bulk-orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bulkOrderId, status: newStatus }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update")
      }
      setBulkOrders((prev) => prev.map((item) => (item.id === bulkOrderId ? { ...item, status: newStatus } : item)))
      if (selectedBulkOrder?.id === bulkOrderId) {
        setSelectedBulkOrder({ ...selectedBulkOrder, status: newStatus })
      }
      toast.success("Bulk order status updated to " + newStatus)
    } catch (error) {
      console.error("Error updating bulk order:", error)
      toast.error("Failed to update bulk order")
    } finally {
      setProcessing(false)
    }
  }

  const deleteAFARegistration = async (afaId: string) => {
    setDeleteConfirmId(afaId)
    setDeleteConfirmType("afa")
  }

  const confirmDeleteAFA = async (afaId: string) => {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/afa/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: afaId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete")
      }
      toast.success("AFA registration deleted successfully")
      setDeleteConfirmId(null)
      setDeleteConfirmType(null)
      await loadData()
    } catch (error) {
      console.error("Error deleting AFA:", error)
      toast.error("Failed to delete AFA registration: " + (error instanceof Error ? error.message : "Unknown error"))
      setDeleteConfirmId(null)
      setDeleteConfirmType(null)
    } finally {
      setProcessing(false)
    }
  }

  const verifyAFAPayment = async (afaId: string, verified: boolean) => {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/afa/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: afaId, verified }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to verify payment")
      }
      const result = await response.json()
      setAFASubmissions((prev) =>
        prev.map((item) =>
          item.id === afaId
            ? {
                ...item,
                payment_verified: verified,
                payment_verified_at: verified ? new Date().toISOString() : null,
              }
            : item,
        ),
      )
      if (selectedAFA?.id === afaId) {
        setSelectedAFA({
          ...selectedAFA,
          payment_verified: verified,
          payment_verified_at: verified ? new Date().toISOString() : null,
        })
      }
      toast.success(verified ? "Payment marked as verified" : "Payment verification removed")
    } catch (error) {
      console.error("Error verifying payment:", error)
      toast.error("Failed to verify payment: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setProcessing(false)
    }
  }

  const verifyBulkOrderPayment = async (orderId: string, verified: boolean) => {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/bulk-orders/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, verified }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to verify payment")
      }
      const result = await response.json()
      setBulkOrders((prev) =>
        prev.map((item) =>
          item.id === orderId
            ? {
                ...item,
                payment_verified: verified,
                payment_verified_at: verified ? new Date().toISOString() : null,
              }
            : item,
        ),
      )
      if (selectedBulkOrder?.id === orderId) {
        setSelectedBulkOrder({
          ...selectedBulkOrder,
          payment_verified: verified,
          payment_verified_at: verified ? new Date().toISOString() : null,
        })
      }
      toast.success(verified ? "Payment marked as verified" : "Payment verification removed")
    } catch (error) {
      console.error("Error verifying payment:", error)
      toast.error("Failed to verify payment: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setProcessing(false)
    }
  }

  const deleteBulkOrder = async (bulkOrderId: string) => {
    setDeleteConfirmId(bulkOrderId)
    setDeleteConfirmType("bulk")
  }

  const confirmDeleteBulkOrder = async (bulkOrderId: string) => {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/bulk-orders/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bulkOrderId }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete")
      }
      setBulkOrders((prev) => prev.filter((item) => item.id !== bulkOrderId))
      if (selectedBulkOrder?.id === bulkOrderId) {
        setSelectedBulkOrder(null)
      }
      toast.success("Bulk order deleted successfully")
      setDeleteConfirmId(null)
      setDeleteConfirmType(null)
    } catch (error) {
      console.error("Error deleting bulk order:", error)
      toast.error("Failed to delete bulk order: " + (error instanceof Error ? error.message : "Unknown error"))
      setDeleteConfirmId(null)
      setDeleteConfirmType(null)
    } finally {
      setProcessing(false)
    }
  }

  const downloadAFACSV = (submissions: AFASubmission[]) => {
    const headers = [
      "ID", "Agent", "Full Name", "Phone", "Ghana Card", "DOB", "Location", "Occupation",
      "Status", "Payment Required", "Payment PIN", "Payment Verified", "Payment Verified At",
      "Payment Code Sent", "Created At", "Notes"
    ]
    const rows = submissions.map((sub) => [
      sub.id,
      sub.agents?.full_name || sub.agent_id,
      sub.full_name,
      sub.phone_number,
      sub.ghana_card,
      sub.date_of_birth || "-",
      sub.location,
      sub.occupation || "-",
      sub.status,
      sub.payment_required ? "Yes" : "No",
      sub.payment_pin || "-",
      sub.payment_verified ? "Yes" : "No",
      sub.payment_verified_at ? formatDateTime(sub.payment_verified_at) : "-",
      sub.payment_code_sent ? "Yes" : "No",
      formatDateTime(sub.created_at),
      sub.notes || "-",
    ])
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `afa-registrations-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const downloadBulkOrdersCSV = (orders: BulkOrder[]) => {
    const headers = [
      "ID", "Agent", "Source", "Total Rows", "Accepted", "Rejected", "Status",
      "Payment Required", "Payment PIN", "Payment Verified", "Payment Verified At",
      "Created At"
    ]
    const rows = orders.map((order) => [
      order.id,
      order.agent_name || order.agents?.full_name || order.agent_id,
      order.source,
      order.row_count,
      order.accepted_count,
      order.rejected_count,
      order.status,
      order.payment_required ? "Yes" : "No",
      order.payment_pin || "-",
      order.payment_verified ? "Yes" : "No",
      order.payment_verified_at ? formatDateTime(order.payment_verified_at) : "-",
      formatDateTime(order.created_at),
    ])
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bulk-orders-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const copyBulkDataToClipboard = (items: BulkOrderItem[]) => {
    if (items.length === 0) {
      toast.error("No items to copy")
      return
    }
    const textContent = items
      .map((item) => `${item.phone}\t${item.network || "Unknown"}\t${item.capacity_gb}GB\t${item.status}`)
      .join("\n")
    navigator.clipboard
      .writeText(textContent)
      .then(() => toast.success("Data copied to clipboard!"))
      .catch((err) => {
        console.error("Failed to copy:", err)
        toast.error("Failed to copy data")
      })
  }

  const downloadBulkDataAsCSV = (items: BulkOrderItem[], order: BulkOrder) => {
    if (items.length === 0) {
      toast.error("No items to download")
      return
    }
    const headers = "Phone,Network,Capacity (GB),Status,Error\n"
    const rows = items
      .map((item) => `"${item.phone}","${item.network || "Unknown"}",${item.capacity_gb},"${item.status}","${item.error_message || ""}"`)
      .join("\n")
    const csvContent = headers + rows
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `bulk-order-${order.id}-items.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadBulkDataAsXLSX = async (items: BulkOrderItem[], order: BulkOrder) => {
    if (items.length === 0) {
      toast.error("No items to download")
      return
    }
    try {
      const { utils, writeFile } = await import("xlsx")
      const ws = utils.json_to_sheet(
        items.map((item) => ({
          Phone: item.phone,
          Network: item.network || "Unknown",
          "Capacity (GB)": item.capacity_gb,
          Status: item.status,
          Error: item.error_message || "",
        })),
      )
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, "Bulk Order Items")
      writeFile(wb, `bulk-order-${order.id}-items.xlsx`)
    } catch (error) {
      console.error("Failed to download Excel:", error)
      downloadBulkDataAsCSV(items, order)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 sm:py-8">
        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-600 mr-2" />
        <span className="text-xs sm:text-sm text-blue-700">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Tabs defaultValue="afa" className="space-y-3 sm:space-y-4 w-full overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200 gap-0.5 h-auto p-0.5">
          <TabsTrigger
            value="afa"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-3 whitespace-nowrap"
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            AFA
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-3 whitespace-nowrap"
          >
            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            Orders
          </TabsTrigger>
        </TabsList>

        {/* MTN AFA Tab */}
        <TabsContent value="afa" className="space-y-2 sm:space-y-3 w-full">
          <Card className="border-blue-200 bg-white/90 backdrop-blur-sm w-full">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm text-blue-800">MTN AFA Registrations</CardTitle>
              <CardDescription className="text-xs sm:text-xs text-blue-600">
                Manage MTN AFA registration submissions
              </CardDescription>
              <div className="flex gap-1 flex-wrap mt-2">
                <Button
                  onClick={() => loadData()}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-7 sm:h-8"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => downloadAFACSV(afaSubmissions)}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-7 sm:h-8"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="space-y-2">
                {afaSubmissions.map((submission) => (
                  <Card key={submission.id} className="border-blue-100 bg-white">
                    <CardContent className="pt-2 p-2 sm:p-3">
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                              {submission.full_name}
                            </h3>
                          </div>
                          <Badge className={`${getStatusColor(submission.status)} text-xs flex-shrink-0 py-0.5 px-1.5`}>
                            {(submission.status || "pending_admin_review").replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                          <div className="truncate">
                            <span className="font-medium">Phone:</span> {submission.phone_number}
                          </div>
                          <div className="truncate">
                            <span className="font-medium">Card:</span> {submission.ghana_card}
                          </div>
                        </div>

                        <div className="flex gap-1 flex-wrap items-center pt-1 border-t border-blue-100">
                          <Select
                            value={submission.status || "pending_admin_review"}
                            onValueChange={(value) => updateAFAStatus(submission.id, value)}
                            disabled={processing}
                          >
                            <SelectTrigger className="w-32 sm:w-40 border-blue-200 text-xs h-7">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending_admin_review">Pending Review</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="canceled">Canceled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => {
                              setSelectedAFA(submission)
                              setShowAFADetails(true)
                            }}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-7"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => deleteAFARegistration(submission.id)}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-7"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {afaSubmissions.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-xs sm:text-sm">No AFA registrations found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Orders Tab */}
        <TabsContent value="bulk" className="space-y-2 sm:space-y-3 w-full">
          <Card className="border-blue-200 bg-white/90 backdrop-blur-sm w-full">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm text-blue-800">Bulk Orders</CardTitle>
              <CardDescription className="text-xs sm:text-xs text-blue-600">
                Manage bulk data order submissions
              </CardDescription>
              <div className="flex gap-1 flex-wrap mt-2">
                <Button
                  onClick={() => loadData()}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-7 sm:h-8"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => downloadBulkOrdersCSV(bulkOrders)}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-7 sm:h-8"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="space-y-2">
                {bulkOrders.map((order) => (
                  <Card key={order.id} className="border-blue-100 bg-white">
                    <CardContent className="pt-2 p-2 sm:p-3">
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                              {order.agent_name ? `${order.agent_name} - Bulk Order` : "Bulk Order"} -{" "}
                              {order.source.toUpperCase()}
                            </h3>
                            {order.agent_email && <p className="text-xs text-gray-500 truncate">{order.agent_email}</p>}
                          </div>
                          <Badge className={`${getStatusColor(order.status)} text-xs flex-shrink-0 py-0.5 px-1.5`}>
                            {(order.status || "pending_admin_review").replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
                          <div>
                            <span className="font-medium block text-xs">Total</span>
                            <span className="text-gray-900 font-medium text-xs">{order.row_count}</span>
                          </div>
                          <div>
                            <span className="font-medium block text-xs">Accepted</span>
                            <span className="text-green-600 font-medium text-xs">{order.accepted_count}</span>
                          </div>
                          <div>
                            <span className="font-medium block text-xs">Rejected</span>
                            <span className="text-red-600 font-medium text-xs">{order.rejected_count}</span>
                          </div>
                        </div>

                        <div className="flex gap-1 flex-wrap items-center pt-1 border-t border-blue-100">
                          <Select
                            value={order.status}
                            onValueChange={(value) => {
                              updateBulkOrderStatus(order.id, value)
                            }}
                          >
                            <SelectTrigger className="w-32 sm:w-40 border-blue-200 text-xs h-7">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending_admin_review">Pending Review</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="canceled">Canceled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedBulkOrder(order)
                              setShowBulkDetails(true)
                              setItemsLoading(true)
                              loadBulkOrderItems(order.id)
                            }}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-7"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => deleteBulkOrder(order.id)}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-7"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {bulkOrders.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-xs sm:text-sm">No bulk orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== SIMPLIFIED AFA DETAILS DIALOG ========== */}
      <Dialog open={showAFADetails} onOpenChange={setShowAFADetails}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-blue-800">AFA Registration Details</DialogTitle>
          </DialogHeader>
          {selectedAFA && (
            <div className="space-y-4">
              {/* Personal Information */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                <h3 className="font-medium text-blue-800 flex items-center gap-2">
                  <User className="h-4 w-4" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-blue-600">Full Name</p>
                    <p className="font-medium">{selectedAFA.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Phone Number</p>
                    <p className="font-medium">{selectedAFA.phone_number}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-blue-600">Ghana Card</p>
                    <p className="font-mono font-medium">{selectedAFA.ghana_card}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Date of Birth</p>
                    <p>{selectedAFA.date_of_birth ? formatDate(selectedAFA.date_of_birth) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Occupation</p>
                    <p>{selectedAFA.occupation || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-blue-600">Location</p>
                    <p>{selectedAFA.location}</p>
                  </div>
                  {selectedAFA.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-blue-600">Notes</p>
                      <p className="bg-white p-2 rounded border">{selectedAFA.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information - Simplified */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-3">
                <h3 className="font-medium text-purple-800 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Information
                </h3>
                <div className="space-y-3">
                  {selectedAFA.payment_pin && (
                    <div>
                      <p className="text-xs text-purple-600 mb-1">Payment PIN</p>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-3 py-1 rounded border font-mono text-sm flex-1">
                          {selectedAFA.payment_pin}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedAFA.payment_pin!)
                            toast.success("PIN copied")
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-purple-600 mb-1">Verification Status</p>
                    <div className="flex items-center gap-3">
                      <Badge variant={selectedAFA.payment_verified ? "default" : "outline"} className="text-sm">
                        {selectedAFA.payment_verified ? "Verified" : "Unverified"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={selectedAFA.payment_verified ? "destructive" : "default"}
                        onClick={() => verifyAFAPayment(selectedAFA.id, !selectedAFA.payment_verified)}
                        disabled={processing}
                      >
                        {selectedAFA.payment_verified ? "Mark Unverified" : "Mark Verified"}
                      </Button>
                    </div>
                    {selectedAFA.payment_verified_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Verified at: {formatDateTime(selectedAFA.payment_verified_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Timestamps (no admin processed fields) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Status & Timestamps
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Status</p>
                    <Badge className={getStatusColor(selectedAFA.status)}>
                      {selectedAFA.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Agent</p>
                    <p>{selectedAFA.agents?.full_name || selectedAFA.agent_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Created At</p>
                    <p>{formatDateTime(selectedAFA.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Updated At</p>
                    <p>{selectedAFA.updated_at ? formatDateTime(selectedAFA.updated_at) : "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAFADetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== REDESIGNED BULK ORDER DETAILS DIALOG (Mobile‑First, Compact) ========== */}
<Dialog open={showBulkDetails} onOpenChange={setShowBulkDetails}>
  <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-2 sm:p-4">
    <DialogHeader className="p-0 mb-2">
      <DialogTitle className="text-sm sm:text-base font-medium text-blue-800">
        Bulk Order Details
      </DialogTitle>
    </DialogHeader>

    {selectedBulkOrder && (
      <div className="space-y-3">
        {/* --- Status Cards: always 2 columns on mobile, 4 on larger screens --- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
            <p className="text-[10px] sm:text-xs text-blue-600">Total Rows</p>
            <p className="text-sm sm:text-lg font-bold">{selectedBulkOrder.row_count}</p>
          </div>
          <div className="bg-green-50 p-2 rounded-lg border border-green-200">
            <p className="text-[10px] sm:text-xs text-green-600">Accepted</p>
            <p className="text-sm sm:text-lg font-bold">{selectedBulkOrder.accepted_count}</p>
          </div>
          <div className="bg-red-50 p-2 rounded-lg border border-red-200">
            <p className="text-[10px] sm:text-xs text-red-600">Rejected</p>
            <p className="text-sm sm:text-lg font-bold">{selectedBulkOrder.rejected_count}</p>
          </div>
          <div className={`${getStatusColor(selectedBulkOrder.status)} p-2 rounded-lg border`}>
            <p className="text-[10px] sm:text-xs font-medium">Status</p>
            <p className="text-sm sm:text-lg font-bold truncate">
              {selectedBulkOrder.status.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* --- Payment Information (compact layout) --- */}
        <div className="bg-purple-50 p-2 sm:p-3 rounded-lg border border-purple-200 space-y-2">
          <h3 className="font-medium text-[10px] sm:text-xs flex items-center gap-1.5 text-purple-800">
            <CreditCard className="h-3 w-3" /> Payment
          </h3>
          {selectedBulkOrder.payment_pin && (
            <div className="space-y-1.5">
              <p className="text-[10px] sm:text-xs text-purple-600">PIN</p>
              <div className="flex items-center gap-1.5">
                <code className="bg-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border text-[10px] sm:text-xs font-mono break-all flex-1">
                  {selectedBulkOrder.payment_pin}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedBulkOrder.payment_pin!);
                    toast.success("PIN copied");
                  }}
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-[10px] sm:text-xs text-purple-600">Verification</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant={selectedBulkOrder.payment_verified ? "default" : "outline"}
                className="text-[10px] sm:text-xs py-0.5 px-1.5"
              >
                {selectedBulkOrder.payment_verified ? "Verified" : "Unverified"}
              </Badge>
              <Button
                size="sm"
                variant={selectedBulkOrder.payment_verified ? "destructive" : "default"}
                onClick={() => verifyBulkOrderPayment(selectedBulkOrder.id, !selectedBulkOrder.payment_verified)}
                disabled={processing}
                className="text-[10px] sm:text-xs h-6 sm:h-7 px-1.5 sm:px-2"
              >
                {selectedBulkOrder.payment_verified ? "Mark Unverified" : "Mark Verified"}
              </Button>
            </div>
            {selectedBulkOrder.payment_verified_at && (
              <p className="text-[10px] sm:text-xs text-gray-500">
                Verified: {formatDateTime(selectedBulkOrder.payment_verified_at)}
              </p>
            )}
          </div>
        </div>

        {/* --- Order Items Table – Compact & No Horizontal Scroll --- */}
        <div className="space-y-2">
          <h3 className="font-medium text-[10px] sm:text-xs">Order Items (First 100)</h3>
          {itemsLoading ? (
            <div className="flex justify-center py-2 sm:py-4">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto bg-white">
              {/* 
                Removed min-width constraints – table now scales with viewport.
                Added table-fixed and percentage widths for consistent column sizing.
                Each cell uses truncate to prevent overflow.
              */}
              <table className="w-full table-fixed text-[10px] sm:text-xs">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="w-[8%] px-1 py-1 sm:px-1.5 sm:py-1.5 text-left font-semibold truncate">#</th>
                    <th className="w-[35%] px-1 py-1 sm:px-1.5 sm:py-1.5 text-left font-semibold truncate">Phone</th>
                    <th className="w-[20%] px-1 py-1 sm:px-1.5 sm:py-1.5 text-left font-semibold truncate">Network</th>
                    <th className="w-[12%] px-1 py-1 sm:px-1.5 sm:py-1.5 text-left font-semibold truncate">GB</th>
                    <th className="w-[25%] px-1 py-1 sm:px-1.5 sm:py-1.5 text-left font-semibold truncate">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkOrderItems.slice(0, 100).map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-1 py-1 sm:px-1.5 sm:py-1.5 truncate">{idx + 1}</td>
                      <td className="px-1 py-1 sm:px-1.5 sm:py-1.5 font-mono truncate" title={item.phone}>
                        {item.phone}
                      </td>
                      <td className="px-1 py-1 sm:px-1.5 sm:py-1.5 truncate">{item.network || "-"}</td>
                      <td className="px-1 py-1 sm:px-1.5 sm:py-1.5 truncate">{item.capacity_gb}</td>
                      <td className="px-1 py-1 sm:px-1.5 sm:py-1.5 truncate">
                        <Badge variant="outline" className="text-[10px] py-0.5 px-1.5">
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- Action Buttons (wrapped, compact) --- */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t">
          <Button
            onClick={() => copyBulkDataToClipboard(bulkOrderItems)}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-600 text-[10px] sm:text-xs h-6 sm:h-7 px-1.5 sm:px-2"
          >
            <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Copy
          </Button>
          <Button
            onClick={() => downloadBulkDataAsCSV(bulkOrderItems, selectedBulkOrder)}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-600 text-[10px] sm:text-xs h-6 sm:h-7 px-1.5 sm:px-2"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> CSV
          </Button>
          <Button
            onClick={() => downloadBulkDataAsXLSX(bulkOrderItems, selectedBulkOrder)}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-600 text-[10px] sm:text-xs h-6 sm:h-7 px-1.5 sm:px-2"
          >
            <FileJson className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> XLSX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkDetails(false)}
            className="ml-auto text-[10px] sm:text-xs h-6 sm:h-7 px-1.5 sm:px-2"
          >
            Close
          </Button>
        </div>

        {/* --- Basic Info (compact grid) --- */}
        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200 text-[10px] sm:text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <div>
              <span className="text-gray-600">Agent:</span>{" "}
              <span className="font-medium">
                {selectedBulkOrder.agents?.full_name || selectedBulkOrder.agent_id}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Source:</span>{" "}
              <span className="font-medium">{selectedBulkOrder.source}</span>
            </div>
            <div>
              <span className="text-gray-600">Created:</span>{" "}
              <span className="font-medium">{formatDateTime(selectedBulkOrder.created_at)}</span>
            </div>
            <div>
              <span className="text-gray-600">Updated:</span>{" "}
              <span className="font-medium">
                {selectedBulkOrder.updated_at ? formatDateTime(selectedBulkOrder.updated_at) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>


      {/* Delete Confirmation Dialogs (unchanged) */}
      <AlertDialog
        open={!!deleteConfirmId && deleteConfirmType === "afa"}
        onOpenChange={(open) => !open && (setDeleteConfirmId(null), setDeleteConfirmType(null))}
      >
        <AlertDialogContent className="w-[95vw] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete AFA Registration</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The AFA registration will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && confirmDeleteAFA(deleteConfirmId)}
              className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteConfirmId && deleteConfirmType === "bulk"}
        onOpenChange={(open) => !open && (setDeleteConfirmId(null), setDeleteConfirmType(null))}
      >
        <AlertDialogContent className="w-[95vw] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete Bulk Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the bulk order and all associated items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && confirmDeleteBulkOrder(deleteConfirmId)}
              className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
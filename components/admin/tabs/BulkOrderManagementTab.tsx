"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FileText, Eye, RefreshCw, Package, Loader2, Download, Copy, FileJson } from "lucide-react"
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

interface AFASubmission {
  id: string
  agent_id: string
  full_name: string
  phone_number: string
  ghana_card: string
  location: string
  occupation?: string
  notes?: string
  status: string
  payment_required: boolean
  payment_pin?: string
  created_at: string
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
  created_at: string
  agents?: {
    id: string
    full_name: string
    phone_number: string
  }
}

interface BulkOrderItem {
  id: string
  phone: string
  capacity_gb: number
  network: string
  status: string
  error_message?: string
}

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
        const newItem = { ...payload.new, status: payload.new.status || "pending" }
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
        const newItem = { ...payload.new, status: payload.new.status || "pending" }
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
  }, [selectedAFA, selectedBulkOrder]) // Updated dependencies

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
        status: item.status || "pending",
      }))

      const bulkWithDefaults = (bulkData || []).map((item: any) => ({
        ...item,
        status: item.status || "pending",
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
    const headers = ["ID", "Agent", "Full Name", "Phone", "Ghana Card", "Location", "Occupation", "Status", "Date"]
    const rows = submissions.map((sub) => [
      sub.id,
      sub.agents?.full_name || sub.agent_id,
      sub.full_name,
      sub.phone_number,
      sub.ghana_card,
      sub.location,
      sub.occupation || "-",
      sub.status,
      new Date(sub.created_at).toLocaleDateString(),
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
    const headers = ["ID", "Agent", "Source", "Total Rows", "Accepted", "Rejected", "Status", "Date"]
    const rows = orders.map((order) => [
      order.id,
      order.agent_name || order.agents?.full_name || order.agent_id,
      order.source,
      order.row_count,
      order.accepted_count,
      order.rejected_count,
      order.status,
      new Date(order.created_at).toLocaleDateString(),
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
      .map((item) => `${item.phone}\t${item.network || "Unknown"}\t${item.capacity_gb}GB`)
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
    const headers = "Phone,Network,Capacity (GB),Status\n"
    const rows = items
      .map((item) => `"${item.phone}","${item.network || "Unknown"}",${item.capacity_gb},"${item.status}"`)
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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
                            {(submission.status || "pending").replace("_", " ")}
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
                            value={submission.status || "pending"}
                            onValueChange={(value) => updateAFAStatus(submission.id, value)}
                            disabled={processing}
                          >
                            <SelectTrigger className="w-32 sm:w-40 border-blue-200 text-xs h-7">
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
                            {(order.status || "pending").replace("_", " ")}
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
                              <SelectItem value="pending">Pending</SelectItem>
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

      {/* AFA Details Dialog */}
      <Dialog open={showAFADetails} onOpenChange={setShowAFADetails}>
        <DialogContent className="w-[95vw] max-w-sm max-h-[80vh] overflow-y-auto p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-xs sm:text-sm text-blue-800">AFA Registration Details</DialogTitle>
          </DialogHeader>
          {selectedAFA && (
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-0.5">Full Name</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">{selectedAFA.full_name}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-0.5">Phone</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{selectedAFA.phone_number}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-0.5">Ghana Card</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{selectedAFA.ghana_card}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-0.5">Location</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">{selectedAFA.location}</p>
              </div>
              {selectedAFA.occupation && (
                <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-0.5">Occupation</p>
                  <p className="text-xs sm:text-sm text-gray-900">{selectedAFA.occupation}</p>
                </div>
              )}
              {selectedAFA.notes && (
                <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-0.5">Notes</p>
                  <p className="text-xs sm:text-sm text-gray-900 break-words">{selectedAFA.notes}</p>
                </div>
              )}
              <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-0.5">Status</p>
                <Badge className={`${getStatusColor(selectedAFA.status)} text-xs`}>
                  {(selectedAFA.status || "pending").replace("_", " ")}
                </Badge>
              </div>
              <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-medium mb-0.5">Date</p>
                <p className="text-xs sm:text-sm text-gray-900">
                  {new Date(selectedAFA.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAFADetails(false)} className="text-xs h-7 sm:h-8 w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Order Details Dialog */}
      <Dialog open={showBulkDetails} onOpenChange={setShowBulkDetails}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[80vh] overflow-y-auto p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-xs sm:text-sm text-blue-800">Bulk Order Items & Details</DialogTitle>
          </DialogHeader>
          {selectedBulkOrder && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">Total</p>
                  <p className="text-sm font-bold text-gray-900">{selectedBulkOrder.row_count}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                  <p className="text-xs text-green-600 font-medium">Accepted</p>
                  <p className="text-sm font-bold text-gray-900">{selectedBulkOrder.accepted_count}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                  <p className="text-xs text-red-600 font-medium">Rejected</p>
                  <p className="text-sm font-bold text-gray-900">{selectedBulkOrder.rejected_count}</p>
                </div>
                <div className={`${getStatusColor(selectedBulkOrder.status)} rounded-lg p-2 border`}>
                  <p className="text-xs font-medium">Status</p>
                  <p className="text-sm font-bold">{(selectedBulkOrder.status || "pending").replace("_", " ")}</p>
                </div>
              </div>

              {!itemsLoading && (
                <div className="border rounded-lg overflow-x-auto bg-white">
                  <table className="w-full text-xs min-w-max">
                    <thead className="bg-gray-100 border-b sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-semibold text-gray-700 text-xs">#</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-gray-700 text-xs">Phone</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-gray-700 text-xs">Network</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-gray-700 text-xs">GB</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {bulkOrderItems.slice(0, 100).map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-2 py-1.5 text-xs">{index + 1}</td>
                          <td className="px-2 py-1.5 font-mono text-xs">{item.phone}</td>
                          <td className="px-2 py-1.5 text-xs">{item.network || "-"}</td>
                          <td className="px-2 py-1.5 text-xs">{item.capacity_gb}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {itemsLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => copyBulkDataToClipboard(bulkOrderItems)}
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-8"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Data
                  </Button>
                  <Button
                    onClick={() => downloadBulkDataAsCSV(bulkOrderItems, selectedBulkOrder)}
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-8"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    CSV
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => downloadBulkDataAsXLSX(bulkOrderItems, selectedBulkOrder)}
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-8"
                  >
                    <FileJson className="h-3 w-3 mr-1" />
                    XLSX
                  </Button>
                  <Button
                    onClick={() => setShowBulkDetails(false)}
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-8"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="hidden"></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Confirmation Dialogs */}
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

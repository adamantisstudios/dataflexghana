"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { STOREFRONT_ORDERS_CHANGED_EVENT } from "@/lib/storefront-events"
import {
  RefreshCw,
  Store,
  Search,
  Copy,
  Check,
  Download,
  Trash2,
  Wallet,
  Receipt,
  ClipboardList,
} from "lucide-react"
import { StorefrontCompliancePanel } from "@/components/admin/StorefrontCompliancePanel"

const ORDERS_POLL_MS = 15000

interface StorefrontOrder {
  id: string
  agent_id: string
  customer_phone: string | null
  base_cost: number
  agent_markup: number
  total_paid: number
  status: string
  created_at: string
  order_type?: string | null
  item_title?: string | null
  quantity?: number | null
  buyer_details?: Record<string, string> | null
  data_bundles?: { name: string; provider: string; size_gb: number } | null
  agents?: { full_name: string; phone_number: string } | null
}

function orderItemLabel(o: StorefrontOrder): string {
  if (o.order_type === "wholesale_product") {
    const qty = o.quantity && o.quantity > 1 ? ` ×${o.quantity}` : ""
    return `${o.item_title || "Wholesale product"}${qty}`
  }
  if (o.data_bundles?.name) {
    return `${o.data_bundles.name} (${o.data_bundles.provider} ${o.data_bundles.size_gb}GB)`
  }
  return o.item_title || "Data bundle"
}

function orderCustomerLabel(o: StorefrontOrder): string {
  if (o.buyer_details && typeof o.buyer_details === "object") {
    const b = o.buyer_details
    const parts = [b.full_name, b.contact_number || b.phone, b.location, b.address].filter(Boolean)
    return parts.join(" · ") || "Buyer details on file"
  }
  return o.customer_phone || "—"
}

interface StoreProfile {
  agent_id: string
  store_name: string | null
  storefront_commission_balance: number
  agent_name?: string
  phone_number?: string
  last_order_date?: string | null
}

function adminHeaders(): HeadersInit {
  return getAdminAuthHeaders()
}

function escapeCsv(value: string | number) {
  const s = String(value ?? "")
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export default function StorefrontManagerTab() {
  const [activeTab, setActiveTab] = useState("cashout")

  const [orders, setOrders] = useState<StorefrontOrder[]>([])
  const [profiles, setProfiles] = useState<StoreProfile[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [copiedPhoneNumbers, setCopiedPhoneNumbers] = useState<Set<string>>(new Set())

  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotalPages, setOrdersTotalPages] = useState(1)
  const [orderStatus, setOrderStatus] = useState("all")
  const [orderSearch, setOrderSearch] = useState("")
  const [debouncedOrderSearch, setDebouncedOrderSearch] = useState("")

  const [cashoutPage, setCashoutPage] = useState(1)
  const [cashoutTotalPages, setCashoutTotalPages] = useState(1)
  const [cashoutSearch, setCashoutSearch] = useState("")
  const [debouncedCashoutSearch, setDebouncedCashoutSearch] = useState("")
  const [positiveOnly, setPositiveOnly] = useState(true)

  const [exportingOrdersCsv, setExportingOrdersCsv] = useState(false)
  const [exportingCashoutCsv, setExportingCashoutCsv] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const [confirmPaidAgent, setConfirmPaidAgent] = useState<StoreProfile | null>(null)
  const [confirmDeleteCompleted, setConfirmDeleteCompleted] = useState(false)
  const [deletingCompleted, setDeletingCompleted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedCashoutSearch(cashoutSearch)
      setCashoutPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [cashoutSearch])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedOrderSearch(orderSearch)
      setOrdersPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [orderSearch])

  const loadOrders = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setOrdersLoading(true)
    try {
      const q = new URLSearchParams({
        page: String(ordersPage),
        limit: "20",
        status: orderStatus,
        ...(debouncedOrderSearch ? { search: debouncedOrderSearch } : {}),
      })
      const res = await fetch(`/api/admin/storefront-orders?${q}`, { headers: adminHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load orders")
      setOrders(data.orders || [])
      setOrdersTotalPages(data.totalPages || 1)
      const pending = Number(data.pendingCount ?? 0)
      setPendingCount(pending)
      window.dispatchEvent(new CustomEvent("admin-storefront-pending", { detail: pending }))
    } catch (e) {
      if (!options?.silent) {
        toast.error(e instanceof Error ? e.message : "Load failed")
      }
    } finally {
      if (!options?.silent) setOrdersLoading(false)
    }
  }, [ordersPage, orderStatus, debouncedOrderSearch])

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true)
    try {
      const q = new URLSearchParams({
        page: String(cashoutPage),
        limit: "20",
        positiveOnly: String(positiveOnly),
        ...(debouncedCashoutSearch ? { search: debouncedCashoutSearch } : {}),
      })
      const res = await fetch(`/api/admin/storefront/cashout-profiles?${q}`, { headers: adminHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load profiles")
      setProfiles(data.profiles || [])
      setCashoutTotalPages(data.totalPages || 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed")
    } finally {
      setProfilesLoading(false)
    }
  }, [cashoutPage, debouncedCashoutSearch, positiveOnly])

  useEffect(() => {
    loadOrders()
    const interval = setInterval(() => loadOrders({ silent: true }), ORDERS_POLL_MS)
    const onFocus = () => loadOrders({ silent: true })
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadOrders({ silent: true })
    }
    const onOrdersChanged = () => loadOrders({ silent: true })
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener(STOREFRONT_ORDERS_CHANGED_EVENT, onOrdersChanged)
    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener(STOREFRONT_ORDERS_CHANGED_EVENT, onOrdersChanged)
    }
  }, [loadOrders])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const refreshAll = () => {
    loadOrders()
    loadProfiles()
  }

  const downloadOrdersCsv = async () => {
    setExportingOrdersCsv(true)
    try {
      const allOrders: StorefrontOrder[] = []
      let page = 1
      let totalPages = 1
      while (page <= totalPages) {
        const q = new URLSearchParams({
          page: String(page),
          limit: "100",
          status: orderStatus,
          ...(debouncedOrderSearch ? { search: debouncedOrderSearch } : {}),
        })
        const res = await fetch(`/api/admin/storefront-orders?${q}`, { headers: adminHeaders() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to export orders")
        allOrders.push(...(data.orders || []))
        totalPages = data.totalPages || 1
        page += 1
      }

      const header = [
        "Order ID",
        "Agent",
        "Bundle/Product",
        "Customer Phone",
        "Base Cost",
        "Markup",
        "Total Paid",
        "Status",
        "Date",
      ]
      const rows = allOrders.map((o) => [
        o.id,
        o.agents?.full_name || o.agent_id,
        orderItemLabel(o),
        o.customer_phone || orderCustomerLabel(o),
        Number(o.base_cost).toFixed(2),
        Number(o.agent_markup).toFixed(2),
        Number(o.total_paid).toFixed(2),
        o.status,
        new Date(o.created_at).toISOString(),
      ])
      const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `storefront-orders-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${allOrders.length} order(s)`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "CSV export failed")
    } finally {
      setExportingOrdersCsv(false)
    }
  }

  const downloadCashoutCsv = async () => {
    setExportingCashoutCsv(true)
    try {
      const allProfiles: StoreProfile[] = []
      let page = 1
      let totalPages = 1
      while (page <= totalPages) {
        const q = new URLSearchParams({
          page: String(page),
          limit: "100",
          positiveOnly: String(positiveOnly),
          ...(debouncedCashoutSearch ? { search: debouncedCashoutSearch } : {}),
        })
        const res = await fetch(`/api/admin/storefront/cashout-profiles?${q}`, { headers: adminHeaders() })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to export balances")
        allProfiles.push(...(data.profiles || []))
        totalPages = data.totalPages || 1
        page += 1
      }

      const header = ["Agent Name", "Phone", "Balance", "Last Order Date"]
      const rows = allProfiles.map((p) => [
        p.agent_name || "Unknown",
        p.phone_number || "",
        Number(p.storefront_commission_balance ?? 0).toFixed(2),
        p.last_order_date ? new Date(p.last_order_date).toISOString() : "",
      ])
      const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `storefront-commission-balances-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${allProfiles.length} agent(s)`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "CSV export failed")
    } finally {
      setExportingCashoutCsv(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    setProcessingId(id)
    try {
      const res = await fetch("/api/admin/storefront-orders", {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Order marked ${status}`)
      loadOrders()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setProcessingId(null)
    }
  }

  const deleteCompletedOrders = async () => {
    setDeletingCompleted(true)
    try {
      const res = await fetch("/api/admin/storefront-orders", {
        method: "DELETE",
        headers: adminHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Removed ${data.deletedCount ?? 0} completed order(s)`)
      setConfirmDeleteCompleted(false)
      loadOrders()
      window.dispatchEvent(new CustomEvent(STOREFRONT_ORDERS_CHANGED_EVENT))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeletingCompleted(false)
    }
  }

  const handleCopyCustomerPhone = async (phoneNumber: string) => {
    try {
      await navigator.clipboard.writeText(phoneNumber)
      setCopiedPhoneNumbers((prev) => new Set([...prev, phoneNumber]))
      toast.success("Customer phone number copied!")
      setTimeout(() => {
        setCopiedPhoneNumbers((prev) => {
          const next = new Set(prev)
          next.delete(phoneNumber)
          return next
        })
      }, 2000)
    } catch {
      toast.error("Failed to copy customer phone number")
    }
  }

  const renderCustomerPhone = (phone: string | null) => {
    if (!phone) return <span className="text-muted-foreground">—</span>
    return (
      <span className="inline-flex items-center gap-0.5">
        <span>{phone}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => handleCopyCustomerPhone(phone)}
          className={`h-7 w-7 p-0 shrink-0 ${
            copiedPhoneNumbers.has(phone)
              ? "text-green-600 hover:bg-green-100 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          disabled={copiedPhoneNumbers.has(phone)}
          title={copiedPhoneNumbers.has(phone) ? "Copied" : "Copy customer phone number"}
          aria-label={copiedPhoneNumbers.has(phone) ? "Copied" : "Copy customer phone number"}
        >
          {copiedPhoneNumbers.has(phone) ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </span>
    )
  }

  const markCashoutPaid = async (agentId: string) => {
    setProcessingId(agentId)
    try {
      const res = await fetch("/api/admin/storefront/cashout", {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ agent_id: agentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message || "Cashout recorded")
      setConfirmPaidAgent(null)
      loadProfiles()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cashout failed")
    } finally {
      setProcessingId(null)
    }
  }

  const formatLastOrderDate = (date: string | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 shrink-0" />
            Storefront Management
          </h2>
          <p className="text-sm text-muted-foreground">
            MoMo cashouts, transaction log, and compliance submissions
          </p>
        </div>
        <Button variant="outline" onClick={refreshAll} disabled={ordersLoading || profilesLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${ordersLoading || profilesLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full h-auto gap-1 p-1 overflow-x-auto flex-nowrap justify-start rounded-lg bg-muted/60">
          <TabsTrigger
            value="cashout"
            className="flex items-center gap-2 py-2.5 px-4 shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-800"
          >
            <Wallet className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">MoMo Cashout</span>
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="flex items-center gap-2 py-2.5 px-4 shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-800"
          >
            <Receipt className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Orders</span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="compliance"
            className="flex items-center gap-2 py-2.5 px-4 shrink-0 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-800"
          >
            <ClipboardList className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Compliance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cashout" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">MoMo Cashout — Commission Balances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 w-full"
                    placeholder="Search agent name or phone…"
                    value={cashoutSearch}
                    onChange={(e) => setCashoutSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="positive-only"
                      checked={positiveOnly}
                      onCheckedChange={(v) => {
                        setPositiveOnly(v)
                        setCashoutPage(1)
                      }}
                    />
                    <Label htmlFor="positive-only" className="text-sm cursor-pointer">
                      Positive balances only
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void downloadCashoutCsv()}
                    disabled={exportingCashoutCsv || profilesLoading}
                  >
                    <Download className={`h-4 w-4 mr-2 ${exportingCashoutCsv ? "animate-pulse" : ""}`} />
                    Download CSV
                  </Button>
                </div>
              </div>

              {profilesLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading commission balances…</p>
              ) : profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {positiveOnly
                    ? debouncedCashoutSearch
                      ? "No agents with a positive balance match your search."
                      : "No agents with balance greater than ₵0."
                    : debouncedCashoutSearch
                      ? "No agents match your search."
                      : "No agent store profiles found."}
                </p>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Last Order</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles.map((p) => (
                          <TableRow key={p.agent_id}>
                            <TableCell className="font-medium">{p.agent_name || "—"}</TableCell>
                            <TableCell>{p.phone_number || "—"}</TableCell>
                            <TableCell className="font-semibold text-emerald-700">
                              ₵{Number(p.storefront_commission_balance ?? 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {formatLastOrderDate(p.last_order_date)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                disabled={
                                  processingId === p.agent_id ||
                                  Number(p.storefront_commission_balance) <= 0
                                }
                                onClick={() => setConfirmPaidAgent(p)}
                              >
                                Mark as Paid
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden flex flex-col gap-3">
                    {profiles.map((p) => (
                      <div key={p.agent_id} className="border rounded-lg p-4 space-y-2">
                        <p className="font-medium">{p.agent_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{p.phone_number}</p>
                        <p className="text-lg font-semibold text-emerald-700">
                          ₵{Number(p.storefront_commission_balance ?? 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last order: {formatLastOrderDate(p.last_order_date)}
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={
                            processingId === p.agent_id ||
                            Number(p.storefront_commission_balance) <= 0
                          }
                          onClick={() => setConfirmPaidAgent(p)}
                        >
                          Mark as Paid
                        </Button>
                      </div>
                    ))}
                  </div>

                  {cashoutTotalPages > 1 && (
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cashoutPage <= 1}
                        onClick={() => setCashoutPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm self-center">
                        Page {cashoutPage} / {cashoutTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cashoutPage >= cashoutTotalPages}
                        onClick={() => setCashoutPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                Storefront Transaction Log
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Agent name, customer phone, or order ID…"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={orderStatus}
                    onValueChange={(v) => {
                      setOrderStatus(v)
                      setOrdersPage(1)
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void downloadOrdersCsv()}
                    disabled={exportingOrdersCsv || ordersLoading}
                  >
                    <Download className={`h-4 w-4 mr-2 ${exportingOrdersCsv ? "animate-pulse" : ""}`} />
                    Download CSV
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteCompleted(true)}
                    disabled={ordersLoading || deletingCompleted}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Completed Orders
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading storefront orders…</p>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {debouncedOrderSearch || orderStatus !== "all"
                    ? "No orders match your filters."
                    : "No storefront orders yet."}
                </p>
              ) : (
                <>
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Bundle / Product</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Base</TableHead>
                          <TableHead>Markup</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}…</TableCell>
                            <TableCell>{o.agents?.full_name || o.agent_id.slice(0, 8)}</TableCell>
                            <TableCell>
                              {orderItemLabel(o)}
                              {o.order_type === "wholesale_product" && (
                                <span className="block text-xs text-muted-foreground">Wholesale</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[220px] text-xs">
                              {o.buyer_details
                                ? orderCustomerLabel(o)
                                : renderCustomerPhone(o.customer_phone)}
                            </TableCell>
                            <TableCell>₵{Number(o.base_cost).toFixed(2)}</TableCell>
                            <TableCell>₵{Number(o.agent_markup).toFixed(2)}</TableCell>
                            <TableCell className="font-semibold">
                              ₵{Number(o.total_paid).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={o.status}
                                onValueChange={(v) => updateStatus(o.id, v)}
                                disabled={processingId === o.id}
                              >
                                <SelectTrigger className="w-[130px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Processing">Processing</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(o.created_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="lg:hidden flex flex-col gap-3">
                    {orders.map((o) => (
                      <div key={o.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between gap-2">
                          <div>
                            <p className="font-medium">{orderItemLabel(o)}</p>
                            <p className="text-xs text-muted-foreground font-mono">{o.id.slice(0, 12)}…</p>
                            <p className="text-xs text-muted-foreground">{o.agents?.full_name}</p>
                          </div>
                          <p className="font-semibold shrink-0">₵{Number(o.total_paid).toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Base ₵{Number(o.base_cost).toFixed(2)} · Markup ₵
                          {Number(o.agent_markup).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {o.buyer_details ? orderCustomerLabel(o) : null}
                          {!o.buyer_details && renderCustomerPhone(o.customer_phone)}
                        </p>
                        <Select
                          value={o.status}
                          onValueChange={(v) => updateStatus(o.id, v)}
                          disabled={processingId === o.id}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {ordersTotalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ordersPage <= 1}
                        onClick={() => setOrdersPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm self-center">
                        Page {ordersPage} / {ordersTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ordersPage >= ordersTotalPages}
                        onClick={() => setOrdersPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storefront Compliance Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <StorefrontCompliancePanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!confirmPaidAgent}
        onOpenChange={(open) => !open && setConfirmPaidAgent(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark MoMo cashout as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset{" "}
              <strong>{confirmPaidAgent?.agent_name || "this agent"}</strong>&apos;s storefront
              commission balance of{" "}
              <strong>
                ₵{Number(confirmPaidAgent?.storefront_commission_balance ?? 0).toFixed(2)}
              </strong>{" "}
              to ₵0. The agent will be removed from the positive-balance list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId === confirmPaidAgent?.agent_id}>
              Cancel
            </AlertDialogCancel>
            <Button
              disabled={processingId === confirmPaidAgent?.agent_id}
              onClick={() => confirmPaidAgent && void markCashoutPaid(confirmPaidAgent.agent_id)}
            >
              {processingId === confirmPaidAgent?.agent_id ? "Processing…" : "Confirm payment"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteCompleted} onOpenChange={setConfirmDeleteCompleted}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all completed orders?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes every order with status &quot;Completed&quot; from the
              storefront transaction log. Pending and processing orders are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingCompleted}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={deletingCompleted} onClick={() => void deleteCompletedOrders()}>
              {deletingCompleted ? "Deleting…" : "Delete completed orders"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

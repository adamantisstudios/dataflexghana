"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { STOREFRONT_ORDERS_CHANGED_EVENT } from "@/lib/storefront-events"
import { RefreshCw, Store, Search, Copy, Check, Download } from "lucide-react"
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
}

function adminHeaders(): HeadersInit {
  return getAdminAuthHeaders()
}

export default function StorefrontManagerTab() {
  const [orders, setOrders] = useState<StorefrontOrder[]>([])
  const [profiles, setProfiles] = useState<StoreProfile[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [copiedPhoneNumbers, setCopiedPhoneNumbers] = useState<Set<string>>(new Set())

  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotalPages, setOrdersTotalPages] = useState(1)
  const [orderStatus, setOrderStatus] = useState("all")

  const [cashoutPage, setCashoutPage] = useState(1)
  const [cashoutTotalPages, setCashoutTotalPages] = useState(1)
  const [cashoutSearch, setCashoutSearch] = useState("")
  const [debouncedCashoutSearch, setDebouncedCashoutSearch] = useState("")
  const [exportingCsv, setExportingCsv] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedCashoutSearch(cashoutSearch)
      setCashoutPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [cashoutSearch])

  const loadOrders = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setOrdersLoading(true)
    try {
      const q = new URLSearchParams({
        page: String(ordersPage),
        limit: "20",
        status: orderStatus,
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
  }, [ordersPage, orderStatus])

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true)
    try {
      const q = new URLSearchParams({
        page: String(cashoutPage),
        limit: "20",
        positiveOnly: "true",
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
  }, [cashoutPage, debouncedCashoutSearch])

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

  const escapeCsv = (value: string | number) => {
    const s = String(value ?? "")
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const downloadOrdersCsv = async () => {
    setExportingCsv(true)
    try {
      const allOrders: StorefrontOrder[] = []
      let page = 1
      let totalPages = 1
      while (page <= totalPages) {
        const q = new URLSearchParams({
          page: String(page),
          limit: "100",
          status: orderStatus,
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
        "Bundle",
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
        o.data_bundles?.name || "",
        o.customer_phone,
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
      setExportingCsv(false)
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
        title={
          copiedPhoneNumbers.has(phone) ? "Copied" : "Copy customer phone number"
        }
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
    if (!confirm("Mark MoMo cashout as paid and reset storefront commission balance to ₵0?")) return
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
      loadProfiles()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cashout failed")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 shrink-0" />
            Storefront Management
          </h2>
          <p className="text-sm text-muted-foreground">Orders, fulfillment, and agent markup cashouts</p>
        </div>
        <Button variant="outline" onClick={refreshAll} disabled={ordersLoading || profilesLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${ordersLoading || profilesLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">MoMo cashout — commission balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full"
              placeholder="Search agent name or phone…"
              value={cashoutSearch}
              onChange={(e) => setCashoutSearch(e.target.value)}
            />
          </div>

          {profilesLoading ? (
            <p className="text-sm text-muted-foreground">Loading agents…</p>
          ) : profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agents with balance &gt; ₵0.</p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((p) => (
                      <TableRow key={p.agent_id}>
                        <TableCell>
                          <span className="font-medium">{p.agent_name || "—"}</span>
                          <span className="block text-xs text-muted-foreground">{p.phone_number}</span>
                        </TableCell>
                        <TableCell>{p.store_name || "—"}</TableCell>
                        <TableCell className="font-semibold text-emerald-700">
                          ₵{Number(p.storefront_commission_balance ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            disabled={
                              processingId === p.agent_id ||
                              Number(p.storefront_commission_balance) <= 0
                            }
                            onClick={() => markCashoutPaid(p.agent_id)}
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
                    <p className="text-xs text-muted-foreground">{p.phone_number}</p>
                    <p className="text-sm">{p.store_name || "No store name"}</p>
                    <p className="text-lg font-semibold text-emerald-700">
                      ₵{Number(p.storefront_commission_balance ?? 0).toFixed(2)}
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={
                        processingId === p.agent_id || Number(p.storefront_commission_balance) <= 0
                      }
                      onClick={() => markCashoutPaid(p.agent_id)}
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

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Storefront transaction log
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void downloadOrdersCsv()}
              disabled={exportingCsv || ordersLoading}
            >
              <Download className={`h-4 w-4 mr-2 ${exportingCsv ? "animate-pulse" : ""}`} />
              Download CSV
            </Button>
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
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <p className="text-sm text-muted-foreground">Loading orders…</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No storefront orders yet.</p>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Customer / buyer</TableHead>
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
                          {o.buyer_details ? orderCustomerLabel(o) : renderCustomerPhone(o.customer_phone)}
                        </TableCell>
                        <TableCell className="font-semibold">₵{Number(o.total_paid).toFixed(2)}</TableCell>
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
                        <p className="text-xs text-muted-foreground">{o.agents?.full_name}</p>
                      </div>
                      <p className="font-semibold shrink-0">₵{Number(o.total_paid).toFixed(2)}</p>
                    </div>
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

      <StorefrontCompliancePanel />
    </div>
  )
}

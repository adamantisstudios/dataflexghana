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
import { RefreshCw, Store, Search, Copy, Check } from "lucide-react"

interface StorefrontOrder {
  id: string
  agent_id: string
  customer_phone: string
  base_cost: number
  agent_markup: number
  total_paid: number
  status: string
  created_at: string
  data_bundles?: { name: string; provider: string; size_gb: number } | null
  agents?: { full_name: string; phone_number: string } | null
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

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedCashoutSearch(cashoutSearch)
      setCashoutPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [cashoutSearch])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed")
    } finally {
      setOrdersLoading(false)
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
  }, [loadOrders])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const refreshAll = () => {
    loadOrders()
    loadProfiles()
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

  const renderCustomerPhone = (phone: string) => (
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
          <CardTitle className="text-lg">Storefront transaction log</CardTitle>
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
                      <TableHead>Bundle</TableHead>
                      <TableHead>Customer</TableHead>
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
                          {o.data_bundles?.name || "—"}
                          <span className="block text-xs text-muted-foreground">
                            {o.data_bundles?.provider} {o.data_bundles?.size_gb}GB
                          </span>
                        </TableCell>
                        <TableCell>{renderCustomerPhone(o.customer_phone)}</TableCell>
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
                        <p className="font-medium">{o.data_bundles?.name || "Order"}</p>
                        <p className="text-xs text-muted-foreground">
                          {o.agents?.full_name} · {o.data_bundles?.provider}
                        </p>
                      </div>
                      <p className="font-semibold shrink-0">₵{Number(o.total_paid).toFixed(2)}</p>
                    </div>
                    <p className="text-sm">{renderCustomerPhone(o.customer_phone)}</p>
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
    </div>
  )
}

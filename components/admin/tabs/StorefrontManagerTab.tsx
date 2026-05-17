"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { getCurrentAdmin } from "@/lib/auth"
import { RefreshCw, Store } from "lucide-react"

interface StorefrontOrder {
  id: string
  agent_id: string
  customer_phone: string
  paystack_reference: string
  base_cost: number
  agent_markup: number
  total_paid: number
  status: string
  created_at: string
  data_bundles?: { name: string; provider: string; size_gb: number }
  agents?: { full_name: string; phone_number: string }
}

interface StoreProfile {
  agent_id: string
  store_name: string | null
  storefront_commission_balance: number
}

function adminHeaders(): HeadersInit {
  const admin = getCurrentAdmin()
  const headers: HeadersInit = { "Content-Type": "application/json" }
  if (admin) {
    headers.Authorization = `Bearer ${btoa(JSON.stringify(admin))}`
  }
  return headers
}

export default function StorefrontManagerTab() {
  const [orders, setOrders] = useState<StorefrontOrder[]>([])
  const [profiles, setProfiles] = useState<StoreProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/storefront-orders", { headers: adminHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setOrders(data.orders || [])
      setProfiles(data.profiles || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setProcessingId(null)
    }
  }

  const markCashoutPaid = async (agentId: string) => {
    if (!confirm("Mark storefront commission as paid and reset balance to 0?")) return
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
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cashout failed")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" />
            Storefront Manager
          </h2>
          <p className="text-sm text-muted-foreground">White-label store orders and agent markup payouts</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent storefront balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No storefront profiles yet.</p>
          ) : (
            profiles.map((p) => (
              <div key={p.agent_id} className="flex flex-wrap items-center justify-between gap-2 border rounded-lg p-3">
                <div>
                  <p className="font-medium">{p.store_name || "Unnamed store"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.agent_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-emerald-700">
                    ₵{Number(p.storefront_commission_balance ?? 0).toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    disabled={processingId === p.agent_id || Number(p.storefront_commission_balance) <= 0}
                    onClick={() => markCashoutPaid(p.agent_id)}
                  >
                    Mark as Paid
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No storefront orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {o.data_bundles?.name || "Bundle"} · {o.agents?.full_name || o.agent_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.customer_phone} · {new Date(o.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge>{o.status}</Badge>
                  </div>
                  <p className="text-sm">
                    Base ₵{Number(o.base_cost).toFixed(2)} + Markup ₵{Number(o.agent_markup).toFixed(2)} ={" "}
                    <strong>₵{Number(o.total_paid).toFixed(2)}</strong>
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">{o.paystack_reference}</p>
                  <Select
                    value={o.status}
                    onValueChange={(v) => updateStatus(o.id, v)}
                    disabled={processingId === o.id}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useCallback, useEffect, useState, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"
import {
  FARM_ORDER_STATUSES,
  FARM_ORDER_STATUS_LABELS,
  computeRetailPrice,
  type FarmOrderStatus,
} from "@/lib/farm-types"
import { Loader2, Leaf, RefreshCw, Phone, MapPin, User } from "lucide-react"

type ListingRow = {
  id: string
  produce_name: string
  farmer_name: string
  farmer_phone: string
  farmer_location: string | null
  negotiated_price: number
  admin_markup: number
  retail_price: number
  quantity_available: number
  unit: string
  is_published: boolean
  agent_name?: string | null
}

type OrderRow = {
  id: string
  buyer_name: string
  buyer_phone: string
  delivery_address: string
  total_price: number
  status: FarmOrderStatus
  agent_commission: number
  paystack_reference: string | null
  created_at: string
  farm_listings?: { produce_name?: string; farmer_name?: string; farmer_phone?: string; farmer_location?: string } | null
  agent_name?: string | null
}

function FarmersFriendAdminTab() {
  const [listings, setListings] = useState<ListingRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loadingL, setLoadingL] = useState(true)
  const [loadingO, setLoadingO] = useState(true)
  const [markups, setMarkups] = useState<Record<string, string>>({})
  const [markupPct, setMarkupPct] = useState<Record<string, string>>({})
  const [orderStatus, setOrderStatus] = useState<Record<string, FarmOrderStatus>>({})
  const [config, setConfig] = useState({ agent_commission_rate: 0.1, default_delivery_fee: 0 })
  const [configDraft, setConfigDraft] = useState({ ratePercent: "10", deliveryFee: "0" })

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/admin/farmers-friend/config", { headers: getAdminAuthHeaders() })
    const data = await res.json()
    if (res.ok && data.success) {
      setConfig(data.data)
      setConfigDraft({
        ratePercent: String(Number(data.data.agent_commission_rate) * 100),
        deliveryFee: String(data.data.default_delivery_fee),
      })
    }
  }, [])

  const loadListings = useCallback(async () => {
    setLoadingL(true)
    try {
      const res = await fetch("/api/admin/farmers-friend/listings", { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const rows: ListingRow[] = data.data || []
      setListings(rows)
      const m: Record<string, string> = {}
      const p: Record<string, string> = {}
      for (const r of rows) {
        m[r.id] = String(r.admin_markup)
        const pct = r.negotiated_price > 0 ? ((r.admin_markup / r.negotiated_price) * 100).toFixed(1) : "0"
        p[r.id] = pct
      }
      setMarkups(m)
      setMarkupPct(p)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load listings")
    } finally {
      setLoadingL(false)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    setLoadingO(true)
    try {
      const res = await fetch("/api/admin/farmers-friend/orders", { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const rows: OrderRow[] = data.data || []
      setOrders(rows)
      const s: Record<string, FarmOrderStatus> = {}
      for (const o of rows) s[o.id] = o.status
      setOrderStatus(s)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders")
    } finally {
      setLoadingO(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
    loadListings()
    loadOrders()
  }, [loadConfig, loadListings, loadOrders])

  const saveMarkup = async (id: string, publish?: boolean) => {
    const markup = Number(markups[id])
    if (!Number.isFinite(markup) || markup < 0) {
      toast.error("Invalid markup")
      return
    }
    try {
      const res = await fetch(`/api/admin/farmers-friend/listings/${id}`, {
        method: "PATCH",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ admin_markup: markup, is_published: publish }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(publish ? "Published" : "Markup saved")
      loadListings()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    }
  }

  const saveMarkupPercent = async (id: string) => {
    const pct = Number(markupPct[id])
    if (!Number.isFinite(pct) || pct < 0) {
      toast.error("Invalid percent")
      return
    }
    try {
      const res = await fetch(`/api/admin/farmers-friend/listings/${id}`, {
        method: "PATCH",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ markup_percent: pct }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Markup updated")
      loadListings()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    }
  }

  const togglePublish = async (id: string, published: boolean) => {
    try {
      const res = await fetch(`/api/admin/farmers-friend/listings/${id}`, {
        method: "PATCH",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ is_published: published, admin_markup: Number(markups[id] || 0) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(published ? "Published" : "Unpublished")
      loadListings()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    }
  }

  const saveOrderStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/farmers-friend/orders/${id}`, {
        method: "PATCH",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ status: orderStatus[id] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.commission_credited > 0) {
        toast.success(`Delivered — agent credited ₵${Number(data.commission_credited).toFixed(2)}`)
      } else {
        toast.success("Order updated")
      }
      loadOrders()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    }
  }

  const saveConfig = async () => {
    try {
      const res = await fetch("/api/admin/farmers-friend/config", {
        method: "PATCH",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          agent_commission_rate: Number(configDraft.ratePercent) / 100,
          default_delivery_fee: Number(configDraft.deliveryFee),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Settings saved")
      loadConfig()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[#0E8F3D] to-[#35B24A] text-white p-6 flex items-center gap-3">
        <Leaf className="h-8 w-8" />
        <div>
          <h1 className="text-xl font-bold">Farmers Friend</h1>
          <p className="text-sm text-white/90">Set markups, publish listings, manage delivery workflow</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Platform settings</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div>
            <Label className="text-xs">Agent commission (% of admin markup)</Label>
            <Input className="mt-1 w-32" value={configDraft.ratePercent} onChange={(e) => setConfigDraft((c) => ({ ...c, ratePercent: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Suggested delivery fee (GHS)</Label>
            <Input className="mt-1 w-32" value={configDraft.deliveryFee} onChange={(e) => setConfigDraft((c) => ({ ...c, deliveryFee: e.target.value }))} />
          </div>
          <Button className="bg-[#0E8F3D]" onClick={saveConfig}>Save settings</Button>
          <p className="text-xs text-muted-foreground w-full">Current: {Number(config.agent_commission_rate) * 100}% commission on markup</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">Listings queue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={loadListings}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          </div>
          {loadingL ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          ) : listings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No listings.</p>
          ) : (
            listings.map((l) => (
              <Card key={l.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-bold text-lg">{l.produce_name}</p>
                      <p className="text-sm text-muted-foreground">Agent: {l.agent_name}</p>
                      <Badge className="mt-1" variant={l.is_published ? "default" : "secondary"}>{l.is_published ? "Published" : "Draft"}</Badge>
                    </div>
                    <div className="text-right text-sm">
                      <p>Farmer price: ₵{l.negotiated_price.toFixed(2)} / {l.unit}</p>
                      <p className="font-bold text-[#0E8F3D]">Retail: ₵{l.retail_price.toFixed(2)}</p>
                      <p>{l.quantity_available} {l.unit} available</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm space-y-1">
                    <p className="font-semibold text-amber-900 flex items-center gap-1"><User className="h-3.5 w-3.5" />{l.farmer_name}</p>
                    <p className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{l.farmer_phone}</p>
                    {l.farmer_location && <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{l.farmer_location}</p>}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <Label className="text-xs">Markup (GHS)</Label>
                      <Input value={markups[l.id] ?? ""} onChange={(e) => {
                        const v = e.target.value
                        setMarkups((m) => ({ ...m, [l.id]: v }))
                        const n = Number(v)
                        if (Number.isFinite(n)) {
                          setMarkupPct((p) => ({ ...p, [l.id]: l.negotiated_price > 0 ? ((n / l.negotiated_price) * 100).toFixed(1) : "0" }))
                        }
                      }} />
                      <p className="text-[10px] text-muted-foreground mt-1">Retail preview: ₵{computeRetailPrice(l.negotiated_price, Number(markups[l.id] || 0)).toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Markup (%)</Label>
                      <Input value={markupPct[l.id] ?? ""} onChange={(e) => setMarkupPct((p) => ({ ...p, [l.id]: e.target.value }))} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => saveMarkup(l.id)}>Save markup</Button>
                      <Button size="sm" variant="outline" onClick={() => saveMarkupPercent(l.id)}>Apply %</Button>
                      <Button size="sm" className="bg-[#0E8F3D] text-white" onClick={() => saveMarkup(l.id, true)}>Save & publish</Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={l.is_published} onCheckedChange={(v) => togglePublish(l.id, v)} />
                    <Label>Published on marketplace</Label>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={loadOrders}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          </div>
          {loadingO ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders.</p>
          ) : (
            orders.map((o) => (
              <Card key={o.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold">{o.farm_listings?.produce_name || "Produce"}</p>
                      <p className="text-xs text-muted-foreground">Agent: {o.agent_name}</p>
                    </div>
                    <Badge>₵{o.total_price.toFixed(2)}</Badge>
                  </div>
                  <p className="text-sm">{o.buyer_name} · {o.buyer_phone}</p>
                  <p className="text-xs">{o.delivery_address}</p>
                  {o.farm_listings && (
                    <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2">
                      Farmer: {o.farm_listings.farmer_name} · {o.farm_listings.farmer_phone}
                      {o.farm_listings.farmer_location && ` · ${o.farm_listings.farmer_location}`}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select value={orderStatus[o.id]} onValueChange={(v) => setOrderStatus((s) => ({ ...s, [o.id]: v as FarmOrderStatus }))}>
                      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FARM_ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{FARM_ORDER_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => saveOrderStatus(o.id)}>Update status</Button>
                    <span className="text-xs text-[#0E8F3D]">Commission ₵{o.agent_commission.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default memo(FarmersFriendAdminTab)

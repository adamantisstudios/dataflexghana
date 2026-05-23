"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { FARM_UNITS, FARM_ORDER_STATUS_LABELS, type FarmListing, type FarmOrderStatus } from "@/lib/farm-types"
import { Loader2, Leaf, Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"

interface Props {
  agentId: string
}

const emptyForm = () => ({
  produce_name: "",
  quantity_available: "",
  unit: "kg",
  negotiated_price: "",
  farmer_name: "",
  farmer_phone: "",
  farmer_location: "",
  harvest_date: "",
  notes: "",
})

export function FarmersFriendHub({ agentId }: Props) {
  const [form, setForm] = useState(emptyForm())
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [listings, setListings] = useState<FarmListing[]>([])
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)

  const loadListings = useCallback(async () => {
    setLoadingListings(true)
    try {
      const res = await fetch(`/api/agent/farm-listings?agentId=${agentId}`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setListings(data.listings || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load listings")
    } finally {
      setLoadingListings(false)
    }
  }, [agentId])

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const res = await fetch(`/api/agent/farm-orders?agentId=${agentId}`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrders(data.orders || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders")
    } finally {
      setLoadingOrders(false)
    }
  }, [agentId])

  useEffect(() => {
    loadListings()
    loadOrders()
  }, [loadListings, loadOrders])

  const uploadPhoto = async (file: File) => {
    if (photos.length >= 5) {
      toast.error("Maximum 5 photos per listing")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/farmers/upload-photo", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Upload failed")
      setPhotos((p) => [...p, data.url])
      toast.success("Photo uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const submitListing = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/agent/farm-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({ agentId, ...form, photos, quantity_available: Number(form.quantity_available), negotiated_price: Number(form.negotiated_price) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Listing submitted for admin pricing")
      setForm(emptyForm())
      setPhotos([])
      loadListings()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed")
    } finally {
      setSaving(false)
    }
  }

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this draft listing?")) return
    try {
      const res = await fetch(`/api/agent/farm-listings/${id}`, {
        method: "DELETE",
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Deleted")
      loadListings()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[#0E8F3D] to-[#35B24A] text-white p-6">
        <div className="flex items-center gap-3">
          <Leaf className="h-8 w-8" />
          <div>
            <h2 className="text-xl font-bold">Farmers Friend</h2>
            <p className="text-sm text-white/90 mt-1">
              Source produce from farms. Admin sets retail price — you earn commission when orders are delivered.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="create">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="create">New listing</TabsTrigger>
          <TabsTrigger value="listings">My listings</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>List farm produce</CardTitle>
              <CardDescription>Farmer details are private — only admin sees them until logistics are arranged.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Produce name *</Label>
                  <Input className="mt-1" value={form.produce_name} onChange={(e) => setForm((f) => ({ ...f, produce_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FARM_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity available *</Label>
                  <Input className="mt-1" type="number" min={0} value={form.quantity_available} onChange={(e) => setForm((f) => ({ ...f, quantity_available: e.target.value }))} />
                </div>
                <div>
                  <Label>Farmer&apos;s price (GHS) *</Label>
                  <Input className="mt-1" type="number" min={0} step="0.01" value={form.negotiated_price} onChange={(e) => setForm((f) => ({ ...f, negotiated_price: e.target.value }))} />
                </div>
                <div>
                  <Label>Farmer name *</Label>
                  <Input className="mt-1" value={form.farmer_name} onChange={(e) => setForm((f) => ({ ...f, farmer_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Farmer phone *</Label>
                  <Input className="mt-1" type="tel" value={form.farmer_phone} onChange={(e) => setForm((f) => ({ ...f, farmer_phone: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Farmer location</Label>
                  <Input className="mt-1" value={form.farmer_location} onChange={(e) => setForm((f) => ({ ...f, farmer_location: e.target.value }))} />
                </div>
                <div>
                  <Label>Harvest date</Label>
                  <Input className="mt-1" type="date" value={form.harvest_date} onChange={(e) => setForm((f) => ({ ...f, harvest_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea className="mt-1" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div>
                <Label>Photos (max 5, compressed automatically)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {photos.map((url) => (
                    <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border">
                      <Image src={url} alt="" fill className="object-cover" />
                      <button type="button" className="absolute top-0 right-0 bg-black/50 text-white p-0.5" onClick={() => setPhotos((p) => p.filter((u) => u !== url))}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <label className="h-20 w-20 rounded-lg border border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void uploadPhoto(f)
                          e.target.value = ""
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <Button className="bg-[#0E8F3D] hover:bg-[#0A5C2A] text-white" onClick={submitListing} disabled={saving}>
                {saving ? "Submitting…" : "Submit for admin review"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Your listings</CardTitle></CardHeader>
            <CardContent>
              {loadingListings ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : listings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No listings yet.</p>
              ) : (
                <div className="space-y-3">
                  {listings.map((l) => (
                    <div key={l.id} className="border rounded-xl p-4 flex flex-wrap gap-4 justify-between">
                      <div className="flex gap-3">
                        <div className="h-14 w-14 rounded-lg bg-emerald-50 relative overflow-hidden shrink-0">
                          {l.photos[0] ? <Image src={l.photos[0]} alt="" fill className="object-cover" /> : <ImageIcon className="h-6 w-6 m-auto text-emerald-300" />}
                        </div>
                        <div>
                          <p className="font-semibold">{l.produce_name}</p>
                          <p className="text-xs text-muted-foreground">{l.quantity_available} {l.unit} · Farmer ₵{l.negotiated_price.toFixed(2)}</p>
                          <p className="text-sm font-medium text-[#0E8F3D]">Retail ₵{l.retail_price.toFixed(2)}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={l.is_published ? "default" : "secondary"}>{l.is_published ? "Published" : "Pending"}</Badge>
                            <Badge variant="outline">{l.order_count ?? 0} orders</Badge>
                          </div>
                        </div>
                      </div>
                      {!l.is_published && (
                        <Button variant="outline" size="sm" onClick={() => deleteListing(l.id)}>Delete</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Your orders</CardTitle></CardHeader>
            <CardContent>
              {loadingOrders ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={String(o.id)} className="border rounded-xl p-4 space-y-1">
                      <div className="flex justify-between">
                        <p className="font-medium">{String(o.produce_name || "Produce")}</p>
                        <Badge variant="outline">{FARM_ORDER_STATUS_LABELS[o.status as FarmOrderStatus] || String(o.status)}</Badge>
                      </div>
                      <p className="text-sm">{String(o.buyer_name)} · {String(o.buyer_phone)}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{String(o.delivery_address)}</p>
                      <div className="flex justify-between text-sm pt-1">
                        <span>Paid ₵{Number(o.total_paid).toFixed(2)}</span>
                        <span className="text-[#0E8F3D] font-medium">Commission ₵{Number(o.agent_commission).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

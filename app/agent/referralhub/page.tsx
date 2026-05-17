"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import Link from "next/link"
import { ArrowLeft, Store, Copy } from "lucide-react"

interface AgentSession {
  id: string
  full_name?: string
  phone_number?: string
  momo_number?: string
}

interface StoreProfile {
  store_name: string | null
  whatsapp_number: string | null
  phone_number: string | null
  primary_color: string | null
  business_info: string | null
}

interface DataBundle {
  id: string
  name: string
  provider: string
  size_gb: number
  price: number
}

interface ReferralService {
  id: string
  title: string
  description: string
  product_cost?: number
  commission_amount?: number
}

interface StoreSetting {
  item_id: string
  item_type: string
  is_visible: boolean
  custom_margin: number
}

interface StorefrontOrder {
  id: string
  customer_phone: string
  total_paid: number
  agent_markup: number
  status: string
  created_at: string
  data_bundles?: { name: string; provider: string }
}

export default function ReferralHubPage() {
  const router = useRouter()
  const [agent, setAgent] = useState<AgentSession | null>(null)
  const [profile, setProfile] = useState<StoreProfile>({
    store_name: "",
    whatsapp_number: "",
    phone_number: "",
    primary_color: "#3B82F6",
    business_info: "",
  })
  const [bundles, setBundles] = useState<DataBundle[]>([])
  const [services, setServices] = useState<ReferralService[]>([])
  const [settings, setSettings] = useState<StoreSetting[]>([])
  const [orders, setOrders] = useState<StorefrontOrder[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("agent")
    if (!raw) {
      router.push("/agent/login")
      return
    }
    setAgent(JSON.parse(raw))
  }, [router])

  const settingKey = (itemId: string, itemType: string) => `${itemType}:${itemId}`

  const getSetting = (itemId: string, itemType: string) =>
    settings.find((s) => s.item_id === itemId && s.item_type === itemType)

  const loadProfile = useCallback(async (agentId: string) => {
    const res = await fetch(`/api/agent/store-profile?agentId=${agentId}`, { headers: getAgentAuthHeaders() })
    const data = await res.json()
    if (data.profile) {
      setProfile({
        store_name: data.profile.store_name || "",
        whatsapp_number: data.profile.whatsapp_number || "",
        phone_number: data.profile.phone_number || "",
        primary_color: data.profile.primary_color || "#3B82F6",
        business_info: data.profile.business_info || "",
      })
    }
  }, [])

  const loadMarketplace = useCallback(async (agentId: string) => {
    const res = await fetch(`/api/agent/store-settings?agentId=${agentId}`, { headers: getAgentAuthHeaders() })
    const data = await res.json()
    setBundles(data.dataBundles || [])
    setServices(data.referralServices || [])
    setSettings(data.settings || [])
  }, [])

  const loadOrders = useCallback(async (agentId: string) => {
    const res = await fetch(`/api/agent/storefront-orders?agentId=${agentId}`, { headers: getAgentAuthHeaders() })
    const data = await res.json()
    setOrders(data.orders || [])
  }, [])

  useEffect(() => {
    if (!agent?.id) return
    loadProfile(agent.id)
    loadMarketplace(agent.id)
    loadOrders(agent.id)
  }, [agent?.id, loadProfile, loadMarketplace, loadOrders])

  const saveProfile = async () => {
    if (!agent?.id) return
    setSaving(true)
    try {
      const res = await fetch("/api/agent/store-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({ agentId: agent.id, ...profile }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Store profile saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const saveSetting = async (
    itemId: string,
    itemType: "data_bundle" | "referral_service",
    fields: { is_visible?: boolean; custom_margin?: number },
  ) => {
    if (!agent?.id) return
    try {
      const res = await fetch("/api/agent/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({ agentId: agent.id, item_id: itemId, item_type: itemType, ...fields }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      await loadMarketplace(agent.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    }
  }

  const storeUrl =
    typeof window !== "undefined" && agent?.id
      ? `${window.location.origin}/public-agent-sandbox/${agent.id}`
      : ""

  const copyStoreLink = () => {
    if (!storeUrl) return
    navigator.clipboard.writeText(storeUrl)
    toast.success("Store link copied")
  }

  if (!agent) return null

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-slate-900 text-white px-4 py-4 flex items-center gap-3">
        <Link href="/agent/dashboard">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Store className="h-5 w-5" />
            Referral Hub & Storefront
          </h1>
          <p className="text-slate-300 text-xs">Design your white-label store and manage listings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="pt-4 flex flex-wrap gap-2 items-center justify-between">
            <p className="text-sm text-muted-foreground truncate flex-1">{storeUrl}</p>
            <Button size="sm" variant="outline" onClick={copyStoreLink}>
              <Copy className="h-4 w-4 mr-1" />
              Copy store link
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile">Store Profile</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="orders">Order Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Storefront profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Store name</Label>
                  <Input
                    value={profile.store_name || ""}
                    onChange={(e) => setProfile({ ...profile, store_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Accent color</Label>
                  <Input
                    type="color"
                    value={profile.primary_color || "#3B82F6"}
                    onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                    className="h-10 w-20"
                  />
                </div>
                <div>
                  <Label>WhatsApp number</Label>
                  <Input
                    value={profile.whatsapp_number || ""}
                    onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone number</Label>
                  <Input
                    value={profile.phone_number || ""}
                    onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Bio / business info</Label>
                  <Textarea
                    rows={4}
                    value={profile.business_info || ""}
                    onChange={(e) => setProfile({ ...profile, business_info: e.target.value })}
                  />
                </div>
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? "Saving…" : "Save profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data bundles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bundles.map((b) => {
                  const s = getSetting(b.id, "data_bundle")
                  return (
                    <div key={b.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-medium">{b.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.provider} · {b.size_gb}GB · Base ₵{Number(b.price).toFixed(2)}
                          </p>
                        </div>
                        <Switch
                          checked={s?.is_visible ?? false}
                          onCheckedChange={(v) => saveSetting(b.id, "data_bundle", { is_visible: v })}
                        />
                      </div>
                      <div>
                        <Label>Custom margin (₵)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          disabled={!s?.is_visible}
                          value={s?.custom_margin ?? 0}
                          onChange={(e) =>
                            setSettings((prev) => {
                              const next = [...prev]
                              const idx = next.findIndex(
                                (x) => x.item_id === b.id && x.item_type === "data_bundle",
                              )
                              const val = parseFloat(e.target.value) || 0
                              if (idx >= 0) next[idx] = { ...next[idx], custom_margin: val }
                              else
                                next.push({
                                  item_id: b.id,
                                  item_type: "data_bundle",
                                  is_visible: true,
                                  custom_margin: val,
                                })
                              return next
                            })
                          }
                          onBlur={(e) =>
                            saveSetting(b.id, "data_bundle", {
                              custom_margin: parseFloat(e.target.value) || 0,
                              is_visible: s?.is_visible ?? true,
                            })
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map((svc) => {
                  const s = getSetting(svc.id, "referral_service")
                  return (
                    <div key={svc.id} className="border rounded-lg p-4 flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium">{svc.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{svc.description}</p>
                        <Badge variant="secondary" className="mt-1">
                          Margin locked at ₵0.00
                        </Badge>
                      </div>
                      <Switch
                        checked={s?.is_visible ?? false}
                        onCheckedChange={(v) => saveSetting(svc.id, "referral_service", { is_visible: v })}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Storefront orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                  orders.map((o) => (
                    <div key={o.id} className="border rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{o.data_bundles?.name || "Bundle"}</span>
                        <Badge>{o.status}</Badge>
                      </div>
                      <p className="text-muted-foreground">{o.customer_phone}</p>
                      <p>
                        Paid ₵{Number(o.total_paid).toFixed(2)} · Your markup ₵
                        {Number(o.agent_markup).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

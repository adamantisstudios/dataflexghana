"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"
import {
  INFLUENCER_ORDER_STATUSES,
  INFLUENCER_ORDER_STATUS_LABELS,
  type InfluencerOrderStatus,
} from "@/lib/influencer-types"
import { Download, Loader2, RefreshCw, Check, X } from "lucide-react"

const BRAND = "#0E8F3D"

type ProfileRow = {
  id: string
  agent_id: string
  bio: string | null
  photo_url: string | null
  social_handles: Record<string, string>
  audience_size: number
  niche: string | null
  approved: boolean
  agent_name: string
  agent_phone: string
}

type PackageRow = {
  id: string
  title: string
  price: number
  delivery_days: number
  is_active: boolean
  agent_name: string
}

type OrderRow = {
  id: string
  client_name: string
  client_phone: string
  requirements: string
  status: InfluencerOrderStatus
  total_price: number
  platform_fee_client: number
  platform_fee_influencer: number
  influencer_payout: number
  package_price: number
  influencer_name: string
  escrow_released: boolean
  package?: { title: string }
}

export default function InfluencersAdminTab() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [packages, setPackages] = useState<PackageRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all")

  const loadProfiles = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (statusFilter === "approved") params.set("status", "approved")
    if (statusFilter === "pending") params.set("status", "pending")
    const res = await fetch(`/api/admin/influencers/profiles?${params}`, {
      headers: getAdminAuthHeaders(),
      cache: "no-store",
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setProfiles(data.profiles || [])
  }, [search, statusFilter])

  const loadPackages = useCallback(async () => {
    const res = await fetch("/api/admin/influencers/packages", {
      headers: getAdminAuthHeaders(),
      cache: "no-store",
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setPackages(data.packages || [])
  }, [])

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams()
    if (orderStatusFilter !== "all") params.set("status", orderStatusFilter)
    const res = await fetch(`/api/admin/influencers/orders?${params}`, {
      headers: getAdminAuthHeaders(),
      cache: "no-store",
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setOrders(data.orders || [])
  }, [orderStatusFilter])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadProfiles(), loadPackages(), loadOrders()])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [loadProfiles, loadPackages, loadOrders])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const setApproval = async (id: string, approved: boolean) => {
    try {
      const res = await fetch("/api/admin/influencers/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ id, approved }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(approved ? "Profile approved" : "Profile rejected")
      loadAll()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    }
  }

  const togglePackage = async (id: string, is_active: boolean) => {
    try {
      const res = await fetch("/api/admin/influencers/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ id, is_active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      loadPackages()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    }
  }

  const updateOrderStatus = async (id: string, status: InfluencerOrderStatus) => {
    try {
      const res = await fetch("/api/admin/influencers/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Order updated")
      loadOrders()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    }
  }

  const releaseEscrow = async (id: string) => {
    try {
      const res = await fetch("/api/admin/influencers/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({ id, release_escrow: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Escrow released to influencer")
      loadOrders()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    }
  }

  const exportCsv = async () => {
    try {
      const res = await fetch("/api/admin/influencers/export", {
        headers: getAdminAuthHeaders(),
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `influencers-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("CSV downloaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Micro-Influencer Marketplace
          </h2>
          <p className="text-sm text-muted-foreground">Profiles, packages, orders &amp; escrow</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAll}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" className="text-white" style={{ backgroundColor: BRAND }} onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <Tabs defaultValue="profiles">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search name or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadProfiles()}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" onClick={loadProfiles}>
                Search
              </Button>
            </div>

            <div className="grid gap-4">
              {profiles.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    {p.photo_url ? (
                      <Image
                        src={p.photo_url}
                        alt=""
                        width={72}
                        height={72}
                        className="rounded-xl object-cover h-[72px] w-[72px] border shrink-0"
                      />
                    ) : (
                      <div className="h-[72px] w-[72px] rounded-xl bg-slate-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{p.agent_name}</h3>
                        <Badge variant={p.approved ? "default" : "secondary"}>
                          {p.approved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{p.agent_phone}</p>
                      <p className="text-sm mt-1">
                        {p.niche} · {p.audience_size.toLocaleString()} audience
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.bio}</p>
                      <p className="text-xs mt-1 break-all">
                        {Object.entries(p.social_handles || {})
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </p>
                    </div>
                    {!p.approved ? (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="text-white"
                          style={{ backgroundColor: BRAND }}
                          onClick={() => setApproval(p.id, true)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setApproval(p.id, false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setApproval(p.id, false)}>
                        Revoke
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="packages" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All packages</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Influencer</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="text-sm">{pkg.agent_name}</TableCell>
                        <TableCell>{pkg.title}</TableCell>
                        <TableCell>₵{Number(pkg.price).toFixed(2)}</TableCell>
                        <TableCell>{pkg.delivery_days}</TableCell>
                        <TableCell>
                          <Switch
                            checked={pkg.is_active}
                            onCheckedChange={(v) => togglePackage(pkg.id, v)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-4 space-y-4">
            <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {INFLUENCER_ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {INFLUENCER_ORDER_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {orders.map((o) => (
              <Card key={o.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{o.client_name}</CardTitle>
                      <CardDescription>
                        {o.influencer_name} · {o.package?.title}
                      </CardDescription>
                    </div>
                    <Badge>{INFLUENCER_ORDER_STATUS_LABELS[o.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{o.requirements}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Package</span>
                      <strong>₵{o.package_price.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Client fee (8%)</span>
                      <strong>₵{o.platform_fee_client.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Influencer fee (8%)</span>
                      <strong>₵{o.platform_fee_influencer.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Influencer payout</span>
                      <strong className="text-emerald-700">₵{o.influencer_payout.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select
                      value={o.status}
                      onValueChange={(v) => updateOrderStatus(o.id, v as InfluencerOrderStatus)}
                    >
                      <SelectTrigger className="w-44 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INFLUENCER_ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {INFLUENCER_ORDER_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {o.status === "completed" && !o.escrow_released && (
                      <Button
                        size="sm"
                        className="text-white"
                        style={{ backgroundColor: BRAND }}
                        onClick={() => releaseEscrow(o.id)}
                      >
                        Confirm release
                      </Button>
                    )}
                    {o.escrow_released && (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                        Escrow released
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

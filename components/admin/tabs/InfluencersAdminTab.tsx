"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { toast } from "sonner"
import {
  INFLUENCER_ORDER_STATUSES,
  INFLUENCER_ORDER_STATUS_LABELS,
  type InfluencerOrderStatus,
} from "@/lib/influencer-types"
import { Download, Loader2, RefreshCw, Check, X, Instagram, Eye, ExternalLink, Mail, Phone } from "lucide-react"

const BRAND = "#0E8F3D"
const PAGE_SIZE = 8

function paginate<T>(items: T[], page: number) {
  const start = (page - 1) * PAGE_SIZE
  return items.slice(start, start + PAGE_SIZE)
}

function PaginationBar({
  page,
  total,
  onPage,
}: {
  page: number
  total: number
  onPage: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span className="text-xs text-muted-foreground">
        Page {page} of {pages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  )
}

type ProfileRow = {
  id: string
  agent_id: string
  bio: string | null
  photo_url: string | null
  social_handles: Record<string, string>
  audience_size: number
  niche: string | null
  approved: boolean
  registration_source?: string
  agent_name: string
  agent_phone: string
  agent_email: string
}

function registrationBadge(source?: string) {
  if (source === "self_registered") {
    return { label: "Self-Registered", className: "bg-violet-100 text-violet-800 text-[10px] px-1.5 py-0" }
  }
  return { label: "Applied via Referral Hub", className: "bg-sky-100 text-sky-800 text-[10px] px-1.5 py-0" }
}

type PackageRow = {
  id: string
  title: string
  description: string | null
  terms: string | null
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
  paystack_reference: string | null
  review: string | null
  package_id?: string
  package?: { title: string }
}

function socialUrl(platform: string, handle: string): string {
  const h = handle.replace(/^@/, "").trim()
  const p = platform.toLowerCase()
  if (p.includes("instagram")) return `https://instagram.com/${h}`
  if (p.includes("tiktok")) return `https://tiktok.com/@${h}`
  if (p.includes("twitter") || p === "x") return `https://x.com/${h}`
  if (p.includes("youtube")) return `https://youtube.com/@${h}`
  if (h.startsWith("http")) return h
  return `https://${h}`
}

export default function InfluencersAdminTab() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [packages, setPackages] = useState<PackageRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all")
  const [packageSearch, setPackageSearch] = useState("")
  const [profilePage, setProfilePage] = useState(1)
  const [packagePage, setPackagePage] = useState(1)
  const [orderPage, setOrderPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<ProfileRow | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PackageRow | null>(null)

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

  const filteredPackages = packages.filter(
    (p) =>
      !packageSearch.trim() ||
      p.title.toLowerCase().includes(packageSearch.toLowerCase()) ||
      p.agent_name.toLowerCase().includes(packageSearch.toLowerCase()),
  )
  const pagedProfiles = paginate(profiles, profilePage)
  const pagedPackages = paginate(filteredPackages, packagePage)
  const pagedOrders = paginate(orders, orderPage)

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
            <TabsTrigger value="profiles">Profiles ({profiles.length})</TabsTrigger>
            <TabsTrigger value="packages">Packages ({packages.length})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="mt-4 space-y-3">
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

            {pagedProfiles.length === 0 ? (
              <Card className="border-dashed rounded-xl shadow-sm">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">No profiles found.</CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pagedProfiles.map((p) => (
                  <Card
                    key={p.id}
                    className="rounded-xl border border-emerald-100 shadow-sm overflow-hidden cursor-pointer hover:border-[#0E8F3D]/40 transition-colors"
                    onClick={() => setSelectedProfile(p)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-3">
                        {p.photo_url ? (
                          <Image
                            src={p.photo_url}
                            alt=""
                            width={44}
                            height={44}
                            className="rounded-full object-cover h-11 w-11 border shrink-0"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-[#e8f5ec] shrink-0 flex items-center justify-center text-sm font-semibold text-[#0E8F3D]">
                            {p.agent_name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm truncate">{p.agent_name}</h3>
                            <Badge
                              className={
                                p.approved
                                  ? "bg-[#0E8F3D] text-white text-[10px] px-1.5 py-0"
                                  : "bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0"
                              }
                            >
                              {p.approved ? "Approved" : "Pending"}
                            </Badge>
                            {(() => {
                              const b = registrationBadge(p.registration_source)
                              return (
                                <Badge className={b.className}>{b.label}</Badge>
                              )
                            })()}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{p.niche || "—"}</p>
                          <p className="text-xs font-medium text-[#0E8F3D]">
                            {p.audience_size.toLocaleString()} audience
                          </p>
                        </div>
                      </div>
                      {Object.keys(p.social_handles || {}).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(p.social_handles).map(([platform]) => (
                            <span
                              key={platform}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                            >
                              <Instagram className="h-3 w-3" />
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        {!p.approved ? (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 h-8 text-xs text-white"
                              style={{ backgroundColor: BRAND }}
                              onClick={() => setApproval(p.id, true)}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() => setApproval(p.id, false)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setApproval(p.id, false)}
                          >
                            Revoke approval
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <PaginationBar page={profilePage} total={profiles.length} onPage={setProfilePage} />
          </TabsContent>

          <TabsContent value="packages" className="mt-4 space-y-3">
            <Input
              placeholder="Search package or influencer…"
              value={packageSearch}
              onChange={(e) => {
                setPackageSearch(e.target.value)
                setPackagePage(1)
              }}
            />
            {pagedPackages.length === 0 ? (
              <Card className="border-dashed rounded-xl shadow-sm">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">No packages found.</CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pagedPackages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className="rounded-xl border border-emerald-100 shadow-sm cursor-pointer hover:border-[#0E8F3D]/40 transition-colors"
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{pkg.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{pkg.agent_name}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            pkg.is_active
                              ? "border-[#0E8F3D] text-[#0E8F3D] text-[10px] shrink-0"
                              : "text-[10px] shrink-0"
                          }
                        >
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-[#0E8F3D]">₵{Number(pkg.price).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{pkg.delivery_days} day delivery</p>
                      {pkg.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">{pkg.description}</p>
                      )}
                      <div
                        className="flex items-center justify-between pt-1 border-t border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-muted-foreground">Storefront</span>
                        <Switch
                          checked={pkg.is_active}
                          onCheckedChange={(v) => togglePackage(pkg.id, v)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <PaginationBar page={packagePage} total={filteredPackages.length} onPage={setPackagePage} />
          </TabsContent>

          <TabsContent value="orders" className="mt-4 space-y-3">
            <Select
              value={orderStatusFilter}
              onValueChange={(v) => {
                setOrderStatusFilter(v)
                setOrderPage(1)
              }}
            >
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

            {pagedOrders.length === 0 ? (
              <Card className="border-dashed rounded-xl shadow-sm">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">No orders found.</CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pagedOrders.map((o) => (
                  <Card
                    key={o.id}
                    className="rounded-xl border border-emerald-100 shadow-sm cursor-pointer hover:border-[#0E8F3D]/40 transition-colors"
                    onClick={() => setSelectedOrder(o)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono text-muted-foreground">#{o.id.slice(0, 8)}…</p>
                          <p className="font-semibold text-sm truncate">{o.client_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{o.package?.title || "Package"}</p>
                        </div>
                        <Badge className="text-[10px] shrink-0">{INFLUENCER_ORDER_STATUS_LABELS[o.status]}</Badge>
                      </div>
                      <p className="text-base font-bold text-[#0E8F3D]">₵{o.total_price.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Tap for full details
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <PaginationBar page={orderPage} total={orders.length} onPage={setOrderPage} />
          </TabsContent>
        </Tabs>
      )}

      <Sheet open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Profile details</SheetTitle>
          </SheetHeader>
          {selectedProfile && (
            <div className="mt-4 space-y-4 text-sm pb-8">
              <div className="flex items-start gap-3">
                {selectedProfile.photo_url ? (
                  <Image
                    src={selectedProfile.photo_url}
                    alt=""
                    width={64}
                    height={64}
                    className="rounded-full object-cover h-16 w-16 border shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[#e8f5ec] flex items-center justify-center text-xl font-bold text-[#0E8F3D] shrink-0">
                    {selectedProfile.agent_name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-base">{selectedProfile.agent_name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge className={selectedProfile.approved ? "bg-[#0E8F3D] text-white" : "bg-amber-100 text-amber-800"}>
                      {selectedProfile.approved ? "Approved" : "Pending"}
                    </Badge>
                    {(() => {
                      const b = registrationBadge(selectedProfile.registration_source)
                      return <Badge className={b.className}>{b.label}</Badge>
                    })()}
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Agent contact</p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#0E8F3D]" />
                  {selectedProfile.agent_phone || "—"}
                </p>
                <p className="flex items-center gap-2 break-all">
                  <Mail className="h-4 w-4 text-[#0E8F3D]" />
                  {selectedProfile.agent_email || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Niche &amp; audience</p>
                <p>{selectedProfile.niche || "—"}</p>
                <p className="text-[#0E8F3D] font-medium">{selectedProfile.audience_size.toLocaleString()} followers</p>
              </div>
              {selectedProfile.bio && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Bio</p>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedProfile.bio}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Social handles</p>
                {Object.keys(selectedProfile.social_handles || {}).length === 0 ? (
                  <p className="text-muted-foreground">None listed</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(selectedProfile.social_handles).map(([platform, handle]) => (
                      <li key={platform}>
                        <a
                          href={socialUrl(platform, handle)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0E8F3D] hover:underline inline-flex items-center gap-1"
                        >
                          {platform}: {handle}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!selectedPackage} onOpenChange={(open) => !open && setSelectedPackage(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Package details</SheetTitle>
          </SheetHeader>
          {selectedPackage && (
            <div className="mt-4 space-y-4 text-sm pb-8">
              <div>
                <p className="font-semibold text-base">{selectedPackage.title}</p>
                <p className="text-muted-foreground text-xs">{selectedPackage.agent_name}</p>
                <Badge variant="outline" className="mt-2">
                  {selectedPackage.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-[#0E8F3D]">₵{Number(selectedPackage.price).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{selectedPackage.delivery_days} day delivery</p>
              {selectedPackage.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedPackage.description}</p>
                </div>
              )}
              {selectedPackage.terms && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Terms</p>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedPackage.terms}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Orders for this package</p>
                {orders.filter((o) => o.package_id === selectedPackage.id).length === 0 ? (
                  <p className="text-muted-foreground">No orders yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {orders
                      .filter((o) => o.package_id === selectedPackage.id)
                      .map((o) => (
                        <li
                          key={o.id}
                          className="rounded border p-2 text-xs cursor-pointer hover:bg-emerald-50"
                          onClick={() => {
                            setSelectedPackage(null)
                            setSelectedOrder(o)
                          }}
                        >
                          <span className="font-mono text-muted-foreground">#{o.id.slice(0, 8)}</span> — {o.client_name}{" "}
                          <Badge className="ml-1 text-[9px]">{INFLUENCER_ORDER_STATUS_LABELS[o.status]}</Badge>
                          <span className="block font-semibold text-[#0E8F3D]">₵{o.total_price.toFixed(2)}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order details</SheetTitle>
          </SheetHeader>
          {selectedOrder && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-lg bg-slate-50 p-3 space-y-1">
                <p className="font-semibold">{selectedOrder.client_name}</p>
                <p className="text-muted-foreground">{selectedOrder.client_phone}</p>
                <p className="text-xs font-mono text-muted-foreground">ID: {selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Requirements</p>
                <p className="text-slate-700 leading-relaxed">{selectedOrder.requirements}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Package</span>
                  <strong>₵{selectedOrder.package_price.toFixed(2)}</strong>
                </div>
                <p className="col-span-2 text-muted-foreground">{selectedOrder.package?.title}</p>
                <div>
                  <span className="text-muted-foreground block">Client fee (8%)</span>
                  <strong>₵{selectedOrder.platform_fee_client.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Influencer fee (8%)</span>
                  <strong>₵{selectedOrder.platform_fee_influencer.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total paid</span>
                  <strong className="text-[#0E8F3D]">₵{selectedOrder.total_price.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Influencer payout</span>
                  <strong>₵{selectedOrder.influencer_payout.toFixed(2)}</strong>
                </div>
              </div>
              {selectedOrder.paystack_reference && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Paystack reference</p>
                  <p className="font-mono text-xs break-all">{selectedOrder.paystack_reference}</p>
                </div>
              )}
              {selectedOrder.review && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Admin notes / review</p>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedOrder.review}</p>
                </div>
              )}
              <Select
                value={selectedOrder.status}
                onValueChange={(v) => {
                  updateOrderStatus(selectedOrder.id, v as InfluencerOrderStatus)
                  setSelectedOrder({ ...selectedOrder, status: v as InfluencerOrderStatus })
                }}
              >
                <SelectTrigger>
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
              {selectedOrder.status === "completed" && !selectedOrder.escrow_released && (
                <Button
                  className="w-full text-white"
                  style={{ backgroundColor: BRAND }}
                  onClick={() => {
                    releaseEscrow(selectedOrder.id)
                    setSelectedOrder({ ...selectedOrder, escrow_released: true })
                  }}
                >
                  Confirm escrow release
                </Button>
              )}
              {selectedOrder.escrow_released && (
                <Badge variant="outline" className="text-emerald-700 border-emerald-200">
                  Escrow released
                </Badge>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

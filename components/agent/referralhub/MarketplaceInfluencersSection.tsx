"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import {
  INFLUENCER_ORDER_STATUS_LABELS,
  MIN_INFLUENCER_AUDIENCE,
  type InfluencerOrder,
  type InfluencerPackage,
  type InfluencerProfile,
  type SocialHandles,
} from "@/lib/influencer-types"
import { Loader2, Plus, Trash2, Upload, Sparkles, Package, Pencil } from "lucide-react"
import { parseJsonResponse } from "@/lib/agent-auth-utils"
import { FacePhotoUpload } from "@/components/ui/FacePhotoUpload"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const BRAND = "#0E8F3D"

type Props = { agentId: string }

const SOCIAL_PLATFORMS = ["Instagram", "TikTok", "YouTube", "Facebook", "Twitter/X", "LinkedIn"]

export function MarketplaceInfluencersSection({ agentId }: Props) {
  const [profile, setProfile] = useState<InfluencerProfile | null>(null)
  const [packages, setPackages] = useState<InfluencerPackage[]>([])
  const [orders, setOrders] = useState<InfluencerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [applyForm, setApplyForm] = useState({
    bio: "",
    photo_url: "",
    niche: "",
    audience_size: "",
  })
  const [socialRows, setSocialRows] = useState<{ platform: string; url: string }[]>([
    { platform: "Instagram", url: "" },
  ])

  const [pkgForm, setPkgForm] = useState({
    title: "",
    description: "",
    price: "",
    delivery_days: "7",
    terms: "",
  })
  const [editingPackage, setEditingPackage] = useState<InfluencerPackage | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    delivery_days: "7",
    terms: "",
  })
  const [deleteTarget, setDeleteTarget] = useState<InfluencerPackage | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const headers = getAgentAuthHeaders()
      const [profRes, pkgRes, ordRes] = await Promise.all([
        fetch(`/api/agent/influencer/profile?agentId=${agentId}`, { headers }),
        fetch(`/api/agent/influencer/packages?agentId=${agentId}`, { headers }),
        fetch(`/api/agent/influencer/orders?agentId=${agentId}`, { headers }),
      ])

      const profParsed = await parseJsonResponse(profRes)
      const pkgParsed = await parseJsonResponse(pkgRes)
      const ordParsed = await parseJsonResponse(ordRes)

      if (!profParsed.ok || !profRes.ok) {
        throw new Error(
          (profParsed.data as { error?: string }).error ||
            `Could not load profile (${profParsed.status})`,
        )
      }
      if (!pkgParsed.ok || !pkgRes.ok) {
        throw new Error(
          (pkgParsed.data as { error?: string }).error ||
            `Could not load packages (${pkgParsed.status})`,
        )
      }
      if (!ordParsed.ok || !ordRes.ok) {
        throw new Error(
          (ordParsed.data as { error?: string }).error ||
            `Could not load orders (${ordParsed.status})`,
        )
      }

      const profData = profParsed.data as { profile?: InfluencerProfile | null }
      const pkgData = pkgParsed.data as { packages?: InfluencerPackage[] }
      const ordData = ordParsed.data as { orders?: InfluencerOrder[] }

      const p = profData.profile ?? null
      setProfile(p)
      if (p) {
        setApplyForm({
          bio: p.bio || "",
          photo_url: p.photo_url || "",
          niche: p.niche || "",
          audience_size: String(p.audience_size || ""),
        })
        const handles = p.social_handles || {}
        const rows = Object.entries(handles).map(([platform, url]) => ({ platform, url }))
        setSocialRows(rows.length ? rows : [{ platform: "Instagram", url: "" }])
      }
      setPackages(pkgData.packages || [])
      setOrders(ordData.orders || [])
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load Micro-Influencers"
      toast.error(message)
      setProfile(null)
      setPackages([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    try {
      const agentRaw = localStorage.getItem("agent")
      const agent = agentRaw ? JSON.parse(agentRaw) : null
      const fd = new FormData()
      fd.append("file", file)
      const headers = getAgentAuthHeaders() as Record<string, string>
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers,
        body: fd,
      })
      const parsed = await parseJsonResponse<{ url?: string; error?: string }>(res)
      const data = parsed.data
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      setApplyForm((f) => ({ ...f, photo_url: data.url! }))
      toast.success("Photo uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const buildSocialHandles = (): SocialHandles => {
    const out: SocialHandles = {}
    for (const row of socialRows) {
      const platform = row.platform.trim()
      const url = row.url.trim()
      if (platform && url) out[platform] = url
    }
    return out
  }

  const submitApplication = async () => {
    if (!termsAccepted) {
      toast.error("You must accept the Influencer Terms")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/agent/influencer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          bio: applyForm.bio,
          photo_url: applyForm.photo_url || null,
          niche: applyForm.niche,
          audience_size: Number(applyForm.audience_size),
          social_handles: buildSocialHandles(),
          terms_accepted: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit")
      toast.success(data.message || "Application submitted")
      loadAll()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit")
    } finally {
      setSaving(false)
    }
  }

  const createPackage = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/agent/influencer/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          title: pkgForm.title,
          description: pkgForm.description,
          price: Number(pkgForm.price),
          delivery_days: Number(pkgForm.delivery_days),
          terms: pkgForm.terms || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create package")
      toast.success("Package created")
      setPkgForm({ title: "", description: "", price: "", delivery_days: "7", terms: "" })
      loadAll()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  const togglePackage = async (id: string, is_active: boolean) => {
    try {
      const res = await fetch(`/api/agent/influencer/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({ agentId, is_active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      loadAll()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    }
  }

  const openEditPackage = (pkg: InfluencerPackage) => {
    setEditingPackage(pkg)
    setEditForm({
      title: pkg.title,
      description: pkg.description || "",
      price: String(pkg.price),
      delivery_days: String(pkg.delivery_days),
      terms: pkg.terms || "",
    })
  }

  const saveEditPackage = async () => {
    if (!editingPackage) return
    if (!editForm.title.trim() || !editForm.price) {
      toast.error("Title and price are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/agent/influencer/packages/${editingPackage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAgentAuthHeaders() },
        body: JSON.stringify({
          agentId,
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          price: Number(editForm.price),
          delivery_days: Number(editForm.delivery_days),
          terms: editForm.terms.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Update failed")
      toast.success("Package updated")
      setEditingPackage(null)
      loadAll()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  const deletePackage = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/agent/influencer/packages/${deleteTarget.id}`, {
        method: "DELETE",
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      toast.success("Package deleted")
      setDeleteTarget(null)
      loadAll()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  const approved = Boolean(profile?.approved)

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm text-emerald-900">
        <p className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: BRAND }} />
          For influencers
        </p>
        <p className="mt-1">
          We bring verified clients to you, handle payment collection, and ensure you get paid for your work. No chasing
          payments.
        </p>
      </div>

      {!approved && (
        <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50">
          {profile ? "Application pending admin approval" : "Not yet applied"}
        </Badge>
      )}
      {approved && (
        <Badge className="text-white" style={{ backgroundColor: BRAND }}>
          Approved influencer
        </Badge>
      )}

      <Tabs defaultValue={approved ? "packages" : "apply"} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="apply">Apply</TabsTrigger>
          <TabsTrigger value="packages" disabled={!approved}>
            My packages
          </TabsTrigger>
          <TabsTrigger value="orders" disabled={!approved}>
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apply" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Apply as influencer</CardTitle>
              <CardDescription>
                Minimum audience: {MIN_INFLUENCER_AUDIENCE.toLocaleString()} followers. 8% platform fee applies on
                payouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Profile photo</Label>
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 mt-2">
                  {applyForm.photo_url ? (
                    <Image
                      src={applyForm.photo_url}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="rounded-full object-cover h-16 w-16 border shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-slate-100 border flex items-center justify-center shrink-0">
                      <Upload className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <FacePhotoUpload
                    label="Choose Photo"
                    uploading={uploading}
                    disabled={uploading}
                    onFile={uploadPhoto}
                    className="border-[#0E8F3D]/30 text-[#0E8F3D] hover:bg-emerald-50 flex-1 min-w-0"
                  />
                </div>
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea
                  rows={3}
                  value={applyForm.bio}
                  onChange={(e) => setApplyForm({ ...applyForm, bio: e.target.value })}
                  placeholder="Tell clients about your content style and audience…"
                />
              </div>
              <div>
                <Label>Niche</Label>
                <Input
                  value={applyForm.niche}
                  onChange={(e) => setApplyForm({ ...applyForm, niche: e.target.value })}
                  placeholder="e.g. Fashion, Tech, Comedy"
                />
              </div>
              <div>
                <Label>Audience size</Label>
                <Input
                  type="number"
                  min={MIN_INFLUENCER_AUDIENCE}
                  value={applyForm.audience_size}
                  onChange={(e) => setApplyForm({ ...applyForm, audience_size: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Social handles</Label>
                {socialRows.map((row, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Platform"
                      value={row.platform}
                      list="social-platforms"
                      onChange={(e) => {
                        const next = [...socialRows]
                        next[i] = { ...next[i], platform: e.target.value }
                        setSocialRows(next)
                      }}
                    />
                    <datalist id="social-platforms">
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                    <Input
                      placeholder="Profile URL"
                      value={row.url}
                      onChange={(e) => {
                        const next = [...socialRows]
                        next[i] = { ...next[i], url: e.target.value }
                        setSocialRows(next)
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSocialRows(socialRows.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSocialRows([...socialRows, { platform: "", url: "" }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add platform
                </Button>
              </div>
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
                />
                <label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
                  I agree to the{" "}
                  <Link href="/influencer-terms" className="font-semibold underline" style={{ color: BRAND }}>
                    Influencer Terms
                  </Link>{" "}
                  and understand the 8% platform fee.
                </label>
              </div>
              <Button
                onClick={submitApplication}
                disabled={saving}
                className="w-full sm:w-auto text-white"
                style={{ backgroundColor: BRAND }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {profile ? "Update application" : "Submit application"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Create package
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Title</Label>
                <Input value={pkgForm.title} onChange={(e) => setPkgForm({ ...pkgForm, title: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Price (GHS)</Label>
                <Input
                  type="number"
                  value={pkgForm.price}
                  onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Delivery days</Label>
                <Input
                  type="number"
                  value={pkgForm.delivery_days}
                  onChange={(e) => setPkgForm({ ...pkgForm, delivery_days: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Custom terms (optional)</Label>
                <Textarea
                  rows={2}
                  value={pkgForm.terms}
                  onChange={(e) => setPkgForm({ ...pkgForm, terms: e.target.value })}
                />
              </div>
              <Button
                onClick={createPackage}
                disabled={saving}
                className="sm:col-span-2 text-white"
                style={{ backgroundColor: BRAND }}
              >
                Add package
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#0E8F3D]" />
              Your packages ({packages.length})
            </h3>
            {packages.length === 0 ? (
              <Card className="border-dashed border-emerald-200 bg-emerald-50/30">
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 text-[#0E8F3D]/40" />
                  <p>No packages yet. Create your first package above.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className="overflow-hidden border border-emerald-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="h-1 bg-gradient-to-r from-[#0E8F3D] to-[#35B24A]" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base text-gray-900 leading-snug">{pkg.title}</CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            pkg.is_active
                              ? "border-[#0E8F3D] text-[#0E8F3D] bg-emerald-50"
                              : "text-muted-foreground"
                          }
                        >
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-bold text-[#0E8F3D]">₵{Number(pkg.price).toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">{pkg.delivery_days} day delivery</span>
                      </div>
                    </CardHeader>
                    {pkg.description && (
                      <CardContent className="pt-0 pb-3">
                        <p className="text-sm text-gray-600 line-clamp-3">{pkg.description}</p>
                      </CardContent>
                    )}
                    <CardContent className="pt-0 pb-4 space-y-3 border-t border-emerald-50 mt-1 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Visible on storefront</span>
                        <Switch checked={pkg.is_active} onCheckedChange={(v) => togglePackage(pkg.id, v)} />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 border-[#0E8F3D]/30 text-[#0E8F3D] hover:bg-emerald-50"
                          onClick={() => openEditPackage(pkg)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setDeleteTarget(pkg)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orders yet.</p>
          ) : (
            orders.map((o) => (
              <Card key={o.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between gap-2">
                    <CardTitle className="text-base">{o.client_name}</CardTitle>
                    <Badge variant="outline">{INFLUENCER_ORDER_STATUS_LABELS[o.status]}</Badge>
                  </div>
                  <CardDescription>
                    Payout: ₵{Number(o.influencer_payout).toFixed(2)} · Total paid: ₵
                    {Number(o.total_price).toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Requirements:</span> {o.requirements}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.client_phone}
                    {o.client_email ? ` · ${o.client_email}` : ""}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingPackage} onOpenChange={(open) => !open && setEditingPackage(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit package</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (GHS)</Label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Delivery days</Label>
                <Input
                  type="number"
                  value={editForm.delivery_days}
                  onChange={(e) => setEditForm({ ...editForm, delivery_days: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Custom terms (optional)</Label>
              <Textarea
                rows={2}
                value={editForm.terms}
                onChange={(e) => setEditForm({ ...editForm, terms: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPackage(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveEditPackage}
              disabled={saving}
              className="text-white"
              style={{ backgroundColor: BRAND }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete package?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deleteTarget?.title}&quot;. Packages with existing orders cannot be
              deleted — deactivate them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePackage}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={saving}
            >
              {saving ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

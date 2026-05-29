"use client"

import { useCallback, useEffect, useState } from "react"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Heart, Flag, Calendar, CheckCircle2, ShieldOff, Settings, X, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { INTENTION_LABELS } from "@/lib/dating/constants"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEFAULT_DATING_SETTINGS } from "@/lib/dating/dating-settings"

type ProfilePhotoRef = { id: string; order_index: number; public_url?: string }

type ProfileRow = {
  id: string
  agent_id: string
  display_name: string
  intentions: string
  is_approved: boolean
  is_suspended: boolean
  profile_completeness: number
  photos?: ProfilePhotoRef[]
  first_photo_id?: string | null
}

type ReportRow = {
  id: string
  reason: string
  details?: string
  status: string
  created_at: string
  reporter_agent_id: string
  reported_agent_id: string
}

export default function DatingAdminTab() {
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [sessions, setSessions] = useState<unknown[]>([])
  const [actingId, setActingId] = useState<string | null>(null)
  const [lightboxProfile, setLightboxProfile] = useState<ProfileRow | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [priceForm, setPriceForm] = useState({
    silver_price: String(DEFAULT_DATING_SETTINGS.silver_price),
    gold_price: String(DEFAULT_DATING_SETTINGS.gold_price),
    coin_pack_price: String(DEFAULT_DATING_SETTINGS.coin_pack_price),
    counselling_session_price: String(DEFAULT_DATING_SETTINGS.counselling_session_price),
  })

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dating/settings", { headers: getAdminAuthHeaders() })
      const data = await res.json()
      if (res.ok && data.settings) {
        setPriceForm({
          silver_price: String(data.settings.silver_price),
          gold_price: String(data.settings.gold_price),
          coin_pack_price: String(data.settings.coin_pack_price),
          counselling_session_price: String(data.settings.counselling_session_price),
        })
      }
    } catch {
      /* keep defaults */
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [datingRes] = await Promise.all([
        fetch("/api/admin/dating", { headers: getAdminAuthHeaders() }),
        loadSettings(),
      ])
      const data = await datingRes.json()
      if (!datingRes.ok) throw new Error(data.error || "Failed to load")
      setProfiles(data.profiles || [])
      setReports(data.reports || [])
      setSessions(data.sessions || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load dating data")
    } finally {
      setLoading(false)
    }
  }, [loadSettings])

  useEffect(() => {
    void load()
  }, [load])

  const profileAction = async (id: string, action: string) => {
    setActingId(id)
    try {
      const res = await fetch(`/api/admin/dating/profiles/${id}`, {
        method: "PATCH",
        headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")
      toast.success(`Profile ${action}d`)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed")
    } finally {
      setActingId(null)
    }
  }

  const saveSettings = async () => {
    setSettingsSaving(true)
    try {
      const res = await fetch("/api/admin/dating/settings", {
        method: "PATCH",
        headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          silver_price: Number(priceForm.silver_price),
          gold_price: Number(priceForm.gold_price),
          coin_pack_price: Number(priceForm.coin_pack_price),
          counselling_session_price: Number(priceForm.counselling_session_price),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save settings")
      toast.success("Dating prices updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings")
    } finally {
      setSettingsSaving(false)
    }
  }

  const pending = profiles.filter((p) => !p.is_approved && !p.is_suspended)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="h-6 w-6 text-rose-500" />
        <h2 className="text-xl font-semibold">Find a Date — Admin</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending approval</p>
            <p className="text-2xl font-bold">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Open reports</p>
            <p className="text-2xl font-bold">{reports.filter((r) => r.status === "open").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Counselling sessions</p>
            <p className="text-2xl font-bold">{sessions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profiles">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="counselling">Counselling</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-1" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-3 mt-4">
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dating profiles yet.</p>
          ) : (
            profiles.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border bg-muted flex items-center justify-center"
                    onClick={() => {
                      if ((p.photos?.length ?? 0) > 0) {
                        setLightboxProfile(p)
                        setLightboxIndex(0)
                      }
                    }}
                    title="View photos"
                  >
                    {p.photos?.[0]?.public_url ? (
                      <img
                        src={p.photos[0].public_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{p.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Agent {p.agent_id.slice(0, 8)}… · {INTENTION_LABELS[p.intentions as keyof typeof INTENTION_LABELS] ?? p.intentions}
                    </p>
                    <div className="mt-1 flex gap-2">
                      {p.is_approved ? (
                        <Badge className="bg-emerald-100 text-emerald-800">Approved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {p.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                      <Badge variant="outline">{p.profile_completeness}% complete</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!p.is_approved && (
                      <Button size="sm" disabled={actingId === p.id} onClick={() => profileAction(p.id, "approve")}>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                      </Button>
                    )}
                    {!p.is_suspended ? (
                      <Button size="sm" variant="destructive" disabled={actingId === p.id} onClick={() => profileAction(p.id, "suspend")}>
                        <ShieldOff className="mr-1 h-4 w-4" /> Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={actingId === p.id} onClick={() => profileAction(p.id, "unsuspend")}>
                        Unsuspend
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-3 mt-4">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Flag className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium">{r.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Report · {new Date(r.created_at).toLocaleString()}
                    </p>
                    {r.details && <p className="mt-1 text-sm text-gray-600">{r.details}</p>}
                    <Badge className="mt-2" variant="outline">{r.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="counselling" className="space-y-3 mt-4">
          {(sessions as { id: string; scheduled_at: string; status: string; agent_id: string }[]).map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Calendar className="h-4 w-4 text-rose-500" />
                <div>
                  <p className="font-medium">Agent {s.agent_id.slice(0, 8)}…</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.scheduled_at).toLocaleString()} · {s.status}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card className="border-rose-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-rose-500" />
                Dating Settings — Pricing (GH₵)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set subscription and counselling prices. Changes apply immediately to new Paystack payments.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["silver_price", "Silver plan (monthly)"],
                    ["gold_price", "Gold plan (monthly)"],
                    ["coin_pack_price", "Coin pack (one-off)"],
                    ["counselling_session_price", "Counselling session (30 min)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      min={0}
                      step="0.01"
                      className="min-h-[44px] text-base"
                      value={priceForm[key]}
                      onChange={(e) => setPriceForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <Button
                className="w-full min-h-[44px] bg-rose-600 hover:bg-rose-700"
                disabled={settingsSaving}
                onClick={() => void saveSettings()}
              >
                {settingsSaving ? "Saving…" : "Save pricing"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button variant="outline" onClick={() => void load()}>
        Refresh
      </Button>

      {lightboxProfile && (lightboxProfile.photos?.length ?? 0) > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-w-lg w-full bg-white rounded-xl overflow-hidden">
            <img
              src={lightboxProfile.photos![lightboxIndex].public_url ?? ""}
              alt=""
              className="w-full aspect-square object-contain bg-black"
            />
            <button
              type="button"
              className="absolute top-2 right-2 rounded-full bg-black/50 p-2 text-white"
              onClick={() => setLightboxProfile(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-3 flex items-center justify-between">
              <p className="font-medium text-sm">{lightboxProfile.display_name}</p>
              <p className="text-xs text-muted-foreground">
                {lightboxIndex + 1} / {lightboxProfile.photos!.length}
              </p>
            </div>
            {lightboxProfile.photos!.length > 1 && (
              <div className="flex gap-2 p-3 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={lightboxIndex <= 0}
                  onClick={() => setLightboxIndex((i) => i - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  disabled={lightboxIndex >= lightboxProfile.photos!.length - 1}
                  onClick={() => setLightboxIndex((i) => i + 1)}
                >
                  Next
                </Button>
              </div>
            )}
            {!lightboxProfile.is_approved && (
              <div className="px-3 pb-3">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={actingId === lightboxProfile.id}
                  onClick={() => {
                    void profileAction(lightboxProfile.id, "approve")
                    setLightboxProfile(null)
                  }}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Approve profile
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

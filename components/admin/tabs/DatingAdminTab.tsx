"use client"

import { useCallback, useEffect, useState } from "react"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  Heart,
  Flag,
  Calendar,
  CheckCircle2,
  ShieldOff,
  Settings,
  X,
  ImageIcon,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { INTENTION_LABELS } from "@/lib/dating/constants"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEFAULT_DATING_SETTINGS } from "@/lib/dating/dating-settings"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const REJECT_REASON_PRESETS = [
  "Inappropriate photo",
  "Fake name",
  "Sexually explicit content",
] as const

const CARD_SHELL =
  "rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden"
const TAB_TRIGGER =
  "min-h-[44px] flex-1 rounded-xl text-sm font-medium data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-700"
const TOUCH_BTN = "min-h-[44px] w-full sm:w-auto rounded-xl font-medium"

type ProfilePhotoRef = { id: string; order_index: number; public_url?: string }

type ProfileRow = {
  id: string
  agent_id: string
  display_name: string
  intentions: string
  is_approved: boolean
  is_suspended: boolean
  rejection_reason?: string | null
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

type CounsellingSession = {
  id: string
  scheduled_at: string
  status: string
  agent_id: string
  counsellor_name?: string | null
  duration_minutes?: number
  session_type?: string
}

function agentLabel(agentId: string) {
  return `Agent ${agentId.slice(0, 8)}…`
}

function ProfileStatusBadges({ p }: { p: ProfileRow }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {p.is_approved ? (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Approved</Badge>
      ) : p.rejection_reason ? (
        <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>
      ) : (
        <Badge className="bg-amber-100 text-amber-900 border-amber-200">Pending</Badge>
      )}
      {p.is_suspended && (
        <Badge className="bg-slate-800 text-white border-slate-700">Suspended</Badge>
      )}
      <Badge variant="outline" className="border-slate-200 text-slate-700 bg-slate-50">
        {p.profile_completeness}% complete
      </Badge>
    </div>
  )
}

function ReportStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  if (normalized === "open") {
    return <Badge className="bg-amber-100 text-amber-900 border-amber-200">Open</Badge>
  }
  if (normalized === "actioned") {
    return <Badge className="bg-red-100 text-red-800 border-red-200">Actioned</Badge>
  }
  return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Reviewed</Badge>
}

function SessionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-900 border-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  }
  const key = status.toLowerCase()
  return (
    <Badge className={cn("capitalize", map[key] ?? "bg-slate-100 text-slate-700 border-slate-200")}>
      {status}
    </Badge>
  )
}

export default function DatingAdminTab() {
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [sessions, setSessions] = useState<CounsellingSession[]>([])
  const [actingId, setActingId] = useState<string | null>(null)
  const [lightboxProfile, setLightboxProfile] = useState<ProfileRow | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [rejectTarget, setRejectTarget] = useState<ProfileRow | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
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
      setSessions((data.sessions || []) as CounsellingSession[])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load dating data")
    } finally {
      setLoading(false)
    }
  }, [loadSettings])

  useEffect(() => {
    void load()
  }, [load])

  const profileAction = async (
    id: string,
    action: string,
    extra?: { rejection_reason?: string },
  ) => {
    setActingId(id)
    try {
      const res = await fetch(`/api/admin/dating/profiles/${id}`, {
        method: "PATCH",
        headers: { ...getAdminAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Action failed")
      const labels: Record<string, string> = {
        approve: "approved",
        reject: "rejected",
        suspend: "suspended",
        unsuspend: "unsuspended",
      }
      toast.success(`Profile ${labels[action] ?? action}`)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed")
    } finally {
      setActingId(null)
    }
  }

  const submitReject = async () => {
    if (!rejectTarget) return
    const reason = rejectReason.trim()
    if (!reason) {
      toast.error("Enter a rejection reason")
      return
    }
    await profileAction(rejectTarget.id, "reject", { rejection_reason: reason })
    setRejectTarget(null)
    setRejectReason("")
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

  const pending = profiles.filter(
    (p) => !p.is_approved && !p.is_suspended && !p.rejection_reason,
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-600">Loading Find a Date admin…</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-md">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 truncate">Find a Date — Admin</h2>
            <p className="text-sm text-slate-600">Profiles, reports, counselling & pricing</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className={cn(TOUCH_BTN, "border-emerald-200 text-emerald-800 hover:bg-emerald-50 shrink-0")}
          onClick={() => void load()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Pending approval", value: pending.length, accent: "from-amber-50 to-white border-amber-100" },
          {
            label: "Open reports",
            value: reports.filter((r) => r.status === "open").length,
            accent: "from-orange-50 to-white border-orange-100",
          },
          {
            label: "Counselling sessions",
            value: sessions.length,
            accent: "from-emerald-50 to-white border-emerald-100",
          },
        ].map((stat) => (
          <Card key={stat.label} className={cn(CARD_SHELL, "bg-gradient-to-br", stat.accent)}>
            <CardContent className="p-4 sm:p-5">
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-2 h-auto p-1.5 bg-slate-100/80 rounded-2xl sm:grid-cols-4">
          <TabsTrigger value="profiles" className={TAB_TRIGGER}>
            Profiles
          </TabsTrigger>
          <TabsTrigger value="reports" className={TAB_TRIGGER}>
            Reports
          </TabsTrigger>
          <TabsTrigger value="counselling" className={TAB_TRIGGER}>
            Counselling
          </TabsTrigger>
          <TabsTrigger value="settings" className={TAB_TRIGGER}>
            <Settings className="h-4 w-4 mr-1.5 hidden sm:inline" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="mt-5 space-y-4 focus-visible:outline-none">
          {profiles.length === 0 ? (
            <Card className={CARD_SHELL}>
              <CardContent className="py-12 text-center text-sm text-slate-600">
                No dating profiles yet.
              </CardContent>
            </Card>
          ) : (
            profiles.map((p) => (
              <Card key={p.id} className={CARD_SHELL}>
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <button
                      type="button"
                      className="shrink-0 mx-auto sm:mx-0 w-20 h-20 sm:w-[72px] sm:h-[72px] rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      onClick={() => {
                        if ((p.photos?.length ?? 0) > 0) {
                          setLightboxProfile(p)
                          setLightboxIndex(0)
                        }
                      }}
                      title="View photos"
                    >
                      {p.photos?.[0]?.id ? (
                        <img
                          src={`/api/admin/dating/photos/${p.photos[0].id}/serve`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 w-full text-center sm:text-left space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900 break-words">
                        {p.display_name}
                      </h3>
                      <p className="text-sm text-slate-600 break-words">
                        {agentLabel(p.agent_id)} ·{" "}
                        {INTENTION_LABELS[p.intentions as keyof typeof INTENTION_LABELS] ?? p.intentions}
                      </p>
                      <ProfileStatusBadges p={p} />
                      {p.rejection_reason && (
                        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-left">
                          <span className="font-medium">Rejection reason: </span>
                          {p.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end pt-1 border-t border-slate-100">
                    {!p.is_approved && !p.rejection_reason && (
                      <>
                        <Button
                          disabled={actingId === p.id}
                          onClick={() => profileAction(p.id, "approve")}
                          className={cn(
                            TOUCH_BTN,
                            "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
                          )}
                        >
                          {actingId === p.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          disabled={actingId === p.id}
                          onClick={() => {
                            setRejectTarget(p)
                            setRejectReason("")
                          }}
                          className={cn(
                            TOUCH_BTN,
                            "bg-red-600 hover:bg-red-700 text-white shadow-sm",
                          )}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                    {!p.is_suspended ? (
                      <Button
                        disabled={actingId === p.id}
                        onClick={() => profileAction(p.id, "suspend")}
                        className={cn(
                          TOUCH_BTN,
                          "bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-sm border-amber-600",
                        )}
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        disabled={actingId === p.id}
                        onClick={() => profileAction(p.id, "unsuspend")}
                        className={cn(TOUCH_BTN, "border-slate-300 text-slate-800")}
                      >
                        Unsuspend
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-5 space-y-4 focus-visible:outline-none">
          {reports.length === 0 ? (
            <Card className={CARD_SHELL}>
              <CardContent className="py-12 text-center text-sm text-slate-600">
                No reports yet.
              </CardContent>
            </Card>
          ) : (
            reports.map((r) => {
              const expanded = expandedReportId === r.id
              return (
                <Card key={r.id} className={CARD_SHELL}>
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                        <Flag className="h-5 w-5 text-amber-700" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <ReportStatusBadge status={r.status} />
                          <span className="text-xs text-slate-500">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900 break-words">{r.reason}</p>
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 min-w-0">
                            <User className="h-4 w-4 shrink-0 text-slate-500" />
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">Reporter</p>
                              <p className="font-medium text-slate-800 truncate">
                                {agentLabel(r.reporter_agent_id)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 min-w-0">
                            <User className="h-4 w-4 shrink-0 text-red-500" />
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">Reported user</p>
                              <p className="font-medium text-slate-800 truncate">
                                {agentLabel(r.reported_agent_id)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {expanded && r.details && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <p className="text-xs font-medium text-slate-500 mb-1">Details</p>
                        <p className="whitespace-pre-wrap break-words">{r.details}</p>
                      </div>
                    )}

                    {r.details && (
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(TOUCH_BTN, "border-emerald-200 text-emerald-800")}
                        onClick={() =>
                          setExpandedReportId(expanded ? null : r.id)
                        }
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            View details
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="counselling" className="mt-5 space-y-4 focus-visible:outline-none">
          {sessions.length === 0 ? (
            <Card className={CARD_SHELL}>
              <CardContent className="py-12 text-center text-sm text-slate-600">
                No counselling sessions scheduled.
              </CardContent>
            </Card>
          ) : (
            sessions.map((s) => (
              <Card key={s.id} className={CARD_SHELL}>
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                        <Calendar className="h-5 w-5 text-rose-600" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="font-semibold text-slate-900 break-words">
                          {s.counsellor_name?.trim() || "Counsellor TBC"}
                        </p>
                        <p className="text-sm text-slate-600">{agentLabel(s.agent_id)}</p>
                        {s.session_type && (
                          <p className="text-xs text-slate-500 capitalize">{s.session_type} session</p>
                        )}
                      </div>
                    </div>
                    <SessionStatusBadge status={s.status} />
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 min-h-[44px]">
                      <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">Scheduled</p>
                        <p className="text-sm font-medium text-slate-800">
                          {new Date(s.scheduled_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 min-h-[44px]">
                      <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-xs text-slate-500">Duration</p>
                        <p className="text-sm font-medium text-slate-800">
                          {s.duration_minutes ?? 30} minutes
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                    {(["pending", "confirmed", "completed", "cancelled"] as const).map((step) => (
                      <span
                        key={step}
                        className={cn(
                          "inline-flex min-h-[36px] items-center rounded-lg px-3 text-xs font-medium capitalize border",
                          s.status.toLowerCase() === step
                            ? step === "confirmed"
                              ? "bg-emerald-600 text-white border-emerald-700"
                              : step === "completed"
                                ? "bg-blue-600 text-white border-blue-700"
                                : step === "cancelled"
                                  ? "bg-slate-500 text-white border-slate-600"
                                  : "bg-amber-500 text-amber-950 border-amber-600"
                            : "bg-white text-slate-500 border-slate-200",
                        )}
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-5 focus-visible:outline-none">
          <Card className={cn(CARD_SHELL, "border-emerald-100")}>
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 px-4 sm:px-6 py-4">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
                <Settings className="h-5 w-5 text-emerald-600 shrink-0" />
                Dating pricing (GH₵)
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1 font-normal">
                Changes apply immediately to new Paystack payments.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {(
                  [
                    ["silver_price", "Silver plan (monthly)"],
                    ["gold_price", "Gold plan (monthly)"],
                    ["coin_pack_price", "Coin pack (one-off)"],
                    ["counselling_session_price", "Counselling session (30 min)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-sm font-medium text-slate-800">
                      {label}
                    </Label>
                    <Input
                      id={key}
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      className="min-h-[44px] text-base rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                      value={priceForm[key]}
                      onChange={(e) => setPriceForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <Button
                className={cn(
                  TOUCH_BTN,
                  "w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md sm:max-w-xs",
                )}
                disabled={settingsSaving}
                onClick={() => void saveSettings()}
              >
                {settingsSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save pricing"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Reject dating profile</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {rejectTarget?.display_name} — the agent will see this reason on their dating dashboard.
          </p>
          <div className="flex flex-wrap gap-2">
            {REJECT_REASON_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant="outline"
                className="min-h-[40px] rounded-xl"
                onClick={() => setRejectReason(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-slate-800">
              Reason
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this profile cannot be approved"
              rows={3}
              className="rounded-xl min-h-[88px]"
            />
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className={TOUCH_BTN}
              onClick={() => setRejectTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className={cn(TOUCH_BTN, "bg-red-600 hover:bg-red-700")}
              disabled={actingId === rejectTarget?.id}
              onClick={() => void submitReject()}
            >
              Reject profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lightboxProfile && (lightboxProfile.photos?.length ?? 0) > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-xl">
            <img
              src={`/api/admin/dating/photos/${lightboxProfile.photos![lightboxIndex].id}/serve`}
              alt=""
              className="w-full aspect-square object-contain bg-black"
            />
            <button
              type="button"
              className="absolute top-3 right-3 rounded-full bg-black/50 p-2.5 text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setLightboxProfile(null)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-4 flex items-center justify-between gap-2 border-t border-slate-100">
              <p className="font-semibold text-sm text-slate-900 truncate">
                {lightboxProfile.display_name}
              </p>
              <p className="text-xs text-slate-500 shrink-0">
                {lightboxIndex + 1} / {lightboxProfile.photos!.length}
              </p>
            </div>
            {lightboxProfile.photos!.length > 1 && (
              <div className="flex gap-2 p-4 pt-0">
                <Button
                  variant="outline"
                  className={cn(TOUCH_BTN, "flex-1")}
                  disabled={lightboxIndex <= 0}
                  onClick={() => setLightboxIndex((i) => i - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className={cn(TOUCH_BTN, "flex-1")}
                  disabled={lightboxIndex >= lightboxProfile.photos!.length - 1}
                  onClick={() => setLightboxIndex((i) => i + 1)}
                >
                  Next
                </Button>
              </div>
            )}
            {!lightboxProfile.is_approved && (
              <div className="px-4 pb-4">
                <Button
                  className={cn(TOUCH_BTN, "w-full bg-emerald-600 hover:bg-emerald-700 text-white")}
                  disabled={actingId === lightboxProfile.id}
                  onClick={() => {
                    void profileAction(lightboxProfile.id, "approve")
                    setLightboxProfile(null)
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve profile
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

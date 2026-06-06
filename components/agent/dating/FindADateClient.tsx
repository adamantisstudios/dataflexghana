"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { parseJsonResponse } from "@/lib/agent-auth-utils"
import { AgentHeader } from "@/components/agent/AgentHeader"
import { getStoredAgent, logoutAgent } from "@/lib/unified-auth-system"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Heart,
  Loader2,
  Sparkles,
  MessageCircle,
  Crown,
  X,
  Flag,
  Ban,
  Calendar,
  Flame,
  Trash2,
} from "lucide-react"
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
import { toast } from "sonner"
import {
  DATING_INTENTIONS,
  INTENTION_LABELS,
  ICEBREAKER_PROMPTS,
  EDUCATION_OPTIONS,
  RELIGION_OPTIONS,
  LIFESTYLE_OPTIONS,
  CHILDREN_OPTIONS,
  PERSONALITY_TRAIT_OPTIONS,
  WEEKLY_AVAILABILITY_OPTIONS,
  isFemaleGender,
  type DatingIntention,
} from "@/lib/dating/constants"
import { DatingPhotoImage } from "@/components/agent/dating/DatingPhotoImage"
import { DatingProtectionNotice } from "@/components/agent/dating/DatingProtectionNotice"
import {
  DatingPhotoUploader,
  type DatingPhoto,
} from "@/components/agent/dating/DatingPhotoUploader"
import { syncAgentSessionCookie } from "@/lib/unified-auth-system"
import { DEFAULT_DATING_SETTINGS } from "@/lib/dating/dating-settings"
import type { Agent } from "@/lib/unified-auth-system"

type DiscoverProfile = {
  id: string
  agent_id: string
  display_name: string
  bio?: string
  age?: number
  gender?: string
  intentions: DatingIntention
  location?: string
  occupation?: string
  interests?: string[]
  education?: string
  religion?: string
  drinking?: string
  smoking?: string
  children?: string
  personality_traits?: string[]
  languages?: string[]
  weekly_availability?: string
  height_cm?: number
  ladies_first?: boolean
  profile_completeness: number
  compatibility_score?: number
  is_top_pick?: boolean
  first_photo_id?: string | null
  photos?: DatingPhoto[]
}

type MatchRow = {
  id: string
  other_agent_id: string
  can_send_message: boolean
  waiting_for_her: boolean
  profile?: { display_name: string; id: string }
}

function cardPhotoId(p: DiscoverProfile): string | null {
  return p.first_photo_id ?? p.photos?.[0]?.id ?? null
}

const SETUP_STEPS = 4

type PricingPlans = {
  silver: { price: number; label: string }
  gold: { price: number; label: string }
  coins: { price: number; label: string }
  counselling_session_price: number
}

const DEFAULT_PRICING: PricingPlans = {
  silver: { price: DEFAULT_DATING_SETTINGS.silver_price, label: "Silver" },
  gold: { price: DEFAULT_DATING_SETTINGS.gold_price, label: "Gold" },
  coins: { price: DEFAULT_DATING_SETTINGS.coin_pack_price, label: "Coins Pack" },
  counselling_session_price: DEFAULT_DATING_SETTINGS.counselling_session_price,
}

export default function FindADatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [tab, setTab] = useState("discover")
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null)
  const [discover, setDiscover] = useState<DiscoverProfile[]>([])
  const [topPick, setTopPick] = useState<DiscoverProfile | null>(null)
  const [limits, setLimits] = useState<Record<string, unknown> | null>(null)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [icebreakers, setIcebreakers] = useState<string[]>([...ICEBREAKER_PROMPTS])
  const [activeMatch, setActiveMatch] = useState<string | null>(null)
  const [activeMatchMeta, setActiveMatchMeta] = useState<{ waiting_for_her?: boolean; can_send_message?: boolean } | null>(null)
  const [messages, setMessages] = useState<Record<string, unknown>[]>([])
  const [chatInput, setChatInput] = useState("")
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([])
  const [setupStep, setSetupStep] = useState(0)
  const [myPhotos, setMyPhotos] = useState<DatingPhoto[]>([])
  const [detailProfile, setDetailProfile] = useState<DiscoverProfile | null>(null)
  const [detailPhotoIndex, setDetailPhotoIndex] = useState(0)
  const [editingProfile, setEditingProfile] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState(false)
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    age: "",
    gender: "",
    interested_in: "everyone",
    relationship_status: "single",
    intentions: "serious_relationship" as DatingIntention,
    location: "",
    occupation: "",
    interests: "",
    height_cm: "",
    education: "",
    religion: "",
    drinking: "",
    smoking: "",
    children: "",
    languages: "",
    personality_traits: [] as string[],
    weekly_availability: "",
    ladies_first: false,
    terms_accepted: false,
    min_age: "18",
    max_age: "60",
    max_distance_km: "100",
    preferred_genders: [] as string[],
  })
  const [swiping, setSwiping] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pricing, setPricing] = useState<PricingPlans>(DEFAULT_PRICING)

  const headers = useCallback(() => getAgentAuthHeaders(), [])

  const loadPricing = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/dating/settings")
      const { data } = await parseJsonResponse(res)
      if (res.ok && data.plans) {
        setPricing({
          silver: { price: Number(data.plans.silver?.price ?? DEFAULT_PRICING.silver.price), label: "Silver" },
          gold: { price: Number(data.plans.gold?.price ?? DEFAULT_PRICING.gold.price), label: "Gold" },
          coins: { price: Number(data.plans.coins?.price ?? DEFAULT_PRICING.coins.price), label: "Coins Pack" },
          counselling_session_price: Number(
            data.counselling_session_price ?? DEFAULT_PRICING.counselling_session_price,
          ),
        })
      }
    } catch {
      setPricing(DEFAULT_PRICING)
    }
  }, [])

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/dating/profile", { headers: headers() })
      const { data } = await parseJsonResponse(res)
      if (res.ok) {
        setProfile(data.profile ?? null)
        setSubscription(data.subscription ?? null)
        setLoadError(null)
        if (data.profile) {
          const p = data.profile as Record<string, unknown>
          const prefs = data.preferences as Record<string, unknown> | null
          setMyPhotos((p.photos as DatingPhoto[]) ?? [])
          setForm((f) => ({
            ...f,
            display_name: String(p.display_name ?? f.display_name),
            bio: String(p.bio ?? ""),
            age: p.age ? String(p.age) : "",
            gender: String(p.gender ?? ""),
            interested_in: String(p.interested_in ?? f.interested_in),
            relationship_status: String(p.relationship_status ?? f.relationship_status),
            intentions: (p.intentions as DatingIntention) ?? f.intentions,
            location: String(p.location ?? ""),
            occupation: String(p.occupation ?? ""),
            interests: Array.isArray(p.interests) ? (p.interests as string[]).join(", ") : "",
            height_cm: p.height_cm ? String(p.height_cm) : "",
            education: String(p.education ?? ""),
            religion: String(p.religion ?? ""),
            drinking: String(p.drinking ?? ""),
            smoking: String(p.smoking ?? ""),
            children: String(p.children ?? ""),
            languages: Array.isArray(p.languages) ? (p.languages as string[]).join(", ") : "",
            personality_traits: Array.isArray(p.personality_traits)
              ? (p.personality_traits as string[])
              : [],
            weekly_availability: String(p.weekly_availability ?? ""),
            ladies_first: Boolean(p.ladies_first),
            min_age: prefs?.min_age != null ? String(prefs.min_age) : f.min_age,
            max_age: prefs?.max_age != null ? String(prefs.max_age) : f.max_age,
            max_distance_km:
              prefs?.max_distance_km != null ? String(prefs.max_distance_km) : f.max_distance_km,
            preferred_genders: Array.isArray(prefs?.preferred_genders)
              ? (prefs.preferred_genders as string[])
              : f.preferred_genders,
          }))
        }
        return data
      }
      setLoadError(data.error || "Could not load dating profile")
      setProfile(null)
      setSubscription({
        plan: "free",
        swipes_remaining: 10,
        matches_remaining: 2,
        streak_count: 0,
      })
    } catch {
      setLoadError("Network error loading dating profile")
      setProfile(null)
      setSubscription({
        plan: "free",
        swipes_remaining: 10,
        matches_remaining: 2,
        streak_count: 0,
      })
    }
    return null
  }, [headers])

  const loadDiscover = useCallback(async () => {
    const res = await fetch("/api/agent/dating/discover", { headers: headers() })
    const { data } = await parseJsonResponse(res)
    if (res.ok) {
      setDiscover(data.profiles || [])
      setTopPick(data.top_pick || null)
      setLimits(data.limits)
      setSubscription((s) => data.limits ? { ...s, ...data.limits } : s)
    }
  }, [headers])

  const loadMatches = useCallback(async () => {
    const res = await fetch("/api/agent/dating/matches", { headers: headers() })
    const { data } = await parseJsonResponse(res)
    if (res.ok) {
      setMatches(data.matches || [])
      setIcebreakers(data.icebreakers || [...ICEBREAKER_PROMPTS])
    }
  }, [headers])

  const loadSubscription = useCallback(async () => {
    const res = await fetch("/api/agent/dating/subscription", { headers: headers() })
    const { data } = await parseJsonResponse(res)
    if (res.ok) setSubscription(data.subscription)
  }, [headers])

  const loadCounselling = useCallback(async () => {
    const res = await fetch("/api/agent/dating/counselling", { headers: headers() })
    const { data } = await parseJsonResponse(res)
    if (res.ok) setSessions(data.sessions || [])
  }, [headers])

  useEffect(() => {
    const stored = getStoredAgent()
    if (!stored) {
      router.replace("/agent/login")
      return
    }
    setAgent(stored)
    syncAgentSessionCookie()
    setAuthChecked(true)
  }, [router])

  useEffect(() => {
    if (!authChecked || !agent?.id) return

    let cancelled = false
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setLoading(false)
        setLoadError((prev) => prev ?? "Loading timed out — showing available content")
      }
    }, 8000)

    void (async () => {
      setLoading(true)
      try {
        await Promise.all([loadProfile(), loadPricing()])
      } finally {
        if (!cancelled) setLoading(false)
        window.clearTimeout(timeout)
      }
    })()

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [authChecked, agent?.id, loadProfile, loadPricing])

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("Payment successful!")
      void loadSubscription()
    }
  }, [searchParams, loadSubscription])

  useEffect(() => {
    if (!profile?.is_approved) return
    if (tab === "discover") void loadDiscover()
    if (tab === "matches") void loadMatches()
    if (tab === "subscription") void loadSubscription()
    if (tab === "counselling") void loadCounselling()
  }, [tab, profile, loadDiscover, loadMatches, loadSubscription, loadCounselling])

  const saveDraftProfile = async () => {
    const interests = form.interests.split(",").map((s) => s.trim()).filter(Boolean)
    const res = await fetch("/api/agent/dating/profile", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: form.display_name,
        bio: form.bio,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        intentions: form.intentions,
        location: form.location,
        interests,
        ladies_first: form.ladies_first,
        save_draft: true,
        terms_accepted: false,
      }),
    })
    const { data } = await parseJsonResponse(res)
    if (res.ok && data.profile) {
      setProfile(data.profile)
      if (data.profile.photos) setMyPhotos(data.profile.photos as DatingPhoto[])
    }
    return res.ok
  }

  const goSetupNext = async () => {
    if (setupStep === 1 && !profile) {
      if (!form.display_name.trim()) {
        toast.error("Display name is required")
        return
      }
      const ok = await saveDraftProfile()
      if (!ok) {
        toast.error("Save your info before adding photos")
        return
      }
    }
    setSetupStep((s) => s + 1)
  }

  const saveProfile = async () => {
    if (myPhotos.length === 0) {
      toast.error("Upload at least one dating profile photo before submitting for approval.")
      setSetupStep(2)
      return
    }
    const interests = form.interests.split(",").map((s) => s.trim()).filter(Boolean)
    const languages = form.languages.split(",").map((s) => s.trim()).filter(Boolean)
    const res = await fetch("/api/agent/dating/profile", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: form.display_name,
        bio: form.bio,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
        interested_in: form.interested_in,
        relationship_status: form.relationship_status,
        intentions: form.intentions,
        location: form.location,
        occupation: form.occupation,
        interests,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        education: form.education || null,
        religion: form.religion || null,
        drinking: form.drinking || null,
        smoking: form.smoking || null,
        children: form.children || null,
        languages,
        personality_traits: form.personality_traits,
        weekly_availability: form.weekly_availability || null,
        ladies_first: form.ladies_first,
        terms_accepted: form.terms_accepted || editingProfile,
        preferences: {
          min_age: Number(form.min_age) || 18,
          max_age: Number(form.max_age) || 60,
          max_distance_km: Number(form.max_distance_km) || 100,
          preferred_genders: form.preferred_genders,
        },
      }),
    })
    const { data } = await parseJsonResponse(res)
    if (!res.ok) {
      toast.error(data.error || "Failed to save profile")
      return
    }
    toast.success(editingProfile ? "Profile updated" : "Profile saved — pending admin approval")
    setProfile(data.profile)
    if (data.profile?.photos) setMyPhotos(data.profile.photos as DatingPhoto[])
    setSetupStep(0)
    setEditingProfile(false)
  }

  const toggleTrait = (trait: string) => {
    setForm((f) => ({
      ...f,
      personality_traits: f.personality_traits.includes(trait)
        ? f.personality_traits.filter((t) => t !== trait)
        : [...f.personality_traits, trait],
    }))
  }

  const reportProfile = async (targetAgentId: string) => {
    const reason = prompt("Reason for report?")
    if (!reason) return
    await fetch("/api/agent/dating/report", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ reported_agent_id: targetAgentId, reason }),
    })
    toast.success("Report submitted")
    setDetailProfile(null)
  }

  const deleteMyDatingProfile = async () => {
    setDeletingProfile(true)
    try {
      const res = await fetch("/api/agent/dating/profile", {
        method: "DELETE",
        headers: headers(),
      })
      const { data } = await parseJsonResponse(res)
      if (!res.ok) {
        toast.error(data.error || "Failed to delete profile")
        return
      }
      setDeleteDialogOpen(false)
      toast.success("Your dating profile has been permanently deleted")
      router.push("/agent/dashboard")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete profile")
    } finally {
      setDeletingProfile(false)
    }
  }

  const blockProfile = async (targetAgentId: string) => {
    await fetch("/api/agent/dating/block", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ blocked_agent_id: targetAgentId }),
    })
    toast.success("Blocked")
    setDetailProfile(null)
    void loadDiscover()
  }

  const swipe = async (targetAgentId: string, direction: "like" | "pass", isTop = false) => {
    setSwiping(true)
    try {
      const res = await fetch("/api/agent/dating/swipe", {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ target_agent_id: targetAgentId, direction, is_top_pick: isTop }),
      })
      const { data } = await parseJsonResponse(res)
      if (!res.ok) {
        toast.error(data.error || "Swipe failed")
        return
      }
      if (data.matched) toast.success("It's a match!")
      setDiscover((d) => d.filter((p) => p.agent_id !== targetAgentId))
      if (topPick?.agent_id === targetAgentId) setTopPick(null)
      void loadDiscover()
    } finally {
      setSwiping(false)
    }
  }

  const openChat = async (matchId: string) => {
    setActiveMatch(matchId)
    const res = await fetch(`/api/agent/dating/messages/${matchId}`, { headers: headers() })
    const { data } = await parseJsonResponse(res)
    if (res.ok) {
      setMessages(data.messages || [])
      setActiveMatchMeta(data.match || null)
    }
  }

  const sendMessage = async (content: string, messageType = "text") => {
    if (!activeMatch || !content.trim()) return
    const res = await fetch(`/api/agent/dating/messages/${activeMatch}`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ content, message_type: messageType }),
    })
    const { data } = await parseJsonResponse(res)
    if (!res.ok) {
      toast.error(data.error || "Failed to send")
      return
    }
    setChatInput("")
    void openChat(activeMatch)
  }

  const purchasePlan = async (plan: string) => {
    const res = await fetch("/api/paystack/dating/initialize", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ plan, terms_accepted: true }),
    })
    const { data } = await parseJsonResponse(res)
    if (!res.ok) {
      toast.error(data.error || "Payment failed")
      return
    }
    window.location.href = data.authorization_url
  }

  const currentCard = topPick ?? discover[0]

  if (!authChecked || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    )
  }

  const completeness = Number(profile?.profile_completeness ?? 0)
  const needsSetup = !profile || editingProfile
  const rejectionReason =
    profile && typeof profile.rejection_reason === "string" && profile.rejection_reason.trim()
      ? profile.rejection_reason.trim()
      : null
  const isRejected = Boolean(rejectionReason)
  const pendingApproval =
    profile && !profile.is_approved && !isRejected && !editingProfile
  const setupProgress = ((setupStep + 1) / SETUP_STEPS) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50/30">
      <AgentHeader
        fullName={agent.full_name}
        profileImageUrl={
          typeof (agent as Agent & { profile_image_url?: string }).profile_image_url ===
          "string"
            ? (agent as Agent & { profile_image_url?: string }).profile_image_url
            : undefined
        }
        agent={agent}
        walletBalance={agent.wallet_balance}
        onLogout={() => {
          logoutAgent()
          router.push("/agent/login")
        }}
      />

      <div className="mx-auto max-w-lg px-3 pb-24 pt-4 sm:max-w-xl sm:px-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
              Find a Date
            </h1>
            <p className="text-xs text-gray-500">Meaningful connections for approved agents</p>
          </div>
          <Link href="/dating-terms" className="text-xs text-rose-600 underline">
            Terms
          </Link>
        </div>

        {loadError && (
          <p className="mb-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {loadError}
          </p>
        )}

        {profile && (
          <Card className="mb-4 border-rose-100 bg-white/80">
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Profile {completeness}% complete</span>
                <span className="text-rose-600">
                  {limits?.swipes_remaining != null
                    ? `${limits.swipes_remaining} swipes left · Resets in ${limits.resets_in}`
                    : ""}
                </span>
              </div>
              <Progress value={completeness} className="h-2" />
              {completeness < 40 && (
                <p className="text-[11px] text-amber-700 font-medium">
                  Complete your profile to appear in more matches.
                </p>
              )}
              {completeness < 80 && completeness >= 40 && (
                <p className="text-[11px] text-gray-500">
                  Add more details and photos to boost your visibility.
                </p>
              )}
              {profile?.is_approved && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setEditingProfile(true)
                    setSetupStep(0)
                  }}
                >
                  Edit profile
                </Button>
              )}
              {(limits?.streak_count as number) > 0 && (
                <p className="text-[11px] text-amber-700 flex items-center gap-1">
                  <Flame className="h-3 w-3" /> {limits?.streak_count} day streak
                </p>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full text-xs mt-1"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete My Dating Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {isRejected && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold text-red-900">Profile rejected</p>
              <p className="text-sm text-red-800">{rejectionReason}</p>
              <p className="text-xs text-red-700">
                Update your photos and profile details, then save again. An admin will review your resubmission.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300"
                onClick={() => {
                  setEditingProfile(true)
                  setSetupStep(0)
                }}
              >
                Edit and resubmit profile
              </Button>
            </CardContent>
          </Card>
        )}

        {needsSetup || pendingApproval || (isRejected && editingProfile) ? (
          <Card className="border-rose-100">
            <CardContent className="p-4 space-y-4">
              {needsSetup && !pendingApproval && !isRejected && (
                <div className="rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-900">
                  <p className="font-medium">Create your dating profile</p>
                  <p className="mt-1 text-rose-800/90">
                    Set up an honest profile to connect with other approved agents seeking meaningful relationships.
                  </p>
                </div>
              )}
              {pendingApproval ? (
                <p className="text-sm text-amber-800 bg-amber-50 rounded-lg p-3">
                  Your profile is under review. An admin will approve it shortly — check back soon.
                </p>
              ) : (
                <>
                  <div className="space-y-2 rounded-lg border border-rose-100 bg-rose-50/50 p-3">
                    <div className="flex justify-between text-xs">
                      <span>Profile completeness</span>
                      <span className="font-medium text-rose-700">{completeness}%</span>
                    </div>
                    <Progress value={completeness} className="h-2" />
                    {completeness < 40 && (
                      <p className="text-[11px] text-amber-700">
                        Complete your profile to appear in more matches.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-800">
                      Step {setupStep + 1} of {SETUP_STEPS}
                    </p>
                    <Progress value={setupProgress} className="h-1.5" />
                  </div>
                  {setupStep === 0 && (
                    <div className="space-y-3">
                      <div>
                        <Label>Display name</Label>
                        <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Age</Label>
                          <Input type="number" min={18} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                        </div>
                        <div>
                          <Label>Gender</Label>
                          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="female">Woman</SelectItem>
                              <SelectItem value="male">Man</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Intentions (required)</Label>
                        <Select value={form.intentions} onValueChange={(v) => setForm({ ...form, intentions: v as DatingIntention })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DATING_INTENTIONS.map((i) => (
                              <SelectItem key={i} value={i}>{INTENTION_LABELS[i]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={form.ladies_first} onCheckedChange={(c) => setForm({ ...form, ladies_first: Boolean(c) })} />
                        <Label className="text-sm font-normal">Ladies First — only I start the chat after a match</Label>
                      </div>
                    </div>
                  )}
                  {setupStep === 1 && (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      <div>
                        <Label>Bio</Label>
                        <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="What makes you, you?" />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, region" />
                      </div>
                      <div>
                        <Label>Occupation</Label>
                        <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
                      </div>
                      <div>
                        <Label>Interests (comma-separated)</Label>
                        <Input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Education</Label>
                          <Select value={form.education || "_"} onValueChange={(v) => setForm({ ...form, education: v === "_" ? "" : v })}>
                            <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_">—</SelectItem>
                              {EDUCATION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Religion</Label>
                          <Select value={form.religion || "_"} onValueChange={(v) => setForm({ ...form, religion: v === "_" ? "" : v })}>
                            <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_">—</SelectItem>
                              {RELIGION_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Drinking</Label>
                          <Select value={form.drinking || "_"} onValueChange={(v) => setForm({ ...form, drinking: v === "_" ? "" : v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_">—</SelectItem>
                              {LIFESTYLE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Smoking</Label>
                          <Select value={form.smoking || "_"} onValueChange={(v) => setForm({ ...form, smoking: v === "_" ? "" : v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_">—</SelectItem>
                              {LIFESTYLE_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Children</Label>
                        <Select value={form.children || "_"} onValueChange={(v) => setForm({ ...form, children: v === "_" ? "" : v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_">—</SelectItem>
                            {CHILDREN_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block">Personality</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {PERSONALITY_TRAIT_OPTIONS.map((t) => (
                            <button
                              key={t}
                              type="button"
                              className={`rounded-full px-2.5 py-1 text-xs border ${form.personality_traits.includes(t) ? "bg-rose-100 border-rose-400 text-rose-800" : "border-gray-200"}`}
                              onClick={() => toggleTrait(t)}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Availability</Label>
                        <Select value={form.weekly_availability || "_"} onValueChange={(v) => setForm({ ...form, weekly_availability: v === "_" ? "" : v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_">—</SelectItem>
                            {WEEKLY_AVAILABILITY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {setupStep === 2 && (
                    <div className="space-y-3">
                      <DatingPhotoUploader photos={myPhotos} onPhotosChange={setMyPhotos} />
                      {myPhotos.length === 0 && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                          At least one clear, decent photo is required before your dating profile can be submitted for admin review.
                        </p>
                      )}
                    </div>
                  )}
                  {setupStep === 3 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Min age</Label>
                          <Input type="number" min={18} value={form.min_age} onChange={(e) => setForm({ ...form, min_age: e.target.value })} />
                        </div>
                        <div>
                          <Label>Max age</Label>
                          <Input type="number" max={100} value={form.max_age} onChange={(e) => setForm({ ...form, max_age: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <Label>Max distance (km)</Label>
                        <Input type="number" value={form.max_distance_km} onChange={(e) => setForm({ ...form, max_distance_km: e.target.value })} />
                      </div>
                      <div className="flex items-start gap-2">
                        <Checkbox checked={form.terms_accepted} onCheckedChange={(c) => setForm({ ...form, terms_accepted: Boolean(c) })} />
                        <Label className="text-xs font-normal leading-relaxed">
                          I agree to the{" "}
                          <Link href="/dating-terms" className="text-rose-600 underline">Dating Terms</Link>
                          . No hookups, no screenshotting, serious intentions only.
                        </Label>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {setupStep > 0 && (
                      <Button variant="outline" className="flex-1" onClick={() => setSetupStep((s) => s - 1)}>Back</Button>
                    )}
                    {setupStep < SETUP_STEPS - 1 ? (
                      <Button className="flex-1 bg-rose-600 hover:bg-rose-700" onClick={() => void goSetupNext()}>Next</Button>
                    ) : (
                      <Button
                        className="flex-1 bg-rose-600 hover:bg-rose-700"
                        onClick={() => void saveProfile()}
                        disabled={(!form.terms_accepted && !editingProfile) || myPhotos.length === 0}
                      >
                        {editingProfile ? "Save changes" : "Submit for approval"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="discover" className="text-xs">Discover</TabsTrigger>
              <TabsTrigger value="matches" className="text-xs">Matches</TabsTrigger>
              <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
              <TabsTrigger value="counselling" className="text-xs">Counsel</TabsTrigger>
              <TabsTrigger value="subscription" className="text-xs">Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="mt-4 space-y-4">
              <DatingProtectionNotice />
              {topPick && (
                <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-rose-50 overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      type="button"
                      className="relative aspect-[4/5] max-h-[420px] w-full bg-gray-100 block"
                      onClick={() => { setDetailProfile(topPick); setDetailPhotoIndex(0) }}
                    >
                      {cardPhotoId(topPick) ? (
                        <DatingPhotoImage
                          photoId={cardPhotoId(topPick)!}
                          protected
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400 text-sm">No photo</div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-amber-500">
                        <Sparkles className="h-3 w-3 mr-1" /> Top Pick
                      </Badge>
                      {topPick.ladies_first && isFemaleGender(topPick.gender) && (
                        <Badge className="absolute top-3 right-3 bg-rose-600">Ladies First</Badge>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white text-left">
                        <p className="font-semibold text-lg">{topPick.display_name}{topPick.age ? `, ${topPick.age}` : ""}</p>
                        <p className="text-xs opacity-90">{INTENTION_LABELS[topPick.intentions]} · {topPick.compatibility_score ?? 0}% match</p>
                      </div>
                    </button>
                    <div className="flex gap-2 p-3">
                      <Button variant="outline" className="flex-1" disabled={swiping} onClick={() => swipe(topPick.agent_id, "pass", true)}>
                        <X className="h-5 w-5" />
                      </Button>
                      <Button className="flex-1 bg-rose-600" disabled={swiping} onClick={() => swipe(topPick.agent_id, "like", true)}>
                        <Heart className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentCard && !topPick && (
                <Card className="overflow-hidden border-rose-100 shadow-lg">
                  <button
                    type="button"
                    className="relative aspect-[4/5] max-h-[480px] w-full bg-gray-100 block"
                    onClick={() => { setDetailProfile(currentCard); setDetailPhotoIndex(0) }}
                  >
                    {cardPhotoId(currentCard) ? (
                      <DatingPhotoImage
                        photoId={cardPhotoId(currentCard)!}
                        protected
                        className="h-full w-full"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">No photo</div>
                    )}
                    {currentCard.ladies_first && isFemaleGender(currentCard.gender) && (
                      <Badge className="absolute top-3 right-3 bg-rose-600">Ladies First</Badge>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-4 text-white text-left">
                      <p className="font-semibold text-xl">{currentCard.display_name}{currentCard.age ? `, ${currentCard.age}` : ""}</p>
                      <p className="text-sm opacity-90">{currentCard.compatibility_score ?? 0}% compatible</p>
                      <Badge className="mt-2 bg-white/20">{INTENTION_LABELS[currentCard.intentions]}</Badge>
                    </div>
                  </button>
                  <div className="flex gap-3 p-4">
                    <Button variant="outline" size="lg" className="flex-1 rounded-full" disabled={swiping} onClick={() => swipe(currentCard.agent_id, "pass")}>
                      <X className="h-6 w-6" />
                    </Button>
                    <Button size="lg" className="flex-1 rounded-full bg-rose-600 hover:bg-rose-700" disabled={swiping} onClick={() => swipe(currentCard.agent_id, "like")}>
                      <Heart className="h-6 w-6 fill-white" />
                    </Button>
                  </div>
                </Card>
              )}

              {detailProfile && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
                  <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/5] bg-gray-900">
                        {(detailProfile.photos?.length ?? 0) > 0 ? (
                          <>
                            <DatingPhotoImage
                              photoId={detailProfile.photos![detailPhotoIndex].id}
                              protected
                              className="h-full w-full"
                            />
                            {detailProfile.photos!.length > 1 && (
                              <div className="absolute bottom-16 inset-x-0 flex justify-center gap-1">
                                {detailProfile.photos!.map((ph, i) => (
                                  <button
                                    key={ph.id}
                                    type="button"
                                    className={`h-1.5 w-6 rounded-full ${i === detailPhotoIndex ? "bg-white" : "bg-white/40"}`}
                                    onClick={() => setDetailPhotoIndex(i)}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        ) : cardPhotoId(detailProfile) ? (
                          <DatingPhotoImage
                            photoId={cardPhotoId(detailProfile)!}
                            protected
                            className="h-full w-full"
                          />
                        ) : null}
                        <button
                          type="button"
                          className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white"
                          onClick={() => setDetailProfile(null)}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <h3 className="text-xl font-bold">
                          {detailProfile.display_name}
                          {detailProfile.age ? `, ${detailProfile.age}` : ""}
                        </h3>
                        <p className="text-sm text-rose-600 font-medium">{detailProfile.compatibility_score ?? 0}% compatible</p>
                        {detailProfile.bio && <p className="text-sm text-gray-700">{detailProfile.bio}</p>}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          {detailProfile.location && <span>📍 {detailProfile.location}</span>}
                          {detailProfile.occupation && <span>💼 {detailProfile.occupation}</span>}
                          {detailProfile.education && <span>🎓 {detailProfile.education}</span>}
                          {detailProfile.religion && <span>{detailProfile.religion}</span>}
                        </div>
                        {detailProfile.interests && detailProfile.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {detailProfile.interests.map((i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => void reportProfile(detailProfile.agent_id)}>
                            <Flag className="h-4 w-4 mr-1" /> Report
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => void blockProfile(detailProfile.agent_id)}>
                            <Ban className="h-4 w-4 mr-1" /> Block
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" disabled={swiping} onClick={() => { void swipe(detailProfile.agent_id, "pass"); setDetailProfile(null) }}>
                            Pass
                          </Button>
                          <Button className="flex-1 bg-rose-600" disabled={swiping} onClick={() => { void swipe(detailProfile.agent_id, "like"); setDetailProfile(null) }}>
                            Like
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!currentCard && (
                <p className="text-center text-sm text-gray-500 py-12">No more profiles right now. Check back later!</p>
              )}
            </TabsContent>

            <TabsContent value="matches" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {matches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="rounded-xl border border-rose-100 bg-white p-3 text-left shadow-sm hover:border-rose-300"
                    onClick={() => { setTab("chat"); void openChat(m.id) }}
                  >
                    <p className="font-medium truncate">{m.profile?.display_name ?? "Match"}</p>
                    {m.waiting_for_her && <p className="text-[10px] text-amber-700 mt-1">Awaiting her message</p>}
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-4">
              {!activeMatch ? (
                <p className="text-sm text-gray-500 text-center py-8">Select a match to chat</p>
              ) : (
                <div className="space-y-3">
                  {activeMatchMeta?.waiting_for_her && (
                    <p className="text-sm text-amber-800 bg-amber-50 rounded-lg p-3">
                      She will start the conversation when she&apos;s ready.
                    </p>
                  )}
                  {activeMatchMeta?.can_send_message && messages.length === 0 && (
                    <Button className="w-full bg-rose-600" onClick={() => void sendMessage("Hi! I'd love to get to know you better.", "text")}>
                      <MessageCircle className="h-4 w-4 mr-2" /> Start Chat
                    </Button>
                  )}
                  <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border p-3 bg-white">
                    {messages.map((msg) => (
                      <div key={String(msg.id)} className={`text-sm rounded-lg px-3 py-2 max-w-[85%] ${msg.sender_agent_id === agent.id ? "ml-auto bg-rose-100" : "bg-gray-100"}`}>
                        {String(msg.content)}
                        {msg.read_at && <span className="block text-[10px] text-gray-400">Read</span>}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {icebreakers.map((ib) => (
                      <Button key={ib} variant="outline" size="sm" className="text-xs h-auto py-1" onClick={() => void sendMessage(ib, "icebreaker")}>
                        {ib.slice(0, 40)}…
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      disabled={activeMatchMeta?.waiting_for_her}
                    />
                    <Button
                      className="bg-rose-600"
                      disabled={activeMatchMeta?.waiting_for_her}
                      onClick={() => void sendMessage(chatInput)}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="counselling" className="mt-4 space-y-3">
              <p className="text-sm text-gray-600">
                1 free 30-min intro session on activation. Gold: 1 free session/month. Extra sessions: GH₵{" "}
                {pricing.counselling_session_price.toFixed(2)}.
              </p>
              {sessions.map((s) => (
                <Card key={String(s.id)}>
                  <CardContent className="p-3 flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-rose-500" />
                    {new Date(String(s.scheduled_at)).toLocaleString()} — {String(s.status)}
                    {s.is_free && <Badge variant="secondary" className="ml-auto">Free</Badge>}
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const scheduled = new Date()
                  scheduled.setDate(scheduled.getDate() + 7)
                  const res = await fetch("/api/agent/dating/counselling/purchase", {
                    method: "POST",
                    headers: { ...headers(), "Content-Type": "application/json" },
                    body: JSON.stringify({ scheduled_at: scheduled.toISOString() }),
                  })
                  const { data } = await parseJsonResponse(res)
                  if (res.ok && data.authorization_url) window.location.href = data.authorization_url
                  else toast.error(data.error || "Failed")
                }}
              >
                Book additional session (GH₵ {pricing.counselling_session_price.toFixed(2)})
              </Button>
            </TabsContent>

            <TabsContent value="subscription" className="mt-4 space-y-3">
              <Card>
                <CardContent className="p-4">
                  <p className="font-medium flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Current: {String(subscription?.plan ?? "free")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {limits?.swipes_remaining ?? "—"} swipes · {limits?.matches_remaining ?? "—"} matches today
                  </p>
                </CardContent>
              </Card>
              {[
                { id: "silver", label: `Silver — GH₵ ${pricing.silver.price.toFixed(2)}/mo`, desc: "50 swipes, 10 matches, read receipts" },
                { id: "gold", label: `Gold — GH₵ ${pricing.gold.price.toFixed(2)}/mo`, desc: "Unlimited swipes, Top Pick, monthly counselling" },
                { id: "coins", label: `Coins — GH₵ ${pricing.coins.price.toFixed(2)}`, desc: "+20 swipes, +5 matches" },
              ].map((p) => (
                <Button key={p.id} variant="outline" className="w-full justify-start h-auto py-3" onClick={() => void purchasePlan(p.id)}>
                  <div className="text-left">
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-gray-500">{p.desc}</p>
                  </div>
                </Button>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete dating profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will permanently delete your dating profile and all photos. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingProfile}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingProfile}
              onClick={(e) => {
                e.preventDefault()
                void deleteMyDatingProfile()
              }}
            >
              {deletingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

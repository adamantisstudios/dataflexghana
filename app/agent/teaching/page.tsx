"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
  import {
  BookOpen,
  Users,
  LogOut,
  Search,
  Plus,
  Eye,
  Award,
  CheckCircle2,
  MessageCircle,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client";
import { getStoredAgent, logoutAgent } from "@/lib/unified-auth-system"
import { BackToTop } from "@/components/back-to-top"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
  import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChannelSubscriptionBadge } from "@/components/teaching/channel-subscription-badge"
import { computeMembershipUiStatus, type MembershipUiStatus } from "@/lib/channel-membership-lifecycle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"

// Types
interface TeachingChannel {
  id: string
  name: string
  description: string
  category: string
  is_public: boolean
  max_members: number
  image_url?: string
  created_at: string
  member_count?: number
  is_member?: boolean
  user_role?: string
  subscription_enabled?: boolean
  subscription_fee?: number
  days_until_expiry?: number
  is_subscription_active?: boolean
  membership_status?: MembershipUiStatus
  join_request_status?: string | null
}
interface ChannelPost {
  id: string
  channel_id: string
  title: string
  content: string
  post_type: string
  author_id: string
  author_name?: string
  view_count: number
  created_at: string
  comment_count?: number
}

// Skeleton Loader
function ChannelCardSkeleton() {
  return (
    <Card className="border-blue-200 bg-white/90 w-full">
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-2 bg-gray-100 rounded w-1/2 animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <div className="h-2 bg-gray-100 rounded animate-pulse"></div>
          <div className="h-2 bg-gray-100 rounded w-5/6 animate-pulse"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-2 bg-gray-100 rounded w-1/4 animate-pulse"></div>
          <div className="h-2 bg-gray-100 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="flex gap-2 pt-1 border-t border-gray-200">
          <div className="h-7 bg-gray-200 rounded flex-1 animate-pulse"></div>
          <div className="h-7 bg-gray-200 rounded flex-1 animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TeachingPlatformPage() {
  // State
  const router = useRouter()
  const agent = getStoredAgent()
  const [activeTab, setActiveTab] = useState<"channels" | "my-channels">("channels")
  const [channels, setChannels] = useState<TeachingChannel[]>([])
  const [myChannels, setMyChannels] = useState<TeachingChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<TeachingChannel | null>(null)
  const [channelPosts, setChannelPosts] = useState<ChannelPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [joinMessage, setJoinMessage] = useState("")
  const [selectedChannelForJoin, setSelectedChannelForJoin] = useState<TeachingChannel | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showChannelDialog, setShowChannelDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    category: "General",
    is_public: true,
  })
  const [canTeach, setCanTeach] = useState(false)

  // Load Data
  useEffect(() => {
    if (!agent) {
      router.push("/agent/login")
      return
    }
    if (!hasLoaded) {
      loadChannels()
      loadCanTeach()
      setHasLoaded(true)
    }
  }, [agent, router, hasLoaded])

  const loadCanTeach = async () => {
    if (!agent?.id) return
    try {
      const { data } = await supabase.from("agents").select("can_teach").eq("id", agent.id).single()
      setCanTeach(Boolean(data?.can_teach))
    } catch {
      setCanTeach(Boolean((agent as { can_teach?: boolean }).can_teach))
    }
  }

  const loadChannels = async () => {
    setLoading(true)
    try {
      const { data: publicChannels, error: channelsError } = await supabase
        .from("teaching_channels")
        .select("*")
        .eq("is_public", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
      if (channelsError) throw channelsError

      const { data: subscriptionSettings } = await supabase
        .from("channel_subscription_settings")
        .select("channel_id, is_enabled, monthly_fee")

      const subscriptionMap = new Map(
        subscriptionSettings?.map((s: any) => [s.channel_id, { enabled: s.is_enabled, fee: s.monthly_fee }]) || [],
      )

      const { data: memberChannels, error: memberError } = await supabase
        .from("channel_members")
        .select("channel_id, role")
        .eq("agent_id", agent.id)
      if (memberError) throw memberError

      const { data: userSubscriptions } = await supabase
        .from("member_subscription_status")
        .select("channel_id, subscription_expires_at, is_active")
        .eq("agent_id", agent.id)

      const subscriptionStatusMap = new Map(
        userSubscriptions?.map((s: any) => {
          const expiresAt = new Date(s.subscription_expires_at)
          const now = new Date()
          const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          const isActive = Boolean(s.is_active) && daysLeft > 0
          return [s.channel_id, { isActive, daysUntilExpiry: daysLeft }]
        }) || [],
      )

      const { data: joinRequests } = await supabase
        .from("channel_join_requests")
        .select("channel_id, status")
        .eq("agent_id", agent.id)

      const joinRequestMap = new Map(joinRequests?.map((r: any) => [r.channel_id, r.status]) || [])

      const memberChannelIds = memberChannels?.map((m) => m.channel_id) || []
      const roleMap = new Map(memberChannels?.map((m) => [m.channel_id, m.role]) || [])
      const memberStatusMap = new Map(memberChannels?.map((m) => [m.channel_id, m.status]) || [])
      const { data: memberCounts, error: countError } = await supabase.from("channel_members").select("channel_id")
      if (countError) console.error("Error loading member counts:", countError)
      const countMap = new Map<string, number>()
      memberCounts?.forEach((m: any) => {
        countMap.set(m.channel_id, (countMap.get(m.channel_id) || 0) + 1)
      })
      const enrichedChannels = (publicChannels || []).map((channel: any) => {
        const subSettings = subscriptionMap.get(channel.id) || { enabled: false, fee: 0 }
        const subStatus = subscriptionStatusMap.get(channel.id) || { isActive: false, daysUntilExpiry: undefined }
        const joinStatus = joinRequestMap.get(channel.id) ?? null
        const membership_status = computeMembershipUiStatus({
          joinRequestStatus: joinStatus,
          subscriptionEnabled: Boolean(subSettings.enabled),
          subscriptionActive: Boolean(subStatus.isActive),
          daysUntilExpiry: subStatus.daysUntilExpiry,
          isChannelMember: memberChannelIds.includes(channel.id),
          memberRowStatus: memberStatusMap.get(channel.id),
        })
        return {
          ...channel,
          is_member: membership_status === "active",
          member_count: countMap.get(channel.id) || 0,
          user_role: roleMap.get(channel.id),
          is_active: true,
          subscription_enabled: subSettings.enabled || false,
          subscription_fee: subSettings.fee || 0,
          days_until_expiry: subStatus.daysUntilExpiry,
          is_subscription_active: subStatus.isActive,
          membership_status,
          join_request_status: joinStatus,
        }
      })
      setChannels(enrichedChannels)

      if (memberChannelIds.length > 0) {
        const { data: userChannels, error: userChannelsError } = await supabase
          .from("teaching_channels")
          .select("*")
          .in("id", memberChannelIds)
          .order("created_at", { ascending: false })
        if (userChannelsError) throw userChannelsError
        const enrichedUserChannels = (userChannels || []).map((channel: any) => {
          const subSettings = subscriptionMap.get(channel.id) || { enabled: false, fee: 0 }
          const subStatus = subscriptionStatusMap.get(channel.id) || { isActive: false, daysUntilExpiry: undefined }
          const joinStatus = joinRequestMap.get(channel.id) ?? null
          const membership_status = computeMembershipUiStatus({
            joinRequestStatus: joinStatus,
            subscriptionEnabled: Boolean(subSettings.enabled),
            subscriptionActive: Boolean(subStatus.isActive),
            daysUntilExpiry: subStatus.daysUntilExpiry,
            isChannelMember: true,
            memberRowStatus: memberStatusMap.get(channel.id),
          })
          return {
            ...channel,
            is_member: membership_status === "active",
            member_count: countMap.get(channel.id) || 0,
            user_role: roleMap.get(channel.id),
            is_active: true,
            subscription_enabled: subSettings.enabled || false,
            subscription_fee: subSettings.fee || 0,
            days_until_expiry: subStatus.daysUntilExpiry,
            is_subscription_active: subStatus.isActive,
            membership_status,
            join_request_status: joinStatus,
          }
        })
        setMyChannels(enrichedUserChannels)
      }
    } catch (error) {
      toast.error("Failed to load channels. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Load Channel Posts
  const loadChannelPosts = async (channelId: string) => {
    try {
      const { data: posts, error } = await supabase
        .from("channel_posts")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3)
      if (error) throw error
      setChannelPosts(posts || [])
    } catch (error) {
      toast.error("Failed to load channel posts.")
    }
  }

  // Join Channel
  const handleJoinChannel = async () => {
    if (!selectedChannelForJoin || !agent) return
    try {
      const res = await fetch(`/api/agent/channels/${selectedChannelForJoin.id}/join`, {
        method: "POST",
        headers: { ...getAgentAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ request_message: joinMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send join request")

      if (data.isRenewal) {
        toast.success("Renewal request sent! Complete payment if required, then await admin approval.")
      } else if (data.requiresPayment) {
        toast.success("Join request sent! Complete payment on the join page.")
        router.push(`/agent/teaching/channels/${selectedChannelForJoin.id}/join`)
      } else {
        toast.success("Join request sent! Waiting for approval.")
      }

      setShowJoinDialog(false)
      setJoinMessage("")
      setSelectedChannelForJoin(null)
      await loadChannels()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send join request.")
    }
  }

  const openJoinFlow = (channel: TeachingChannel) => {
    if (channel.membership_status === "expired") {
      router.push(`/agent/teaching/channels/${channel.id}/join`)
      return
    }
    setSelectedChannelForJoin(channel)
    setShowJoinDialog(true)
  }

  const handleCreateChannel = async () => {
    if (!agent || !createForm.name.trim()) {
      toast.error("Channel name is required")
      return
    }
    if (!canTeach) {
      toast.error("Only approved teachers can create channels. Contact admin for approval.")
      return
    }
    try {
      const response = await fetch("/api/agent/channels/create", {
        method: "POST",
        headers: { ...getAgentAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to create channel")

      toast.success("Channel created successfully")
      setShowCreateDialog(false)
      setCreateForm({ name: "", description: "", category: "General", is_public: true })
      await loadChannels()
      if (data.channelId) router.push(`/agent/teaching/${data.channelId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create channel")
    }
  }

  // Open Channel
  const handleOpenChannel = (channel: TeachingChannel) => {
    router.push(`/agent/teaching/${channel.id}`)
  }

  // Logout
  const handleLogout = () => {
    logoutAgent()
    router.push("/agent/login")
  }

  // Filter Channels
  const filteredChannels = channels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const filteredMyChannels = myChannels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Render
  if (!agent) return null

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      {/* Top Navigation */}
      <div className="w-full border-b border-green-100 bg-gradient-to-r from-green-600 to-green-500 shadow-sm">
        <div className="mx-auto w-full w-full px-3 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/agent/dashboard")}
                className="h-11 px-3 text-sm text-white hover:bg-white/20"
              >
                ← Back
              </Button>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                <BookOpen className="w-full h-full text-[#0E8F3D]" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-white sm:text-lg">Dataflex Channels</h1>
                <p className="truncate text-xs text-green-50 sm:text-sm">Learn, teach, and grow together</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="h-11 flex-shrink-0 border-white/30 bg-white/20 px-3 text-sm text-white hover:bg-white/30"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto w-full space-y-4 px-4 py-8 text-center sm:px-6">
          <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Welcome to Dataflex Channels Hub</h2>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Browse public teaching channels, join communities, and access lessons, quizzes, videos, and notes.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <TooltipProvider>
              {canTeach ? (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-11 bg-green-500 px-4 text-sm text-white hover:bg-green-600">
                      <Plus className="h-3 w-3 mr-1" />
                      Create Channel
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100">
                    <DialogHeader>
                      <DialogTitle>Create Channel</DialogTitle>
                      <DialogDescription>Start a new teaching channel for your community.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <Input
                        placeholder="Channel name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      />
                      <textarea
                        placeholder="Description"
                        value={createForm.description}
                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                        className="min-h-[96px] w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateChannel} className="h-11 bg-green-500 text-white hover:bg-green-600">
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button size="sm" className="h-11 cursor-not-allowed bg-gray-200 text-gray-700" disabled>
                        <Plus className="h-3 w-3 mr-1" />
                        Create Channel
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Only approved teachers can create channels. Contact admin for approval.</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
            <Button size="sm" variant="outline" className="h-11 border-gray-200 text-gray-900" onClick={() => router.push("/agent/my-subscriptions")}>
              My Subscriptions
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
          <div className="w-full border-b border-gray-100 bg-white">
            <div className="mx-auto w-full w-full px-4 py-3 sm:px-6">
              <TabsList className="flex w-full items-center justify-start gap-2 overflow-x-auto bg-transparent p-0">
                <TabsTrigger
                  value="channels"
                  className="h-11 whitespace-nowrap rounded-xl border border-transparent px-4 text-sm font-medium text-gray-700 data-[state=active]:border-green-200 data-[state=active]:bg-green-500 data-[state=active]:text-white"
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  View Channels
                </TabsTrigger>
                <TabsTrigger
                  value="my-channels"
                  className="h-11 whitespace-nowrap rounded-xl border border-transparent px-4 text-sm font-medium text-gray-700 data-[state=active]:border-green-200 data-[state=active]:bg-green-500 data-[state=active]:text-white"
                >
                  <Users className="h-3 w-3 mr-1" />
                  My Channels
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Search */}
          <div className="mx-auto w-full w-full px-4 py-4 sm:px-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 text-sm text-gray-900"
              />
            </div>
          </div>

          {/* Channels Tab */}
          <TabsContent value="channels" className="mx-auto w-full w-full space-y-4 px-4 pb-8 sm:px-6">
            <div className="w-full">
              {loading ? (
                <div className="space-y-2 w-full">
                  {[...Array(3)].map((_, i) => (
                    <ChannelCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredChannels.length === 0 ? (
                <Card className="w-full rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <CardContent className="pt-6 text-center text-gray-700 text-sm">
                    <BookOpen className="h-8 w-8 mx-auto mb-1 opacity-50" />
                    <p>No channels available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 w-full">
                  {filteredChannels.map((channel) => (
                    <Card
                      key={channel.id}
                      className="group w-full cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <CardContent className="p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                              <img
                                src={channel.image_url || "/placeholder.svg?height=64&width=64&query=channel"}
                                alt={channel.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 break-words">{channel.name}</h3>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">{channel.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1.5">
                              <span className="flex items-center gap-0.5">
                                <Users className="h-3 w-3" />
                                {channel.member_count || 0}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Eye className="h-3 w-3" />
                                {channel.is_public ? "Public" : "Private"}
                              </span>
                            </div>
                          </div>
                          <div className="ml-0 grid grid-cols-2 gap-2 sm:ml-2 sm:flex sm:flex-col">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-11 text-sm border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                              onClick={() => {
                                setSelectedChannel(channel)
                                setShowChannelDialog(true)
                                loadChannelPosts(channel.id)
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {channel.membership_status === "active" ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs h-11 px-3 flex items-center justify-center">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Member
                              </Badge>
                            ) : channel.membership_status === "pending" ? (
                              <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-xs h-11 px-3 flex items-center justify-center">
                                Awaiting approval
                              </Badge>
                            ) : channel.membership_status === "expired" ? (
                              <Button
                                size="sm"
                                className="h-11 text-sm bg-amber-600 text-white hover:bg-amber-700"
                                onClick={() => openJoinFlow(channel)}
                              >
                                Renew
                              </Button>
                            ) : (
                              <Dialog
                                open={showJoinDialog && selectedChannelForJoin?.id === channel.id}
                                onOpenChange={setShowJoinDialog}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="h-11 text-sm bg-green-500 text-white hover:bg-green-600"
                                    onClick={() => openJoinFlow(channel)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Join
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-full max-w-sm rounded-2xl border border-gray-100 sm:max-w-[90vw]">
                                  <DialogHeader>
                                    <DialogTitle className="text-sm">Join Channel</DialogTitle>
                                    <DialogDescription className="text-xs">
                                      Request to join {selectedChannelForJoin?.name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-2 py-2">
                                    <div className="grid gap-1">
                                      <label className="text-xs font-medium text-gray-700">Message (Optional)</label>
                                      <textarea
                                        value={joinMessage}
                                        onChange={(e) => setJoinMessage(e.target.value)}
                                        placeholder="Tell us why you want to join..."
                                        className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900"
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter className="gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        setShowJoinDialog(false)
                                        setJoinMessage("")
                                        setSelectedChannelForJoin(null)
                                      }}
                                      className="h-11 text-sm text-gray-900"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={handleJoinChannel}
                                      className="h-11 bg-green-500 text-sm text-white hover:bg-green-600"
                                    >
                                      Send
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                        {channel.subscription_enabled && (
                          <div className="mt-2 pt-2 border-t border-blue-100">
                            <ChannelSubscriptionBadge
                              isEnabled={channel.subscription_enabled}
                              monthlyFee={channel.subscription_fee}
                              daysUntilExpiry={channel.days_until_expiry}
                              membershipStatus={channel.membership_status}
                              isTeacherOrAdmin={channel.user_role === "admin" || channel.user_role === "teacher"}
                              onJoin={() => openJoinFlow(channel)}
                              onRenew={() => openJoinFlow(channel)}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Channels Tab */}
          <TabsContent value="my-channels" className="mx-auto w-full w-full space-y-4 px-4 pb-8 sm:px-6">
            <div className="w-full">
              {loading ? (
                <div className="space-y-2 w-full">
                  {[...Array(2)].map((_, i) => (
                    <ChannelCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredMyChannels.length === 0 ? (
                <Card className="bg-blue-50 border-blue-200 w-full">
                  <CardContent className="pt-3 text-center text-blue-600 text-sm">
                    <Users className="h-8 w-8 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">You haven't joined any channels yet</p>
                    <p className="text-xs mt-1">Explore channels to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 w-full">
                  {/* Channels You Manage */}
                  {filteredMyChannels.filter((c) => c.user_role === "teacher" || c.user_role === "admin").length >
                    0 && (
                    <div className="space-y-2 w-full">
                      <h3 className="font-semibold text-blue-800 flex items-center gap-1 text-xs sm:text-sm mb-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        Channels You Manage
                      </h3>
                      {filteredMyChannels
                        .filter((c) => c.user_role === "teacher" || c.user_role === "admin")
                        .map((channel) => (
                          <Card
                            key={channel.id}
                        className="w-full cursor-pointer rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                                    <img
                                      src={channel.image_url || "/placeholder.svg?height=64&width=64&query=channel"}
                                      alt={channel.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-semibold text-gray-900 break-words">{channel.name}</h3>
                                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{channel.description}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1.5 flex-wrap">
                                    <span className="flex items-center gap-0.5">
                                      <Users className="h-3 w-3" />
                                      {channel.member_count || 0}
                                    </span>
                                    <Badge variant="secondary" className="text-xs h-5">
                                      {channel.category}
                                    </Badge>
                                    <Badge
                                      className={`text-xs h-5 ${channel.user_role === "admin" ? "bg-blue-600" : "bg-green-600"} text-white`}
                                    >
                                      {channel.user_role}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5 ml-2">
                                  <Button
                                    size="sm"
                                    className="h-11 text-sm bg-green-500 text-white hover:bg-green-600"
                                    onClick={() => handleOpenChannel(channel)}
                                  >
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Manage
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                  {/* Channels You're a Member Of */}
                  {filteredMyChannels.filter((c) => c.user_role === "member").length > 0 && (
                    <div className="space-y-2 w-full mt-4">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-1 text-xs sm:text-sm mb-2">
                        <Users className="h-4 w-4" />
                        Channels You're a Member Of
                      </h3>
                      {filteredMyChannels
                        .filter((c) => c.user_role === "member")
                        .map((channel) => (
                          <Card
                            key={channel.id}
                            className="w-full cursor-pointer rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                                    <img
                                      src={channel.image_url || "/placeholder.svg"}
                                      alt={channel.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-semibold text-gray-900 break-words">{channel.name}</h3>
                                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{channel.description}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1.5 flex-wrap">
                                    <span className="flex items-center gap-0.5">
                                      <Users className="h-3 w-3" />
                                      {channel.member_count || 0}
                                    </span>
                                    <Badge variant="secondary" className="text-xs h-5">
                                      {channel.category}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs h-5">
                                      Member
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5 ml-2">
                                  <Button
                                    size="sm"
                                    className="h-11 text-sm bg-green-500 text-white hover:bg-green-600"
                                    onClick={() => handleOpenChannel(channel)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Channel Details Dialog */}
      {selectedChannel && (
        <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
          <DialogContent className="max-h-[80vh] w-[95vw] max-w-sm overflow-y-auto rounded-2xl border border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-sm">{selectedChannel.name}</DialogTitle>
              <DialogDescription className="text-xs">{selectedChannel.description}</DialogDescription>
            </DialogHeader>
            {selectedChannel.image_url && (
              <div className="flex justify-center my-2">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-blue-200">
                  <img
                    src={selectedChannel.image_url || "/placeholder.svg"}
                    alt={selectedChannel.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Category</p>
                  <p className="font-semibold text-blue-800 text-xs">{selectedChannel.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Members</p>
                  <p className="font-semibold text-blue-800 text-xs">{selectedChannel.member_count || 0}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-800 text-xs">Latest Lessons</h3>
                {channelPosts.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-2">No posts yet</p>
                ) : (
                  channelPosts.map((post) => (
                    <Card
                      key={post.id}
                      className="border-gray-200 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all duration-200"
                      onClick={() => handleOpenChannel(selectedChannel)}
                    >
                      <CardContent className="p-3">
                        <h4 className="text-sm font-medium truncate">{post.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{post.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{post.view_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{post.comment_count || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <Button onClick={() => handleOpenChannel(selectedChannel)} className="mt-2 h-11 w-full bg-green-500 text-sm text-white hover:bg-green-600">
                View Full Channel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <BackToTop />
    </div>
  )
}

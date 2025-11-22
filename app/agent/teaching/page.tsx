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
import { supabase } from "@/lib/supabase"
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
import { TeacherChannelDashboard } from "@/components/teaching/TeacherChannelDashboard"
import { ChannelSubscriptionBadge } from "@/components/teaching/channel-subscription-badge"

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

  // Load Data
  useEffect(() => {
    if (!agent) {
      router.push("/agent/login")
      return
    }
    if (!hasLoaded) {
      loadChannels()
      setHasLoaded(true)
    }
  }, [agent, router, hasLoaded])

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
          return [s.channel_id, { isActive: s.is_active, daysUntilExpiry: daysLeft }]
        }) || [],
      )

      const memberChannelIds = memberChannels?.map((m) => m.channel_id) || []
      const roleMap = new Map(memberChannels?.map((m) => [m.channel_id, m.role]) || [])
      const { data: memberCounts, error: countError } = await supabase.from("channel_members").select("channel_id")
      if (countError) console.error("Error loading member counts:", countError)
      const countMap = new Map<string, number>()
      memberCounts?.forEach((m: any) => {
        countMap.set(m.channel_id, (countMap.get(m.channel_id) || 0) + 1)
      })
      const enrichedChannels = (publicChannels || []).map((channel: any) => {
        const subSettings = subscriptionMap.get(channel.id) || {}
        const subStatus = subscriptionStatusMap.get(channel.id) || {}
        return {
          ...channel,
          is_member: memberChannelIds.includes(channel.id),
          member_count: countMap.get(channel.id) || 0,
          user_role: roleMap.get(channel.id),
          is_active: true,
          subscription_enabled: subSettings.enabled || false,
          subscription_fee: subSettings.fee || 0,
          days_until_expiry: subStatus.daysUntilExpiry,
          is_subscription_active: subStatus.isActive,
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
          const subSettings = subscriptionMap.get(channel.id) || {}
          const subStatus = subscriptionStatusMap.get(channel.id) || {}
          return {
            ...channel,
            member_count: countMap.get(channel.id) || 0,
            user_role: roleMap.get(channel.id),
            is_active: true,
            subscription_enabled: subSettings.enabled || false,
            subscription_fee: subSettings.fee || 0,
            days_until_expiry: subStatus.daysUntilExpiry,
            is_subscription_active: subStatus.isActive,
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
      const { data: existingRequest } = await supabase
        .from("channel_join_requests")
        .select("id, status")
        .eq("channel_id", selectedChannelForJoin.id)
        .eq("agent_id", agent.id)
        .maybeSingle()
      if (existingRequest) {
        if (existingRequest.status === "pending") {
          toast.error("You already have a pending join request for this channel.")
        } else if (existingRequest.status === "approved") {
          toast.error("You are already a member of this channel.")
        } else {
          toast.error(`Your join request was ${existingRequest.status}.`)
        }
        setShowJoinDialog(false)
        setSelectedChannelForJoin(null)
        return
      }
      const { data: existing } = await supabase
        .from("channel_members")
        .select("id")
        .eq("channel_id", selectedChannelForJoin.id)
        .eq("agent_id", agent.id)
        .maybeSingle()
      if (existing) {
        toast.error("You are already a member of this channel.")
        setShowJoinDialog(false)
        setSelectedChannelForJoin(null)
        return
      }
      const { error: requestError } = await supabase.from("channel_join_requests").insert([
        {
          channel_id: selectedChannelForJoin.id,
          agent_id: agent.id,
          request_message: joinMessage || "",
          status: "pending",
        },
      ])
      if (requestError) throw requestError
      toast.success("Join request sent! Waiting for approval.")
      setShowJoinDialog(false)
      setJoinMessage("")
      setSelectedChannelForJoin(null)
      await loadChannels()
    } catch (error) {
      toast.error("Failed to send join request. Please try again.")
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

  if (selectedChannel && (selectedChannel.user_role === "admin" || selectedChannel.user_role === "teacher")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg border-b-2 border-blue-700">
          <div className="w-full px-2 py-2 sm:px-3 sm:py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedChannel(null)}
                  className="text-white hover:bg-white/20 h-7 px-2 text-xs"
                >
                  ← Back
                </Button>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base font-bold text-white drop-shadow-lg truncate">
                    {selectedChannel.name}
                  </h1>
                  <p className="text-xs text-blue-100 truncate">Teaching Channel - {selectedChannel.user_role}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-7 px-2 text-xs flex-shrink-0"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        <div className="w-full px-2 py-4 sm:px-3">
          <TeacherChannelDashboard
            channelId={selectedChannel.id}
            teacherId={agent.id}
            teacherName={agent.full_name || agent.email}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Top Navigation */}
      <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg border-b-2 border-blue-700">
        <div className="w-full px-2 py-2 sm:px-3 sm:py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/agent/dashboard")}
                className="text-white hover:bg-white/20 h-7 px-2 text-xs"
              >
                ← Back
              </Button>
              <div className="w-8 h-8 bg-white rounded-lg shadow-lg flex items-center justify-center p-1 flex-shrink-0">
                <BookOpen className="w-full h-full text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-white drop-shadow-lg truncate">Teaching Platform</h1>
                <p className="text-xs text-blue-100 truncate">Learn from expert teachers</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-7 px-2 text-xs flex-shrink-0"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
          <div className="w-full bg-white/80 backdrop-blur-sm shadow-md border-b border-blue-200">
            <div className="w-full py-2 px-2 sm:px-3">
              <TabsList className="w-full flex items-center justify-start bg-transparent p-0 gap-1 overflow-x-auto">
                <TabsTrigger
                  value="channels"
                  className="flex items-center justify-center px-2 py-1 text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-md whitespace-nowrap flex-shrink-0"
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  View Channels
                </TabsTrigger>
                <TabsTrigger
                  value="my-channels"
                  className="flex items-center justify-center px-2 py-1 text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-md whitespace-nowrap flex-shrink-0"
                >
                  <Users className="h-3 w-3 mr-1" />
                  My Channels
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Search */}
          <div className="w-full py-2 px-2 sm:px-3">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-400 h-3 w-3" />
              <Input
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 border-blue-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm w-full rounded-lg text-xs h-7"
              />
            </div>
          </div>

          {/* Channels Tab */}
          <TabsContent value="channels" className="pb-4 space-y-2 w-full px-2 sm:px-3">
            <div className="w-full">
              {loading ? (
                <div className="space-y-2 w-full">
                  {[...Array(3)].map((_, i) => (
                    <ChannelCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredChannels.length === 0 ? (
                <Card className="bg-blue-50 border-blue-200 w-full">
                  <CardContent className="pt-3 text-center text-blue-600 text-sm">
                    <BookOpen className="h-8 w-8 mx-auto mb-1 opacity-50" />
                    <p>No channels available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 w-full">
                  {filteredChannels.map((channel) => (
                    <Card
                      key={channel.id}
                      className="border-blue-200 bg-white/90 hover:shadow-lg transition-all duration-300 cursor-pointer group w-full overflow-hidden"
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
                            <h3 className="font-semibold text-blue-800 text-sm break-words">{channel.name}</h3>
                            <p className="text-xs text-gray-600 mt-0.5 truncate">{channel.description}</p>
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
                          <div className="flex flex-col gap-1.5 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-blue-600 border-blue-200 bg-transparent hover:bg-blue-50"
                              onClick={() => {
                                setSelectedChannel(channel)
                                setShowChannelDialog(true)
                                loadChannelPosts(channel.id)
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {!channel.is_member ? (
                              <Dialog
                                open={showJoinDialog && selectedChannelForJoin?.id === channel.id}
                                onOpenChange={setShowJoinDialog}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => {
                                      setSelectedChannelForJoin(channel)
                                      setShowJoinDialog(true)
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Join
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[90vw] max-w-xs w-full">
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
                                        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
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
                                      className="text-xs h-7"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={handleJoinChannel}
                                      className="bg-blue-600 hover:bg-blue-700 text-xs h-7"
                                    >
                                      Send
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs h-7 px-2 flex items-center justify-center">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Member
                              </Badge>
                            )}
                          </div>
                        </div>
                        {channel.subscription_enabled && (
                          <div className="mt-2 pt-2 border-t border-blue-100">
                            <ChannelSubscriptionBadge
                              isEnabled={channel.subscription_enabled}
                              monthlyFee={channel.subscription_fee}
                              daysUntilExpiry={channel.days_until_expiry}
                              isPaid={channel.is_member && channel.is_subscription_active}
                              isExpired={channel.is_member && !channel.is_subscription_active}
                              isTeacherOrAdmin={channel.user_role === "admin" || channel.user_role === "teacher"}
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
          <TabsContent value="my-channels" className="pb-4 space-y-2 w-full px-2 sm:px-3">
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
                            className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300 cursor-pointer w-full"
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
                                  <h3 className="font-semibold text-blue-800 text-sm break-words">{channel.name}</h3>
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
                                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
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
                            className="border-gray-200 bg-white/90 hover:shadow-lg transition-all duration-300 cursor-pointer w-full"
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
                                  <h3 className="font-semibold text-gray-800 text-sm break-words">{channel.name}</h3>
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
                                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
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
          <DialogContent className="max-w-sm max-h-[70vh] overflow-y-auto w-[95vw]">
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
              <Button
                onClick={() => handleOpenChannel(selectedChannel)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 mt-2"
              >
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

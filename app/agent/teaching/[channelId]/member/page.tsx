"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, AlertCircle, MessageSquare, Eye, Users } from "lucide-react"
import { getStoredAgent, logoutAgent } from "@/lib/unified-auth-system"
import { supabase } from "@/lib/supabase"
import { BackToTop } from "@/components/back-to-top"
import { CommentThread } from "@/components/teaching/CommentThread"
import { WhatsAppPromoNotification } from "@/components/teaching/whatsapp-promo-notification"
import { toast } from "sonner"
import {
  checkChannelMembership,
  logMembershipDiagnostic,
  getChannelPostsForMember,
} from "@/lib/channel-membership-utils"

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
  media_url?: string
}

interface TeachingChannel {
  id: string
  name: string
  description: string
  category: string
  member_count?: number
}

export default function MemberChannelPage() {
  const router = useRouter()
  const params = useParams()
  const agent = getStoredAgent()
  const channelId = params.channelId as string
  const [channel, setChannel] = useState<TeachingChannel | null>(null)
  const [posts, setPosts] = useState<ChannelPost[]>([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (!agent) {
      router.push("/agent/login")
      return
    }

    const checkAccessAndLoadData = async () => {
      try {
        logMembershipDiagnostic(`Member page loading for agent ${agent.id} in channel ${channelId}`)

        const { isMember, role, error: memberError } = await checkChannelMembership(channelId, agent.id)

        if (!isMember) {
          logMembershipDiagnostic(`Access denied: ${memberError || "Not a member"}`)
          setAccessDenied(true)
          setLoading(false)
          return
        }

        if (role === "admin" || role === "teacher") {
          logMembershipDiagnostic(`Redirecting ${role} to teacher dashboard`)
          router.push(`/agent/teaching/${channelId}`)
          return
        }

        const { data: channelData, error: channelError } = await supabase
          .from("teaching_channels")
          .select("*")
          .eq("id", channelId)
          .single()

        if (channelError || !channelData) {
          logMembershipDiagnostic(`Channel not found: ${channelError?.message}`)
          setAccessDenied(true)
          setLoading(false)
          return
        }

        setChannel(channelData)

        const { posts: postsData, error: postsError } = await getChannelPostsForMember(channelId, agent.id)

        if (postsError) {
          console.error("[v0] Error loading posts:", postsError)
          toast.error("Failed to load posts")
        } else {
          logMembershipDiagnostic(`Loaded ${postsData.length} posts for member`)
          setPosts(postsData)
        }

        setLoading(false)
      } catch (err) {
        console.error("[v0] Error checking access:", err)
        logMembershipDiagnostic(`Exception during access check: ${err}`)
        setAccessDenied(true)
        setLoading(false)
      }
    }

    checkAccessAndLoadData()
  }, [agent, router, channelId])

  const handleLogout = () => {
    logoutAgent()
    router.push("/agent/login")
  }

  if (!agent) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading channel...</p>
        </div>
      </div>
    )
  }

  if (accessDenied || !channel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">Channel Access</h1>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
                  <p className="text-red-700 mb-4">You do not have permission to access this channel.</p>
                  <Button
                    onClick={() => router.push("/agent/teaching")}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Back to Teaching Platform
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {!loading && agent && <WhatsAppPromoNotification memberId={agent.id} userType="member" />}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/agent/teaching")}
                className="text-white hover:bg-white/20"
              >
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">{channel.name}</h1>
                <p className="text-blue-100 text-sm">Channel • Member</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Channel Info */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-gray-700">{channel.description}</p>
              <div className="flex items-center gap-6 text-sm text-gray-600 pt-2">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {channel.member_count || 0} members
                </span>
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {posts.length} posts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-blue-800">Channel Posts</h2>

          {posts.length === 0 ? (
            <Card className="border-gray-200 bg-white/50">
              <CardContent className="pt-6 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">No posts yet in this channel</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="border-blue-200 bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-blue-800">{post.title}</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">
                        By {post.author_name || "Unknown"} • {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Post Content */}
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* Media if exists */}
                  {post.media_url && post.post_type === "audio" && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <audio controls className="w-full">
                        <source src={post.media_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Post Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-gray-200">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.view_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.comment_count || 0} comments
                    </span>
                  </div>

                  {/* Comments Section */}
                  <div className="pt-4 border-t border-gray-200">
                    <CommentThread
                      postId={post.id}
                      channelId={channelId}
                      agentId={agent.id}
                      agentName={agent.full_name || agent.email}
                      isMember={true}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <BackToTop />
    </div>
  )
}

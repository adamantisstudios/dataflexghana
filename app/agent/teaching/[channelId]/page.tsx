"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { getStoredAgent } from "@/lib/unified-auth-system"
import { TeacherChannelDashboard } from "@/components/teaching/TeacherChannelDashboard"
import { MemberChannelView } from "@/components/teaching/MemberChannelView"
import { ChannelChatWidget } from "@/components/teaching/ChannelChatWidget"
import { BackToTop } from "@/components/back-to-top"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ChannelPage() {
  const router = useRouter()
  const params = useParams()
  const agent = getStoredAgent()
  const channelId = params.channelId as string
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (!agent) {
      router.push("/agent/login")
      return
    }
    const checkAccess = async () => {
      try {
        const { data: membership, error } = await supabase
          .from("channel_members")
          .select("role")
          .eq("channel_id", channelId)
          .eq("agent_id", agent.id)
          .single()
        if (error || !membership) {
          setAccessDenied(true)
          setLoading(false)
          return
        }
        setUserRole(membership.role)
        setLoading(false)
      } catch (err) {
        console.error("[v0] Error checking access:", err)
        setAccessDenied(true)
        setLoading(false)
      }
    }
    checkAccess()
  }, [agent, router, channelId])

  if (!agent) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-2">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-xs">Loading channel...</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg border-b-2 border-blue-700">
          <div className="w-full px-2 py-2 sm:px-3">
            <h1 className="text-sm font-bold text-white drop-shadow-lg">Channel Access</h1>
          </div>
        </div>
        <div className="w-full px-2 py-4 sm:px-3">
          <div className="max-w-2xl">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-semibold text-red-800 mb-1">Access Denied</h2>
                    <p className="text-red-700 mb-2 text-xs">
                      You are not a member of this channel. Please request to join or contact the channel admin.
                    </p>
                    <Button
                      onClick={() => router.push("/agent/teaching")}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
                    >
                      Back to Teaching Platform
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const isTeacherOrAdmin = userRole === "admin" || userRole === "teacher"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg border-b-2 border-blue-700">
        <div className="w-full px-2 py-2 sm:px-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/agent/teaching")}
              className="text-white hover:bg-white/20 h-7 px-2 text-xs"
            >
              ← Back
            </Button>
            <h1 className="text-sm font-bold text-white drop-shadow-lg truncate">
              {isTeacherOrAdmin ? "Channel Management" : "Channel"}
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full px-2 py-4 sm:px-3">
        {isTeacherOrAdmin ? (
          <TeacherChannelDashboard
            channelId={channelId}
            teacherId={agent.id}
            teacherName={agent.full_name || agent.email}
          />
        ) : (
          <MemberChannelView channelId={channelId} memberId={agent.id} memberName={agent.full_name || agent.email} />
        )}
      </div>

      <ChannelChatWidget />

      <BackToTop />
    </div>
  )
}

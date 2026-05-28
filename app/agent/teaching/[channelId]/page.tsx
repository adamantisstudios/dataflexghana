"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { getStoredAgent } from "@/lib/unified-auth-system"
import { checkChannelSubscriptionAccess } from "@/lib/channel-subscription-access"
import { checkChannelMembership } from "@/lib/channel-membership-utils"
import { TeacherChannelDashboard } from "@/components/teaching/TeacherChannelDashboard"
import { MemberChannelView } from "@/components/teaching/MemberChannelView"
import { BackToTop } from "@/components/back-to-top"
import {
  teachingHubFullBleedClass,
  teachingHubMainClass,
  teachingHubPageClass,
} from "@/components/teaching/teaching-hub-ui"
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
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{
    reason: "subscription_required" | "subscription_expired"
    channelId: string
  } | null>(null)

  useEffect(() => {
    if (!agent) {
      router.push("/agent/login")
      return
    }
    const checkAccess = async () => {
      try {
        const { isMember, role, status, error: memberError } = await checkChannelMembership(
          channelId,
          agent.id,
        )

        if (!isMember) {
          console.error("[v0] Channel access denied:", memberError || status)
          setAccessDenied(true)
          setLoading(false)
          return
        }

        if (!role) {
          console.error("[v0] Channel access denied: missing role on membership row")
          setAccessDenied(true)
          setLoading(false)
          return
        }

        const subAccess = await checkChannelSubscriptionAccess(channelId, agent.id, role)
        if (!subAccess.allowed) {
          if (subAccess.reason === "subscription_expired" || subAccess.reason === "subscription_required") {
            setSubscriptionBlocked({ reason: subAccess.reason, channelId })
          } else {
            setAccessDenied(true)
          }
          setLoading(false)
          return
        }

        setUserRole(role)
        setLoading(false)
      } catch (err) {
        console.error("[v0] Error checking access:", err)
        setAccessDenied(true)
        setLoading(false)
        return
      }
    }
    checkAccess()
  }, [agent, router, channelId])

  if (!agent) {
    return null
  }

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center p-4 ${teachingHubPageClass}`}>
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-green-500"></div>
          <p className="text-sm text-gray-600">Loading channel...</p>
        </div>
      </div>
    )
  }

  if (subscriptionBlocked) {
    const isExpired = subscriptionBlocked.reason === "subscription_expired"
    return (
      <div className={teachingHubPageClass}>
        <div className="w-full border-b border-green-100 bg-gradient-to-r from-emerald-600 to-green-500 shadow-sm">
          <div className="w-full px-4 py-4 sm:px-6">
            <h1 className="text-lg font-semibold text-white">Channel Access</h1>
          </div>
        </div>
        <div className={teachingHubMainClass}>
          <Card className="w-full max-w-none rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="mb-2 text-lg font-semibold text-amber-900">
                      {isExpired ? "Subscription Expired" : "Subscription Required"}
                    </h2>
                    <p className="mb-4 text-sm text-amber-800">
                      {isExpired
                        ? "Your subscription has expired. Renew to regain access to this channel."
                        : "This channel requires an active subscription. Complete payment to access channel content."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild className="h-11 bg-green-500 text-sm text-white hover:bg-green-600">
                        <Link href={`/agent/teaching/channels/${channelId}/join`}>
                          {isExpired ? "Renew Subscription" : "Subscribe Now"}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/agent/teaching")}
                        className="h-11 text-sm text-gray-900"
                      >
                        Back to Channels
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className={teachingHubPageClass}>
        <div className="w-full border-b border-green-100 bg-gradient-to-r from-emerald-600 to-green-500 shadow-sm">
          <div className="w-full px-4 py-4 sm:px-6">
            <h1 className="text-lg font-semibold text-white">Channel Access</h1>
          </div>
        </div>
        <div className={teachingHubMainClass}>
            <Card className="w-full max-w-none rounded-2xl border border-red-200 bg-red-50 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="mb-2 text-lg font-semibold text-red-800">Not a Channel Member</h2>
                    <p className="mb-4 text-sm text-red-700">
                      You are not a member of this channel. Please subscribe to access the content, or go back to browse other channels.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild className="h-11 bg-green-500 text-sm text-white hover:bg-green-600">
                        <Link href={`/agent/teaching/channels/${channelId}/join`}>Subscribe to Join</Link>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/agent/teaching")}
                        className="h-11 text-sm text-gray-900"
                      >
                        Back to Channels
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    )
  }

  const isTeacherOrAdmin = userRole === "admin" || userRole === "teacher"

  return (
    <div className={`${teachingHubPageClass} overflow-x-hidden`}>
      <div className="sticky top-0 z-50 w-full border-b border-green-100 bg-gradient-to-r from-emerald-600 to-green-500 shadow-sm">
        <div className="w-full px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/agent/teaching")}
              className="h-11 px-3 text-sm text-white hover:bg-white/20"
            >
              ← Back
            </Button>
            <h1 className="truncate text-base font-semibold text-white sm:text-lg">
              {isTeacherOrAdmin ? "Channel Management" : "Channel"}
            </h1>
          </div>
        </div>
      </div>

      <div className={teachingHubFullBleedClass}>
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

      <BackToTop />
    </div>
  )
}

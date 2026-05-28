"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle, LogOut } from "lucide-react"
import { getStoredAgent, logoutAgent } from "@/lib/unified-auth-system"
import { checkChannelMembership, logMembershipDiagnostic } from "@/lib/channel-membership-utils"
import { checkChannelSubscriptionAccess } from "@/lib/channel-subscription-access"
import { MemberChannelView } from "@/components/teaching/MemberChannelView"
import { BackToTop } from "@/components/back-to-top"
import { teachingHubMainClass, teachingHubPageClass } from "@/components/teaching/teaching-hub-ui"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function MemberChannelPage() {
  const router = useRouter()
  const params = useParams()
  const agent = getStoredAgent()
  const channelId = params.channelId as string
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [denyReason, setDenyReason] = useState<"not_member" | "subscription" | "teacher_redirect">("not_member")
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{
    reason: "subscription_required" | "subscription_expired"
  } | null>(null)

  useEffect(() => {
    if (!agent) {
      router.push("/agent/login")
      return
    }

    const verifyAccess = async () => {
      try {
        logMembershipDiagnostic(`Member page: verifying ${agent.id} for channel ${channelId}`)

        const { isMember, role, status, error } = await checkChannelMembership(channelId, agent.id)

        if (!isMember) {
          logMembershipDiagnostic(`Member page denied: ${error || status || "not a member"}`)
          setDenyReason("not_member")
          setAccessDenied(true)
          setLoading(false)
          return
        }

        if (role === "admin" || role === "teacher") {
          setLoading(false)
          router.replace(`/agent/teaching/${channelId}`)
          return
        }

        const subAccess = await checkChannelSubscriptionAccess(channelId, agent.id, role)
        if (!subAccess.allowed) {
          setSubscriptionBlocked({ reason: subAccess.reason })
          setDenyReason("subscription")
          setAccessDenied(true)
          setLoading(false)
          return
        }

        setLoading(false)
      } catch (err) {
        console.error("[v0] Member page access error:", err)
        setDenyReason("not_member")
        setAccessDenied(true)
        setLoading(false)
      }
    }

    void verifyAccess()
  }, [agent, router, channelId])

  const handleLogout = () => {
    logoutAgent()
    router.push("/agent/login")
  }

  if (!agent) return null

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center p-4 ${teachingHubPageClass}`}>
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-green-500" />
          <p className="text-sm text-gray-600">Loading channel…</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    const isExpired = subscriptionBlocked?.reason === "subscription_expired"
    return (
      <div className={cn(teachingHubPageClass, "overflow-x-hidden")}>
        <div className="border-b border-green-100 bg-gradient-to-r from-emerald-600 to-green-500 shadow-sm">
          <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">Channel access</h1>
          </div>
        </div>

        <div className={teachingHubMainClass}>
          <Card
            className={`rounded-2xl shadow-sm ${
              denyReason === "subscription"
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle
                  className={`h-6 w-6 shrink-0 mt-1 ${
                    denyReason === "subscription" ? "text-amber-600" : "text-red-600"
                  }`}
                />
                <div>
                  {denyReason === "subscription" ? (
                    <>
                      <h2 className="mb-2 text-lg font-semibold text-amber-900">
                        {isExpired ? "Subscription expired" : "Subscription required"}
                      </h2>
                      <p className="mb-4 text-sm text-amber-800">
                        {isExpired
                          ? "Renew your subscription to continue accessing this channel."
                          : "This channel requires an active subscription. Complete payment and wait for admin approval."}
                      </p>
                      <Button asChild className="h-11 bg-green-500 text-white hover:bg-green-600">
                        <Link href={`/agent/teaching/channels/${channelId}/join`}>
                          {isExpired ? "Renew subscription" : "Subscribe now"}
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <h2 className="mb-2 text-lg font-semibold text-red-800">Cannot access this channel</h2>
                      <p className="mb-4 text-sm text-red-700">
                        You are not an active member yet. If you have paid, ask the channel admin to approve your
                        subscription, then try again.
                      </p>
                      <Button asChild className="h-11 bg-green-500 text-white hover:bg-green-600">
                        <Link href={`/agent/teaching/channels/${channelId}/join`}>Request to join</Link>
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => router.push("/agent/teaching")}
                    className="mt-3 h-11 w-full sm:w-auto"
                  >
                    Back to channels hub
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
    <div className={cn(teachingHubPageClass, "overflow-x-hidden")}>
      <div className="border-b border-green-100 bg-gradient-to-r from-emerald-600 to-green-500 shadow-sm sticky top-0 z-40">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/agent/teaching")}
              className="h-11 shrink-0 text-sm text-white hover:bg-white/20"
            >
              ← Back
            </Button>
            <p className="truncate text-base font-semibold text-white sm:text-lg">Channel (member)</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            className="h-11 shrink-0 border-white/30 bg-white/20 text-white hover:bg-white/30"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="w-full">
        <MemberChannelView
          channelId={channelId}
          memberId={agent.id}
          memberName={agent.full_name || agent.email}
        />
      </div>

      <BackToTop />
    </div>
  )
}

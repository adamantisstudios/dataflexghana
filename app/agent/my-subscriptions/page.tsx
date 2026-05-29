"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStoredAgent } from "@/lib/unified-auth-system"
import { isPlatformAdminAgent } from "@/lib/platform-admin"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { supabase } from "@/lib/supabase-client"
import { RefreshCw, AlertCircle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { SubscriptionRenewalDialog } from "@/components/teaching/SubscriptionRenewalDialog"

interface Subscription {
  id: string
  channel_id: string
  channel_name: string
  subscription_starts_at: string
  subscription_expires_at: string
  payment_amount: number
  is_active: boolean
  days_remaining: number
}

export default function MySubscriptionsPage() {
  const router = useRouter()
  const agent = getStoredAgent()
  const agentId = agent?.id
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null)

  const loadSubscriptions = useCallback(async () => {
    if (!agentId) return

    setLoadError(null)
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 20000)

      const res = await fetch("/api/agent/subscriptions", {
        headers: getAgentAuthHeaders(),
        cache: "no-store",
        signal: controller.signal,
      })
      window.clearTimeout(timeoutId)

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")

      setSubscriptions(data.subscriptions || [])
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "Request timed out. Check your connection and try again."
          : error instanceof Error
            ? error.message
            : "Failed to load subscriptions"
      setLoadError(message)
      setSubscriptions([])
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    if (!agentId) {
      router.push("/agent/login")
      return
    }

    if (isPlatformAdminAgent(agent)) {
      router.replace("/agent/teaching")
      return
    }

    void (async () => {
      const { data } = await supabase
        .from("channel_members")
        .select("role")
        .eq("agent_id", agentId)
        .eq("status", "active")
        .in("role", ["admin", "teacher"])

      if (data?.length) {
        router.replace("/agent/teaching")
        return
      }

      void loadSubscriptions()
    })()
  }, [agentId, agent, router, loadSubscriptions])

  if (!agentId) return null

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm text-slate-600">Loading your subscriptions…</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen w-full bg-slate-50 py-4 sm:py-8">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-11" onClick={() => router.push("/agent/teaching")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">My Channel Subscriptions</h1>
          </div>
          <Button variant="outline" className="h-11" onClick={() => void loadSubscriptions()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loadError && (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-900">{loadError}</p>
              <Button className="h-11 bg-emerald-600 hover:bg-emerald-700" onClick={() => void loadSubscriptions()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {subscriptions.length === 0 && !loadError ? (
          <Card className="rounded-2xl border border-slate-200 bg-white py-12 text-center shadow-sm">
            <CardContent>
              <p className="text-slate-600">You do not have any channel subscriptions yet.</p>
              <Button className="mt-4 h-11" variant="outline" onClick={() => router.push("/agent/teaching")}>
                Browse channels
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg text-slate-900">{sub.channel_name}</CardTitle>
                      <p className="mt-1 text-xs text-slate-500">
                        Joined {new Date(sub.subscription_starts_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        sub.is_active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }
                    >
                      {sub.is_active ? "Active" : "Expired"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Monthly fee</p>
                      <p className="text-lg font-bold text-slate-900">GHS {sub.payment_amount.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Days left</p>
                      <p className="text-lg font-bold text-slate-900">{Math.max(0, sub.days_remaining)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Expires</p>
                      <p className="text-lg font-bold text-slate-900">
                        {new Date(sub.subscription_expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {sub.is_active && sub.days_remaining <= 3 && (
                    <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                      <p className="text-sm text-amber-800">Your subscription expires soon. Renew to keep access.</p>
                    </div>
                  )}

                  <Button
                    className="h-11 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setRenewTarget(sub)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renew subscription
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {renewTarget && (
        <SubscriptionRenewalDialog
          open={Boolean(renewTarget)}
          onOpenChange={(open) => !open && setRenewTarget(null)}
          channelName={renewTarget.channel_name}
          channelId={renewTarget.channel_id}
          monthlyFee={renewTarget.payment_amount}
          subscriptionId={renewTarget.id}
          onSuccess={() => {
            setRenewTarget(null)
            void loadSubscriptions()
          }}
        />
      )}
    </main>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { AlertCircle, CheckCircle2, Lock } from "lucide-react"

interface JoinedChannel {
  id: string
  name: string
  description: string
  image_url?: string
  subscription_id?: string
  subscription_status: "active" | "expired" | "none"
  subscription_end_date?: string
  days_remaining?: number
  is_subscription_required: boolean
  monthly_fee?: number
}

export function JoinedChannelsWithSubscriptionStatus() {
  const [channels, setChannels] = useState<JoinedChannel[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      loadJoinedChannels()
    }
  }, [user?.id])

  const loadJoinedChannels = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const now = new Date()

      const { data: memberChannels, error: memberError } = await supabase
        .from("channel_members")
        .select(`
          channel_id,
          teaching_channels(
            id,
            name,
            description,
            image_url
          )
        `)
        .eq("agent_id", user.id)
        .eq("status", "active")

      if (memberError) throw memberError

      const channelIds = memberChannels?.map((m: any) => m.channel_id) || []

      if (channelIds.length === 0) {
        setChannels([])
        return
      }

      const { data: subscriptions } = await supabase
        .from("channel_subscriptions")
        .select(`
          id,
          channel_id,
          subscription_status,
          subscription_end_date
        `)
        .eq("agent_id", user.id)
        .in("channel_id", channelIds)

      const { data: settings } = await supabase
        .from("channel_subscription_settings")
        .select("channel_id, is_enabled, monthly_fee")
        .in("channel_id", channelIds)

      const subscriptionMap = new Map()
      subscriptions?.forEach((s: any) => {
        subscriptionMap.set(s.channel_id, {
          id: s.id,
          status: s.subscription_status,
          end_date: s.subscription_end_date,
        })
      })

      const settingsMap = new Map()
      settings?.forEach((s: any) => {
        settingsMap.set(s.channel_id, {
          is_enabled: s.is_enabled,
          monthly_fee: s.monthly_fee,
        })
      })

      const enriched =
        memberChannels?.map((m: any) => {
          const sub = subscriptionMap.get(m.channel_id)
          const setting = settingsMap.get(m.channel_id)
          const daysRemaining = sub?.end_date
            ? Math.ceil((new Date(sub.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : undefined

          return {
            id: m.channel_id,
            name: m.teaching_channels.name,
            description: m.teaching_channels.description,
            image_url: m.teaching_channels.image_url,
            subscription_id: sub?.id,
            subscription_status: sub?.status || "none",
            subscription_end_date: sub?.end_date,
            days_remaining: daysRemaining,
            is_subscription_required: setting?.is_enabled || false,
            monthly_fee: setting?.monthly_fee,
          }
        }) || []

      setChannels(enriched)
    } catch (error) {
      console.error("[v0] Error loading joined channels:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-4 text-gray-500">Loading your channels...</div>

  if (channels.length === 0) {
    return (
      <Card className="bg-blue-50 border-blue-200 text-center p-6">
        <p className="text-gray-600">You haven't joined any channels yet</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-gray-800">My Channels</h3>
      {channels.map((channel) => (
        <Card key={channel.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-gray-800">{channel.name}</h4>
                <p className="text-xs text-gray-600 line-clamp-1">{channel.description}</p>
              </div>

              {channel.is_subscription_required && (
                <>
                  {channel.subscription_status === "active" && channel.days_remaining !== undefined && (
                    <Badge className="bg-green-100 text-green-800 shrink-0 text-xs">
                      {channel.days_remaining <= 3 ? (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {channel.days_remaining}d left
                    </Badge>
                  )}
                  {channel.subscription_status === "expired" && (
                    <Badge className="bg-red-100 text-red-800 shrink-0 text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                </>
              )}
            </div>

            {/* Expiry warning */}
            {channel.subscription_status === "active" &&
              channel.days_remaining !== undefined &&
              channel.days_remaining <= 3 && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2">
                  <p className="text-xs text-amber-800 font-medium">
                    Your subscription expires in {channel.days_remaining} days. Renew now to avoid losing access.
                  </p>
                </div>
              )}

            {channel.subscription_status === "expired" && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-xs text-red-800 font-medium">
                  Your subscription has expired. You no longer have access to this channel.
                </p>
              </div>
            )}

            <Button
              size="sm"
              className="w-full text-xs h-8"
              variant={channel.subscription_status === "active" ? "default" : "outline"}
            >
              {channel.subscription_status === "active" ? "Open Channel" : "View Channel"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface SubscriptionStatus {
  id: string
  channel_id: string
  subscription_starts_at: string
  subscription_expires_at: string
  is_active: boolean
  days_until_expiry: number
  is_expired: boolean
  is_expiring_soon: boolean
  renewal_reminder_sent: boolean
}

export function useSubscriptionStatus(channelId: string, agentId: string) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!channelId || !agentId) {
      setLoading(false)
      return
    }

    loadSubscriptionStatus()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`subscription:${channelId}:${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "member_subscription_status",
          filter: `channel_id=eq.${channelId},agent_id=eq.${agentId}`,
        },
        () => {
          loadSubscriptionStatus()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [channelId, agentId])

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true)
      const { data, error: queryError } = await supabase
        .from("member_subscription_status")
        .select("*")
        .eq("channel_id", channelId)
        .eq("agent_id", agentId)
        .maybeSingle()

      if (queryError) throw queryError

      if (data) {
        const now = new Date()
        const expiresAt = new Date(data.subscription_expires_at)
        const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        setStatus({
          ...data,
          days_until_expiry: daysLeft,
          is_expired: !data.is_active || daysLeft <= 0,
          is_expiring_soon: daysLeft <= 3 && daysLeft > 0,
          renewal_reminder_sent: !!data.renewal_reminder_sent_at,
        })
      } else {
        setStatus(null)
      }
      setError(null)
    } catch (err: any) {
      console.error("[v0] Error loading subscription status:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { status, loading, error }
}

"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

interface RenewalReminder {
  id: string
  channel_id: string
  channel_name: string
  subscription_end_date: string
  monthly_fee: number
  days_until_expiry: number
}

export function SubscriptionRenewalReminder() {
  const [renewalDue, setRenewalDue] = useState<RenewalReminder[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      loadRenewalsDue()
    }
  }, [user?.id])

  const loadRenewalsDue = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const now = new Date()
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from("channel_subscriptions")
        .select(`
          id,
          channel_id,
          subscription_end_date,
          monthly_fee,
          teaching_channels(name)
        `)
        .eq("agent_id", user.id)
        .eq("subscription_status", "active")
        .eq("is_renewal_due", true)
        .gt("subscription_end_date", now.toISOString())
        .lte("subscription_end_date", threeDaysFromNow.toISOString())

      if (error) throw error

      const reminders = (data || []).map((item: any) => {
        const daysLeft = Math.ceil(
          (new Date(item.subscription_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )
        return {
          id: item.id,
          channel_id: item.channel_id,
          channel_name: item.teaching_channels?.name,
          subscription_end_date: item.subscription_end_date,
          monthly_fee: item.monthly_fee,
          days_until_expiry: daysLeft,
        }
      })

      setRenewalDue(reminders)
    } catch (error) {
      console.error("[v0] Error loading renewal reminders:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || renewalDue.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        Subscription Renewal Reminders
      </h3>

      {renewalDue.map((renewal) => (
        <Alert key={renewal.id} className="bg-amber-50 border-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <AlertDescription className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm text-amber-900">{renewal.channel_name}</p>
                <p className="text-xs text-amber-800 mt-1">
                  Your subscription expires in <span className="font-bold">{renewal.days_until_expiry}</span> days
                </p>
              </div>
              <Badge className="bg-amber-600 shrink-0 ml-2">Action Needed</Badge>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-7 border-amber-300 bg-transparent"
                onClick={() =>
                  // Redirect to renewal payment flow
                  (window.location.href = `/teaching/channels/${renewal.channel_id}?renew=true`)
                }
              >
                <Clock className="h-3 w-3 mr-1" />
                Renew Now
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 text-xs h-7" onClick={() => loadRenewalsDue()}>
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

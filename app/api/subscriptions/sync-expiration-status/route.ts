import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("[v0] Running subscription expiration check")

    // 1. Find expired subscriptions (date passed) and mark as inactive
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: expiredSubs, error: expireError } = await supabase
      .from("member_subscription_status")
      .select("*")
      .eq("is_active", true)
      .lte("subscription_expires_at", today.toISOString())

    if (expireError) throw expireError

    console.log(`[v0] Found ${expiredSubs?.length || 0} expired subscriptions`)

    // Mark as inactive and remove from channel
    for (const sub of expiredSubs || []) {
      // Mark subscription as inactive
      await supabase
        .from("member_subscription_status")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", sub.id)

      // Remove member from channel
      await supabase.from("channel_members").delete().eq("channel_id", sub.channel_id).eq("agent_id", sub.agent_id)

      console.log(`[v0] Removed expired member ${sub.agent_id} from channel ${sub.channel_id}`)
    }

    // 2. Find subscriptions expiring in 3 days and send reminders
    const reminderStartDate = new Date()
    reminderStartDate.setDate(reminderStartDate.getDate() + 3)
    reminderStartDate.setHours(0, 0, 0, 0)

    const reminderEndDate = new Date(reminderStartDate)
    reminderEndDate.setDate(reminderEndDate.getDate() + 1)

    const { data: reminderSubs, error: reminderError } = await supabase
      .from("member_subscription_status")
      .select("*")
      .eq("is_active", true)
      .gte("subscription_expires_at", reminderStartDate.toISOString())
      .lt("subscription_expires_at", reminderEndDate.toISOString())
      .is("renewal_reminder_sent_at", null)

    if (reminderError) throw reminderError

    console.log(`[v0] Found ${reminderSubs?.length || 0} subscriptions to remind`)

    // Mark reminders as sent
    for (const sub of reminderSubs || []) {
      await supabase
        .from("member_subscription_status")
        .update({ renewal_reminder_sent_at: new Date().toISOString() })
        .eq("id", sub.id)

      // Here you could also send notifications to users (via email/SMS/push)
      console.log(`[v0] Reminder sent for subscription ${sub.id} expiring on ${sub.subscription_expires_at}`)
    }

    return NextResponse.json({
      success: true,
      expired: expiredSubs?.length || 0,
      reminders: reminderSubs?.length || 0,
      message: "Subscription expiration check completed",
    })
  } catch (error: any) {
    console.error("[v0] Error in expiration check:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Find all subscriptions that expire today or have already expired
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: expiredSubscriptions, error: queryError } = await supabase
      .from("member_subscription_status")
      .select("*")
      .eq("is_active", true)
      .lte("subscription_expires_at", today.toISOString())

    if (queryError) throw queryError

    // Mark as inactive and remove from channel members
    for (const sub of expiredSubscriptions || []) {
      // Update subscription status
      await supabase.from("member_subscription_status").update({ is_active: false }).eq("id", sub.id)

      // Remove from channel members
      await supabase.from("channel_members").delete().eq("channel_id", sub.channel_id).eq("agent_id", sub.agent_id)
    }

    // Find subscriptions expiring in 3 days to send reminders
    const reminderDate = new Date()
    reminderDate.setDate(reminderDate.getDate() + 3)

    const { data: reminderSubscriptions, error: reminderError } = await supabase
      .from("member_subscription_status")
      .select("*")
      .eq("is_active", true)
      .gte("subscription_expires_at", new Date().toISOString())
      .lte("subscription_expires_at", reminderDate.toISOString())
      .is("renewal_reminder_sent_at", null)

    if (reminderError) throw reminderError

    // Mark reminders as sent
    for (const sub of reminderSubscriptions || []) {
      await supabase
        .from("member_subscription_status")
        .update({ renewal_reminder_sent_at: new Date().toISOString() })
        .eq("id", sub.id)
    }

    return NextResponse.json({
      success: true,
      expired: expiredSubscriptions?.length || 0,
      reminders: reminderSubscriptions?.length || 0,
    })
  } catch (error: any) {
    console.error("[v0] Error checking subscription expiration:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

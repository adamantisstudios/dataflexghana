import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const now = new Date()

    const { data: expiredSubs, error: fetchError } = await supabase
      .from("channel_subscriptions")
      .select("id, agent_id, channel_id, subscription_end_date")
      .lte("subscription_end_date", now.toISOString())
      .eq("subscription_status", "active")

    if (fetchError) throw fetchError

    for (const sub of expiredSubs || []) {
      // Update subscription status
      await supabase
        .from("channel_subscriptions")
        .update({
          subscription_status: "expired",
          is_active: false,
          auto_removed_at: now.toISOString(),
        })
        .eq("id", sub.id)

      // Remove from channel members
      await supabase.from("channel_members").delete().eq("channel_id", sub.channel_id).eq("agent_id", sub.agent_id)

      // Log the removal
      console.log(`[v0] Removed ${sub.agent_id} from channel ${sub.channel_id} - subscription expired`)
    }

    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const { data: expiringSoon } = await supabase
      .from("channel_subscriptions")
      .select("id, agent_id, subscription_end_date")
      .gt("subscription_end_date", now.toISOString())
      .lte("subscription_end_date", threeDaysFromNow.toISOString())
      .eq("subscription_status", "active")
      .eq("is_renewal_due", false)

    for (const sub of expiringSoon || []) {
      await supabase.from("channel_subscriptions").update({ is_renewal_due: true }).eq("id", sub.id)
    }

    return NextResponse.json({
      success: true,
      expired_count: (expiredSubs || []).length,
      renew_due_count: (expiringSoon || []).length,
    })
  } catch (error: any) {
    console.error("[v0] Error checking subscription expiry:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

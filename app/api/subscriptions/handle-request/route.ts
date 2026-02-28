import { supabase } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { channelId, agentId, action, amountVerified, notes } = await request.json()

    if (action === "approve") {
      const now = new Date()
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      // Get fee from subscription settings
      const { data: settings } = await supabase
        .from("channel_subscription_settings")
        .select("monthly_fee")
        .eq("channel_id", channelId)
        .single()

      // Create subscription entry
      const { error: subError } = await supabase.from("channel_subscriptions").insert({
        channel_id: channelId,
        agent_id: agentId,
        subscription_start_date: now.toISOString(),
        subscription_end_date: expiryDate.toISOString(),
        is_active: true,
        payment_status: "verified",
        payment_date: now.toISOString(),
        monthly_fee: settings?.monthly_fee || 0,
        subscription_status: "active",
        payment_verified_at: now.toISOString(),
        verified_payment_amount: amountVerified,
      })

      if (subError) throw subError

      const { error: memberError } = await supabase.from("channel_members").insert({
        channel_id: channelId,
        agent_id: agentId,
        role: "member",
        status: "active",
      })

      if (memberError) throw memberError

      const { error: logError } = await supabase.from("subscription_verification_log").insert({
        channel_id: channelId,
        agent_id: agentId,
        subscription_id: "", // Will be set by trigger or retrieved
        verified_by: request.headers.get("x-agent-id") || "admin",
        action: "approved",
        amount_verified: amountVerified,
        notes,
      })

      return NextResponse.json({ success: true, message: "Subscription approved and 30-day timer started" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error handling subscription request:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

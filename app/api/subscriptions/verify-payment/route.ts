import { supabase } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, channelId, agentId, amountVerified, verifiedBy, notes } = await request.json()

    if (!subscriptionId || !channelId || !agentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const now = new Date()
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const { error: subError } = await supabase
      .from("channel_subscriptions")
      .update({
        subscription_status: "active",
        payment_status: "verified",
        payment_verified_at: now.toISOString(),
        payment_verified_by: verifiedBy,
        verified_payment_amount: amountVerified,
        subscription_start_date: now.toISOString(),
        subscription_end_date: expiryDate.toISOString(),
        is_active: true,
        payment_date: now.toISOString(),
      })
      .eq("id", subscriptionId)

    if (subError) throw subError

    const { error: memberError } = await supabase
      .from("channel_members")
      .insert({
        channel_id: channelId,
        agent_id: agentId,
        role: "member",
        status: "active",
      })
      .select()
      .single()

    if (memberError && !memberError.message.includes("duplicate")) throw memberError

    await supabase.from("subscription_verification_log").insert({
      subscription_id: subscriptionId,
      channel_id: channelId,
      agent_id: agentId,
      verified_by: verifiedBy,
      action: "approved",
      amount_verified: amountVerified,
      notes,
    })

    return NextResponse.json({
      success: true,
      message: "Payment verified! Member added to channel. 30-day subscription timer started.",
      expiryDate: expiryDate.toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Error verifying payment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

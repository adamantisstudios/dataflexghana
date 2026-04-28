import { supabase } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { joinRequestId, channelId, agentId, amountVerified, notes } = await request.json()

    if (!joinRequestId || !channelId || !agentId || !amountVerified) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the join request
    const { data: joinRequest, error: requestError } = await supabase
      .from("channel_join_requests")
      .select("*")
      .eq("id", joinRequestId)
      .single()

    if (requestError) throw requestError

    // Get subscription settings
    const { data: subscription, error: subError } = await supabase
      .from("channel_subscription_settings")
      .select("*")
      .eq("channel_id", channelId)
      .single()

    if (subError) throw subError

    // Create/update member subscription status with 30-day expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error: createError } = await supabase.from("member_subscription_status").upsert([
      {
        channel_id: channelId,
        agent_id: agentId,
        join_request_id: joinRequestId,
        subscription_starts_at: new Date().toISOString(),
        subscription_expires_at: expiresAt.toISOString(),
        payment_verified_at: new Date().toISOString(),
        payment_amount: amountVerified,
        payment_notes: notes,
        is_active: true,
      },
    ])

    if (createError) throw createError

    // Add member to channel
    const { data: existingMember } = await supabase
      .from("channel_members")
      .select("id")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .maybeSingle()

    if (!existingMember) {
      const { error: memberError } = await supabase.from("channel_members").insert([
        {
          channel_id: channelId,
          agent_id: agentId,
          role: "member",
          joined_at: new Date().toISOString(),
        },
      ])

      if (memberError) throw memberError
    }

    return NextResponse.json({
      success: true,
      message: "Subscription verified and member approved",
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Error verifying subscription:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

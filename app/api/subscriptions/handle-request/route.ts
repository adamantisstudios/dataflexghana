import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { requireAdminSession } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { channelId, agentId, action, amountVerified, notes, joinRequestId } = await request.json()

    if (action !== "approve") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (!channelId || !agentId) {
      return NextResponse.json({ error: "channelId and agentId are required" }, { status: 400 })
    }

    const db = getAdminClient()
    const now = new Date()
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const { data: settings } = await db
      .from("channel_subscription_settings")
      .select("monthly_fee")
      .eq("channel_id", channelId)
      .maybeSingle()

    const paymentAmount = amountVerified ?? settings?.monthly_fee ?? 0

    const { data: subscription, error: subError } = await db
      .from("member_subscription_status")
      .upsert(
        {
          channel_id: channelId,
          agent_id: agentId,
          join_request_id: joinRequestId || null,
          subscription_starts_at: now.toISOString(),
          subscription_expires_at: expiryDate.toISOString(),
          payment_verified_at: now.toISOString(),
          payment_amount: paymentAmount,
          payment_notes: notes || null,
          approved_by_agent_id: null,
          is_active: true,
          updated_at: now.toISOString(),
        },
        { onConflict: "channel_id,agent_id" },
      )
      .select()
      .single()

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 })
    }

    const { data: existingMember } = await db
      .from("channel_members")
      .select("id")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .maybeSingle()

    if (!existingMember) {
      const { error: memberError } = await db.from("channel_members").insert({
        channel_id: channelId,
        agent_id: agentId,
        role: "member",
        status: "active",
      })
      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 })
      }
    }

    if (joinRequestId) {
      await db
        .from("channel_join_requests")
        .update({ status: "approved", responded_at: now.toISOString() })
        .eq("id", joinRequestId)
    }

    await db.from("subscription_verification_log").insert({
      subscription_id: subscription?.id || null,
      channel_id: channelId,
      agent_id: agentId,
      verified_by: String(session.admin.id),
      action: "approved",
      amount_verified: paymentAmount,
      notes: notes || null,
    })

    return NextResponse.json({
      success: true,
      message: "Subscription approved via member_subscription_status",
      expiresAt: expiryDate.toISOString(),
    })
  } catch (error: unknown) {
    console.error("handle-request subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

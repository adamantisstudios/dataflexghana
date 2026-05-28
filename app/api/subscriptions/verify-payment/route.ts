import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { requireAdminSession } from "@/lib/api-auth"
import { ensureChannelMemberActive } from "@/lib/ensure-channel-member-active"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { channelId, agentId, amountVerified, notes, joinRequestId } = await request.json()

    if (!channelId || !agentId) {
      return NextResponse.json({ error: "channelId and agentId are required" }, { status: 400 })
    }

    const db = getAdminClient()
    const now = new Date()
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

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
          payment_amount: amountVerified ?? 0,
          payment_notes: notes || null,
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

    const memberResult = await ensureChannelMemberActive(db, channelId, agentId, "member")
    if (!memberResult.ok) {
      return NextResponse.json({ error: memberResult.error || "Failed to activate membership" }, { status: 500 })
    }

    await db.from("subscription_verification_log").insert({
      subscription_id: subscription?.id || null,
      channel_id: channelId,
      agent_id: agentId,
      verified_by: String(session.admin.id),
      action: "approved",
      amount_verified: amountVerified ?? 0,
      notes: notes || null,
    })

    return NextResponse.json({
      success: true,
      message: "Payment verified. Member subscription active for 30 days.",
      expiresAt: expiryDate.toISOString(),
    })
  } catch (error: unknown) {
    console.error("verify-payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

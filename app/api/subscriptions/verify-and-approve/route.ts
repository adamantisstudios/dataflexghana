import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { requireAdminSession } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { joinRequestId, channelId, agentId, amountVerified, notes } = await request.json()

    if (!joinRequestId || !channelId || !agentId || amountVerified == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: joinRequest, error: requestError } = await db
      .from("channel_join_requests")
      .select("*")
      .eq("id", joinRequestId)
      .single()

    if (requestError || !joinRequest) {
      return NextResponse.json({ error: "Join request not found" }, { status: 404 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data: subscription, error: createError } = await db
      .from("member_subscription_status")
      .upsert(
        {
          channel_id: channelId,
          agent_id: agentId,
          join_request_id: joinRequestId,
          subscription_starts_at: new Date().toISOString(),
          subscription_expires_at: expiresAt.toISOString(),
          payment_verified_at: new Date().toISOString(),
          payment_amount: amountVerified,
          payment_notes: notes || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "channel_id,agent_id" },
      )
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
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

    await db
      .from("channel_join_requests")
      .update({ status: "approved", responded_at: new Date().toISOString() })
      .eq("id", joinRequestId)

    await db.from("subscription_verification_log").insert({
      subscription_id: subscription?.id || null,
      channel_id: channelId,
      agent_id: agentId,
      verified_by: String(session.admin.id),
      action: "approved",
      amount_verified: amountVerified,
      notes: notes || null,
    })

    return NextResponse.json({
      success: true,
      message: "Subscription verified and member approved",
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error: unknown) {
    console.error("verify-and-approve:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

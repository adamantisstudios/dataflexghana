import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { ensureChannelMemberActive } from "@/lib/ensure-channel-member-active"

export const dynamic = "force-dynamic"

/** Channel admin approves a join request (free or paid with verification). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { channelId } = await params
    const body = await request.json()
    const { requestId, amountVerified, notes } = body

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: membership } = await db
      .from("channel_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .eq("status", "active")
      .maybeSingle()

    if (!membership || (membership.role !== "admin" && membership.role !== "teacher")) {
      return NextResponse.json({ error: "Only channel admins can approve requests" }, { status: 403 })
    }

    const { data: joinRequest, error: fetchError } = await db
      .from("channel_join_requests")
      .select("*")
      .eq("id", requestId)
      .eq("channel_id", channelId)
      .single()

    if (fetchError || !joinRequest) {
      return NextResponse.json({ error: "Join request not found" }, { status: 404 })
    }

    const { data: settings } = await db
      .from("channel_subscription_settings")
      .select("is_enabled, monthly_fee")
      .eq("channel_id", channelId)
      .maybeSingle()

    const now = new Date()
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (settings?.is_enabled) {
      const amount = amountVerified ?? settings.monthly_fee ?? 0

      const { error: subError } = await db.from("member_subscription_status").upsert(
        {
          channel_id: channelId,
          agent_id: joinRequest.agent_id,
          join_request_id: requestId,
          subscription_starts_at: now.toISOString(),
          subscription_expires_at: expiryDate.toISOString(),
          payment_verified_at: now.toISOString(),
          payment_amount: amount,
          payment_notes: notes || null,
          is_active: true,
          updated_at: now.toISOString(),
        },
        { onConflict: "channel_id,agent_id" },
      )

      if (subError) {
        return NextResponse.json({ error: subError.message }, { status: 500 })
      }
    }

    const memberResult = await ensureChannelMemberActive(db, channelId, joinRequest.agent_id, "member")
    if (!memberResult.ok) {
      return NextResponse.json({ error: memberResult.error || "Failed to activate member" }, { status: 500 })
    }

    await db
      .from("channel_join_requests")
      .update({ status: "approved", responded_at: now.toISOString() })
      .eq("id", requestId)

    return NextResponse.json({
      success: true,
      message: settings?.is_enabled
        ? "Payment verified and member activated for 30 days"
        : "Join request approved",
      expiresAt: settings?.is_enabled ? expiryDate.toISOString() : undefined,
    })
  } catch (error) {
    console.error("[agent channel approve request]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

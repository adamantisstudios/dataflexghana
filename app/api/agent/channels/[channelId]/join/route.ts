import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { hasActiveChannelSubscription } from "@/lib/ensure-channel-member-active"
import { computeMembershipUiStatus, submitChannelJoinRequest } from "@/lib/channel-membership-lifecycle"

export const dynamic = "force-dynamic"

export async function GET(
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
    const db = getAdminClient()

    const { data: channel, error: channelError } = await db
      .from("teaching_channels")
      .select("id, name, description, image_url, created_by")
      .eq("id", channelId)
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const { data: subscription } = await db
      .from("channel_subscription_settings")
      .select("*")
      .eq("channel_id", channelId)
      .maybeSingle()

    const { data: joinRequest } = await db
      .from("channel_join_requests")
      .select("id, status, created_at, request_message, requested_at")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .maybeSingle()

    const { data: member } = await db
      .from("channel_members")
      .select("status")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .maybeSingle()

    const { data: subRow } = await db
      .from("member_subscription_status")
      .select("is_active, subscription_expires_at")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .maybeSingle()

    let daysUntilExpiry: number | undefined
    let subscriptionActive = false
    if (subRow) {
      const expiresAt = new Date(subRow.subscription_expires_at)
      daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      subscriptionActive = Boolean(subRow.is_active) && daysUntilExpiry > 0
    }

    const membershipStatus = computeMembershipUiStatus({
      joinRequestStatus: joinRequest?.status,
      subscriptionEnabled: Boolean(subscription?.is_enabled),
      subscriptionActive,
      daysUntilExpiry,
      isChannelMember: Boolean(member),
      memberRowStatus: member?.status,
    })

    const hasActiveSub = await hasActiveChannelSubscription(db, channelId, agentId)

    return NextResponse.json({
      success: true,
      channel,
      subscription: subscription || null,
      joinRequest: joinRequest || null,
      membershipStatus,
      canRenew:
        membershipStatus === "expired" ||
        (joinRequest?.status === "approved" && !hasActiveSub),
    })
  } catch (error) {
    console.error("[agent channel join GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const requestMessage = typeof body.request_message === "string" ? body.request_message.trim() : ""

    const db = getAdminClient()

    const { data: subscription } = await db
      .from("channel_subscription_settings")
      .select("is_enabled, monthly_fee")
      .eq("channel_id", channelId)
      .maybeSingle()

    if (subscription?.is_enabled && !requestMessage) {
      return NextResponse.json(
        { error: "Please include a message with your join request for this paid channel" },
        { status: 400 },
      )
    }

    const result = await submitChannelJoinRequest(db, channelId, agentId, requestMessage)

    return NextResponse.json({
      success: true,
      joinRequest: result.joinRequest,
      requiresPayment: result.requiresPayment,
      isRenewal: result.isRenewal,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    if (message.includes("pending") || message.includes("active membership")) {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    console.error("[agent channel join POST]", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

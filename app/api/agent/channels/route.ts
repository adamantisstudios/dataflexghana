import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { computeMembershipUiStatus } from "@/lib/channel-membership-lifecycle"

export const dynamic = "force-dynamic"

/** List public active teaching channels with membership hints for the agent. */
export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Agent authentication required")
  }

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = getAdminClient()

    const { data: publicChannels, error: channelsError } = await db
      .from("teaching_channels")
      .select("id, name, description, image_url, is_public, is_active, created_at")
      .eq("is_public", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (channelsError) {
      return NextResponse.json({ error: channelsError.message }, { status: 500 })
    }

    const channelIds = (publicChannels || []).map((c) => c.id)

    const [{ data: subscriptionSettings }, { data: memberChannels }, { data: userSubscriptions }, { data: joinRequests }] =
      await Promise.all([
        db.from("channel_subscription_settings").select("channel_id, is_enabled, monthly_fee"),
        db.from("channel_members").select("channel_id, role, status").eq("agent_id", agentId),
        db
          .from("member_subscription_status")
          .select("channel_id, subscription_expires_at, is_active")
          .eq("agent_id", agentId),
        db.from("channel_join_requests").select("channel_id, status").eq("agent_id", agentId),
      ])

    const subscriptionMap = new Map(
      (subscriptionSettings || []).map((s) => [s.channel_id, { enabled: s.is_enabled, fee: s.monthly_fee }]),
    )
    const roleMap = new Map((memberChannels || []).map((m) => [m.channel_id, m.role]))
    const memberStatusMap = new Map((memberChannels || []).map((m) => [m.channel_id, m.status]))
    const memberChannelIds = new Set((memberChannels || []).map((m) => m.channel_id))
    const joinRequestMap = new Map((joinRequests || []).map((r) => [r.channel_id, r.status]))

    const subscriptionStatusMap = new Map(
      (userSubscriptions || []).map((s) => {
        const expiresAt = new Date(s.subscription_expires_at)
        const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        const isActive = Boolean(s.is_active) && daysLeft > 0
        return [s.channel_id, { isActive, daysUntilExpiry: daysLeft }]
      }),
    )

    const channels = (publicChannels || []).map((channel) => {
      const subSettings = subscriptionMap.get(channel.id) || { enabled: false, fee: 0 }
      const subStatus = subscriptionStatusMap.get(channel.id) || { isActive: false, daysUntilExpiry: undefined }
      const joinStatus = joinRequestMap.get(channel.id) ?? null
      const membership_status = computeMembershipUiStatus({
        joinRequestStatus: joinStatus,
        subscriptionEnabled: Boolean(subSettings.enabled),
        subscriptionActive: Boolean(subStatus.isActive),
        daysUntilExpiry: subStatus.daysUntilExpiry,
        isChannelMember: memberChannelIds.has(channel.id),
        memberRowStatus: memberStatusMap.get(channel.id),
      })

      return {
        ...channel,
        is_member: membership_status === "active",
        user_role: roleMap.get(channel.id) ?? null,
        subscription_enabled: Boolean(subSettings.enabled),
        subscription_fee: Number(subSettings.fee) || 0,
        days_until_expiry: subStatus.daysUntilExpiry,
        is_subscription_active: Boolean(subStatus.isActive),
        membership_status,
        join_request_status: joinStatus,
      }
    })

    return NextResponse.json({
      success: true,
      channels,
      total: channelIds.length,
    })
  } catch (e) {
    console.error("[agent/channels GET]", e)
    return NextResponse.json({ error: "Failed to load channels" }, { status: 500 })
  }
}

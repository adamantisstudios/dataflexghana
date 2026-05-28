import type { SupabaseClient } from "@supabase/supabase-js"
import { hasActiveChannelSubscription } from "@/lib/ensure-channel-member-active"

export type MembershipUiStatus = "none" | "pending" | "active" | "expired"

export type JoinRequestRow = {
  id: string
  status: string
  request_message?: string | null
  created_at?: string
  requested_at?: string
}

/** Derive UI status for channel cards and join page. */
export function computeMembershipUiStatus(input: {
  joinRequestStatus?: string | null
  subscriptionEnabled: boolean
  subscriptionActive: boolean
  daysUntilExpiry?: number
  isChannelMember: boolean
  memberRowStatus?: string | null
}): MembershipUiStatus {
  const { joinRequestStatus, subscriptionEnabled, subscriptionActive, daysUntilExpiry, isChannelMember, memberRowStatus } =
    input

  if (joinRequestStatus === "pending") {
    return "pending"
  }

  const subValid =
    subscriptionActive &&
    (daysUntilExpiry === undefined || daysUntilExpiry > 0)

  if (subscriptionEnabled) {
    if (subValid && (isChannelMember || memberRowStatus === "active")) {
      return "active"
    }
    if (
      joinRequestStatus === "approved" ||
      isChannelMember ||
      memberRowStatus === "expired" ||
      (!subValid && (joinRequestStatus || memberRowStatus))
    ) {
      return "expired"
    }
    return "none"
  }

  if (isChannelMember && memberRowStatus === "active") {
    return "active"
  }
  if (joinRequestStatus === "pending") {
    return "pending"
  }
  if (joinRequestStatus === "approved" && isChannelMember) {
    return "active"
  }
  return "none"
}

export function canSubmitJoinRequest(input: {
  joinRequestStatus?: string | null
  subscriptionActive: boolean
  isActiveMember: boolean
  subscriptionEnabled?: boolean
}): { allowed: boolean; reason?: string; isRenewal?: boolean } {
  const { joinRequestStatus, subscriptionActive, isActiveMember, subscriptionEnabled } = input

  if (joinRequestStatus === "pending") {
    return {
      allowed: false,
      reason: "You already have a pending join request for this channel. Awaiting admin approval.",
    }
  }

  if (joinRequestStatus === "approved" && isActiveMember) {
    const fullyActive = subscriptionEnabled ? subscriptionActive : true
    if (fullyActive) {
      return {
        allowed: false,
        reason: "You already have an active membership for this channel.",
      }
    }
    return { allowed: true, isRenewal: true }
  }

  if (joinRequestStatus === "approved") {
    return { allowed: true, isRenewal: true }
  }

  if (joinRequestStatus === "rejected") {
    return { allowed: true, isRenewal: false }
  }

  return { allowed: true, isRenewal: false }
}

type Db = SupabaseClient

/**
 * Create or reopen a join request (handles renewal after expiry/rejection).
 */
export async function submitChannelJoinRequest(
  db: Db,
  channelId: string,
  agentId: string,
  requestMessage: string,
): Promise<{
  joinRequest: JoinRequestRow
  requiresPayment: boolean
  isRenewal: boolean
}> {
  const { data: subscription } = await db
    .from("channel_subscription_settings")
    .select("is_enabled, monthly_fee")
    .eq("channel_id", channelId)
    .maybeSingle()

  const { data: existing } = await db
    .from("channel_join_requests")
    .select("id, status")
    .eq("channel_id", channelId)
    .eq("agent_id", agentId)
    .maybeSingle()

  const subscriptionEnabled = Boolean(subscription?.is_enabled)
  const hasActiveSub = await hasActiveChannelSubscription(db, channelId, agentId)

  const { data: member } = await db
    .from("channel_members")
    .select("id, status")
    .eq("channel_id", channelId)
    .eq("agent_id", agentId)
    .maybeSingle()

  const isActiveMember =
    member?.status === "active" && (!subscriptionEnabled || hasActiveSub)

  const gate = canSubmitJoinRequest({
    joinRequestStatus: existing?.status,
    subscriptionActive: hasActiveSub,
    isActiveMember: Boolean(isActiveMember),
    subscriptionEnabled,
  })

  if (!gate.allowed) {
    throw new Error(gate.reason || "Cannot submit join request")
  }

  const now = new Date().toISOString()
  const payload = {
    request_message: requestMessage || null,
    status: "pending",
    requested_at: now,
    responded_at: null,
  }

  let joinRequest: JoinRequestRow

  if (existing) {
    const { data: updated, error } = await db
      .from("channel_join_requests")
      .update(payload)
      .eq("id", existing.id)
      .select("id, status, request_message, requested_at, created_at")
      .single()

    if (error || !updated) {
      throw new Error(error?.message || "Failed to update join request")
    }
    joinRequest = updated
  } else {
    const { data: inserted, error } = await db
      .from("channel_join_requests")
      .insert({
        channel_id: channelId,
        agent_id: agentId,
        ...payload,
      })
      .select("id, status, request_message, requested_at, created_at")
      .single()

    if (error || !inserted) {
      throw new Error(error?.message || "Failed to create join request")
    }
    joinRequest = inserted
  }

  if (member && member.status === "expired") {
    await db
      .from("channel_members")
      .update({ status: "pending" })
      .eq("id", member.id)
  }

  return {
    joinRequest,
    requiresPayment: Boolean(subscription?.is_enabled),
    isRenewal: Boolean(gate.isRenewal),
  }
}

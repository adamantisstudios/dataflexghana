import { supabase } from "@/lib/supabase-client"

export interface ChannelSubscriptionSettings {
  is_enabled: boolean
  monthly_fee?: number
  payment_contact_name?: string
  payment_contact_number?: string
  payment_instructions?: string
}

export interface MemberSubscriptionRow {
  id: string
  channel_id: string
  agent_id: string
  subscription_expires_at: string
  is_active: boolean
  payment_amount?: number
}

export type SubscriptionAccessResult =
  | { allowed: true; requiresSubscription: false }
  | { allowed: true; requiresSubscription: true; subscription: MemberSubscriptionRow }
  | {
      allowed: false
      reason: "not_member" | "subscription_required" | "subscription_expired"
      settings?: ChannelSubscriptionSettings
      channelId: string
    }

/** Teachers/admins bypass paid subscription checks. */
export async function checkChannelSubscriptionAccess(
  channelId: string,
  agentId: string,
  role: string | null,
): Promise<SubscriptionAccessResult> {
  if (role === "admin" || role === "teacher") {
    return { allowed: true, requiresSubscription: false }
  }

  const { data: settings } = await supabase
    .from("channel_subscription_settings")
    .select("is_enabled, monthly_fee, payment_contact_name, payment_contact_number, payment_instructions")
    .eq("channel_id", channelId)
    .maybeSingle()

  if (!settings?.is_enabled) {
    return { allowed: true, requiresSubscription: false }
  }

  const { data: subscription } = await supabase
    .from("member_subscription_status")
    .select("id, channel_id, agent_id, subscription_expires_at, is_active, payment_amount")
    .eq("channel_id", channelId)
    .eq("agent_id", agentId)
    .maybeSingle()

  if (!subscription) {
    return {
      allowed: false,
      reason: "subscription_required",
      settings: settings as ChannelSubscriptionSettings,
      channelId,
    }
  }

  const expiresAt = new Date(subscription.subscription_expires_at)
  const isExpired = !subscription.is_active || expiresAt.getTime() < Date.now()

  if (isExpired) {
    return {
      allowed: false,
      reason: "subscription_expired",
      settings: settings as ChannelSubscriptionSettings,
      channelId,
    }
  }

  return {
    allowed: true,
    requiresSubscription: true,
    subscription: subscription as MemberSubscriptionRow,
  }
}

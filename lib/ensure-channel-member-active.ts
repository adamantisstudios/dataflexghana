import type { SupabaseClient } from "@supabase/supabase-js"

type Db = SupabaseClient

/** Returns true when the agent has a paid subscription row that is currently valid. */
export async function hasActiveChannelSubscription(
  db: Db,
  channelId: string,
  agentId: string,
): Promise<boolean> {
  const { data: sub } = await db
    .from("member_subscription_status")
    .select("is_active, subscription_expires_at")
    .eq("channel_id", channelId)
    .eq("agent_id", agentId)
    .maybeSingle()

  if (!sub?.is_active) return false
  return new Date(sub.subscription_expires_at).getTime() > Date.now()
}

/**
 * Ensures a channel_members row exists with status "active".
 * Call after admin approves payment / subscription.
 */
export async function ensureChannelMemberActive(
  db: Db,
  channelId: string,
  agentId: string,
  role: "member" | "teacher" | "admin" = "member",
): Promise<{ ok: boolean; error?: string }> {
  const { data: existing, error: fetchError } = await db
    .from("channel_members")
    .select("id, status, role")
    .eq("channel_id", channelId)
    .eq("agent_id", agentId)
    .maybeSingle()

  if (fetchError) {
    return { ok: false, error: fetchError.message }
  }

  const now = new Date().toISOString()

  if (existing) {
    if (existing.status === "active") {
      if (role && existing.role !== role) {
        const { error: roleError } = await db
          .from("channel_members")
          .update({ role })
          .eq("id", existing.id)
        if (roleError) {
          return { ok: false, error: roleError.message }
        }
      }
      return { ok: true }
    }
    const { error: updateError } = await db
      .from("channel_members")
      .update({ status: "active", joined_at: now, role })
      .eq("id", existing.id)

    if (updateError) {
      return { ok: false, error: updateError.message }
    }
    return { ok: true }
  }

  const { error: insertError } = await db.from("channel_members").insert({
    channel_id: channelId,
    agent_id: agentId,
    role,
    status: "active",
    joined_at: now,
  })

  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  return { ok: true }
}

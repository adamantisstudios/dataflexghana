import type { SupabaseClient } from "@supabase/supabase-js"
import { getChannelMembership } from "@/lib/channel-audio-auth"
import { isPlatformAdminAgent } from "@/lib/platform-admin"

const CHANNEL_STAFF_ROLES = new Set(["teacher", "admin"])

export type ChannelContentAgent = {
  id: string
  email?: string | null
}

/** Channel owner, channel admin/teacher, or platform admin may upload/manage content. */
export async function canManageChannelContent(
  db: SupabaseClient,
  channelId: string,
  agent: ChannelContentAgent,
): Promise<{ allowed: boolean; error?: string }> {
  if (isPlatformAdminAgent(agent)) {
    return { allowed: true }
  }

  const membership = await getChannelMembership(db, channelId, agent.id)
  if (membership && CHANNEL_STAFF_ROLES.has(membership.role)) {
    return { allowed: true }
  }

  const { data: channel } = await db
    .from("teaching_channels")
    .select("created_by")
    .eq("id", channelId)
    .maybeSingle()

  if (channel?.created_by && String(channel.created_by) === String(agent.id)) {
    return { allowed: true }
  }

  return {
    allowed: false,
    error: "Only channel admins can upload content for this channel.",
  }
}

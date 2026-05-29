import type { SupabaseClient } from "@supabase/supabase-js"
import { isPlatformAdminAgent } from "@/lib/platform-admin"

const ADMIN_ROLES = new Set(["teacher", "admin"])

export type ChannelMemberRow = {
  role: string
  status: string
}

export async function getChannelMembership(
  db: SupabaseClient,
  channelId: string,
  agentId: string,
): Promise<ChannelMemberRow | null> {
  const { data, error } = await db
    .from("channel_members")
    .select("role, status")
    .eq("channel_id", channelId)
    .eq("agent_id", agentId)
    .maybeSingle()

  if (error || !data || data.status !== "active") return null
  return data as ChannelMemberRow
}

export async function assertChannelMember(
  db: SupabaseClient,
  channelId: string,
  agentId: string,
): Promise<{ ok: true; role: string } | { ok: false; status: number; error: string }> {
  const membership = await getChannelMembership(db, channelId, agentId)
  if (!membership) {
    return { ok: false, status: 403, error: "You must be an active channel member" }
  }
  return { ok: true, role: membership.role }
}

export async function assertChannelAdmin(
  db: SupabaseClient,
  channelId: string,
  agentId: string,
  agent?: { email?: string | null },
): Promise<{ ok: true; role: string } | { ok: false; status: number; error: string }> {
  if (agent && isPlatformAdminAgent(agent)) {
    return { ok: true, role: "platform_admin" }
  }

  const membership = await getChannelMembership(db, channelId, agentId)
  if (membership && ADMIN_ROLES.has(membership.role)) {
    return { ok: true, role: membership.role }
  }

  const { data: channel } = await db
    .from("teaching_channels")
    .select("created_by")
    .eq("id", channelId)
    .maybeSingle()

  if (channel?.created_by && String(channel.created_by) === String(agentId)) {
    return { ok: true, role: "owner" }
  }

  return { ok: false, status: 403, error: "Only channel teachers or admins can manage audio lectures" }
}

export async function getLectureChannelId(
  db: SupabaseClient,
  lectureId: string,
): Promise<string | null> {
  const { data } = await db
    .from("channel_audio_lectures")
    .select("channel_id")
    .eq("id", lectureId)
    .maybeSingle()
  return data?.channel_id ? String(data.channel_id) : null
}

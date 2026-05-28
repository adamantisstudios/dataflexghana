import type { SupabaseClient } from "@supabase/supabase-js"

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
): Promise<{ ok: true; role: string } | { ok: false; status: number; error: string }> {
  const membership = await getChannelMembership(db, channelId, agentId)
  if (!membership || !ADMIN_ROLES.has(membership.role)) {
    return { ok: false, status: 403, error: "Only channel teachers or admins can manage audio lectures" }
  }
  return { ok: true, role: membership.role }
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

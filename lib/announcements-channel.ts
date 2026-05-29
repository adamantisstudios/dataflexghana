import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupportEmail } from "@/lib/config"
import { ensureChannelMemberActive } from "@/lib/ensure-channel-member-active"

/** Must match scripts/083_announcements_channel.sql */
export const ANNOUNCEMENTS_CHANNEL_ID = "a0000000-0000-4000-8000-000000000001"

export const ANNOUNCEMENTS_CHANNEL_NAMES = ["Announcements", "Official Updates"] as const

export function getAnnouncementsChannelIdFromEnv(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ANNOUNCEMENTS_CHANNEL_ID?.trim()) {
    return process.env.NEXT_PUBLIC_ANNOUNCEMENTS_CHANNEL_ID.trim()
  }
  return ANNOUNCEMENTS_CHANNEL_ID
}

export function isAnnouncementsChannelName(name: string): boolean {
  const n = name.trim().toLowerCase()
  return ANNOUNCEMENTS_CHANNEL_NAMES.some((label) => label.toLowerCase() === n)
}

export async function getAnnouncementsChannel(
  db: SupabaseClient,
): Promise<{ id: string; name: string; is_official?: boolean } | null> {
  const envId = getAnnouncementsChannelIdFromEnv()
  const { data: byId } = await db
    .from("teaching_channels")
    .select("id, name, is_official")
    .eq("id", envId)
    .eq("is_official", true)
    .maybeSingle()
  if (byId) return byId

  const { data: byName } = await db
    .from("teaching_channels")
    .select("id, name, is_official")
    .eq("is_official", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  return byName ?? null
}

export async function addAgentToAnnouncementsChannel(
  db: SupabaseClient,
  agentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const channel = await getAnnouncementsChannel(db)
  if (!channel) {
    return { ok: false, error: "Announcements channel not configured" }
  }
  return ensureChannelMemberActive(db, channel.id, agentId, "member")
}

export async function ensureAnnouncementsChannelExists(
  db: SupabaseClient,
  platformAdminAgentId?: string | null,
): Promise<{ ok: boolean; channelId?: string; error?: string }> {
  const existing = await getAnnouncementsChannel(db)
  if (existing) return { ok: true, channelId: existing.id }

  let createdBy = platformAdminAgentId?.trim() || "platform-admin"
  if (!platformAdminAgentId) {
    const { data: adminAgent } = await db
      .from("agents")
      .select("id")
      .ilike("email", getSupportEmail())
      .maybeSingle()
    if (adminAgent?.id) createdBy = adminAgent.id
  }

  const channelId = getAnnouncementsChannelIdFromEnv()
  const { error } = await db.from("teaching_channels").insert({
    id: channelId,
    name: "Announcements",
    description:
      "Official platform updates from Dataflex Ghana. Read-only for agents. Visit /blogs for articles and tips.",
    category: "Official",
    created_by: createdBy,
    is_active: true,
    is_public: false,
    max_members: 999999,
    is_official: true,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  const { data: agents } = await db
    .from("agents")
    .select("id")
    .eq("isapproved", true)
    .eq("isbanned", false)

  for (const row of agents ?? []) {
    await ensureChannelMemberActive(db, channelId, row.id, "member")
  }

  return { ok: true, channelId }
}

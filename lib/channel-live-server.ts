import { getAdminClient } from "@/lib/supabase-base"
import {
  generateAdminVoiceToken,
  generateToken,
  getLiveKitRoomService,
  getLiveKitWsUrl,
  type VoiceParticipantRole,
} from "@/lib/livekit-server"

export type ChannelLiveType = "audio" | "video"

export type ChannelLiveSession = {
  id: string
  channel_id: string
  room_name: string
  session_type: ChannelLiveType
  host_agent_id: string
  title: string | null
  is_active: boolean
  created_at: string
  ended_at: string | null
}

export function buildChannelLiveRoomName(channelId: string, type: ChannelLiveType): string {
  return `channel_${type}_${channelId}_${Date.now()}`
}

export async function createChannelLiveRoom(
  roomName: string,
  channelId: string,
  type: ChannelLiveType,
): Promise<void> {
  await getLiveKitRoomService().createRoom({
    name: roomName,
    emptyTimeout: 60 * 15,
    maxParticipants: 500,
    metadata: JSON.stringify({ channelId, type, source: "channel_live" }),
  })
}

export async function getActiveChannelLiveSession(
  channelId: string,
): Promise<ChannelLiveSession | null> {
  const db = getAdminClient()
  const { data } = await db
    .from("channel_live_sessions")
    .select("*")
    .eq("channel_id", channelId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as ChannelLiveSession | null) ?? null
}

export async function assertChannelHost(
  channelId: string,
  agentId: string,
): Promise<{ ok: true; role: string } | { ok: false; error: string }> {
  const db = getAdminClient()
  const { data: member } = await db
    .from("channel_members")
    .select("role")
    .eq("channel_id", channelId)
    .eq("agent_id", agentId)
    .eq("status", "active")
    .maybeSingle()

  if (!member) return { ok: false, error: "Not a channel member" }
  if (member.role !== "admin" && member.role !== "teacher") {
    return { ok: false, error: "Only channel admins can start a live session" }
  }
  return { ok: true, role: member.role }
}

export async function assertChannelMember(
  channelId: string,
  agentId: string,
): Promise<{ ok: true; role: string } | { ok: false; error: string }> {
  const db = getAdminClient()
  const { data: member } = await db
    .from("channel_members")
    .select("role")
    .eq("channel_id", channelId)
    .eq("agent_id", agentId)
    .eq("status", "active")
    .maybeSingle()

  if (!member) return { ok: false, error: "Not a channel member" }
  return { ok: true, role: member.role }
}

/** Host token — full publish (video or audio per session type). */
export async function generateChannelHostToken(
  roomName: string,
  agentId: string,
  displayName: string,
  type: ChannelLiveType,
): Promise<string> {
  if (type === "video") {
    return generateAdminVoiceToken(roomName, agentId, displayName)
  }
  return generateToken(agentId, roomName, displayName, true, { role: "admin" }, {
    canPublishAudio: true,
    canPublishVideo: false,
  })
}

/** Member listener token. */
export async function generateChannelListenerToken(
  roomName: string,
  agentId: string,
  displayName: string,
): Promise<string> {
  return generateToken(agentId, roomName, displayName, false, { role: "listener" }, {
    canPublishAudio: false,
    canPublishVideo: false,
  })
}

/** Speaker token after hand raise approved. */
export async function generateChannelSpeakerToken(
  roomName: string,
  agentId: string,
  displayName: string,
  withVideo: boolean,
): Promise<string> {
  return generateToken(agentId, roomName, displayName, true, { role: "speaker" }, {
    canPublishAudio: true,
    canPublishVideo: withVideo,
  })
}

export function channelLiveRoleFromMembership(
  role: string,
  isHost: boolean,
): VoiceParticipantRole {
  if (isHost) return "admin"
  if (role === "teacher") return "moderator"
  return "listener"
}

export function getChannelLiveWsUrl(): string {
  return getLiveKitWsUrl()
}

export async function getChannelLiveSessionById(
  sessionId: string,
): Promise<ChannelLiveSession | null> {
  const db = getAdminClient()
  const { data } = await db
    .from("channel_live_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle()
  return (data as ChannelLiveSession | null) ?? null
}

export async function assertChannelLiveHost(
  session: ChannelLiveSession,
  agentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (session.host_agent_id === agentId) return { ok: true }
  const hostCheck = await assertChannelHost(session.channel_id, agentId)
  if (!hostCheck.ok) return { ok: false, error: hostCheck.error }
  return { ok: true }
}

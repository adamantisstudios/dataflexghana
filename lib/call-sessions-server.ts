import { getAdminClient } from "@/lib/supabase-base"
import {
  generateToken,
  getLiveKitRoomService,
  getLiveKitWsUrl,
} from "@/lib/livekit-server"

export type CallSessionStatus = "ringing" | "active" | "ended" | "declined" | "busy"

export type CallSessionRow = {
  id: string
  caller_id: string
  receiver_id: string
  livekit_room_name: string
  status: CallSessionStatus
  created_at: string
  ended_at: string | null
}

const ACTIVE_STATUSES: CallSessionStatus[] = ["ringing", "active"]

export async function getActiveCallSession(): Promise<CallSessionRow | null> {
  const db = getAdminClient()
  const { data } = await db
    .from("call_sessions")
    .select("*")
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as CallSessionRow | null) ?? null
}

export async function getSupportAdminId(): Promise<string> {
  const configured = process.env.CALL_SUPPORT_ADMIN_ID?.trim()
  if (configured) return configured

  const db = getAdminClient()
  const { data, error } = await db
    .from("admin_users")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error || !data?.id) {
    throw new Error("No support admin configured. Set CALL_SUPPORT_ADMIN_ID.")
  }
  return String(data.id)
}

export function buildCallRoomName(agentId: string): string {
  return `call_agent_${agentId}_${Date.now()}`
}

export async function createCallLiveKitRoom(roomName: string): Promise<void> {
  await getLiveKitRoomService().createRoom({
    name: roomName,
    emptyTimeout: 60 * 5,
    maxParticipants: 2,
    metadata: JSON.stringify({ type: "agent_admin_call" }),
  })
}

/** Audio-only token for agent/admin support calls. */
export async function generateCallAudioToken(
  identity: string,
  roomName: string,
  displayName: string,
  role: "agent" | "admin",
): Promise<string> {
  return generateToken(identity, roomName, displayName, false, { role, callType: "audio" }, {
    canPublishAudio: true,
    canPublishVideo: false,
  })
}

export async function deleteCallLiveKitRoom(roomName: string): Promise<void> {
  try {
    await getLiveKitRoomService().deleteRoom(roomName)
  } catch {
    /* room may already be gone */
  }
}

export function getCallServerUrl(): string {
  return getLiveKitWsUrl()
}

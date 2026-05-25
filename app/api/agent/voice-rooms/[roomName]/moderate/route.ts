import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import {
  getLiveKitRoomService,
  muteParticipantAudio,
  updateParticipantRole,
} from "@/lib/livekit-server"
import { voiceRegionsMatch } from "@/lib/voice-room-regions"

export const dynamic = "force-dynamic"

function decodeRoomName(raw: string): string {
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw.trim()
  }
}

async function assertCoHost(agentId: string, roomName: string) {
  const db = getAdminClient()
  const { data: agent } = await db.from("agents").select("region").eq("id", agentId).maybeSingle()
  if (!agent) throw new Error("Agent not found")

  const { data: room } = await db
    .from("voice_rooms")
    .select("region, is_active")
    .eq("room_name", roomName)
    .maybeSingle()
  if (!room?.is_active) throw new Error("Room not active")
  if (!voiceRegionsMatch(room.region, agent.region)) throw new Error("Not allowed in this room")

  const participant = await getLiveKitRoomService().getParticipant(roomName, agentId)
  let role = "listener"
  try {
    const meta = participant.metadata ? JSON.parse(participant.metadata) : {}
    role = meta.role || participant.attributes?.role || "listener"
  } catch {
    role = participant.attributes?.role || "listener"
  }
  if (role !== "co-host" && role !== "moderator") {
    throw new Error("Co-host privileges required")
  }
  return room
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomName: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")

  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { roomName: raw } = await params
    const roomName = decodeRoomName(raw)
    await assertCoHost(agentId, roomName)

    const body = await request.json()
    const action = String(body.action ?? "").trim()
    const identity = String(body.identity ?? "").trim()
    if (!identity) {
      return NextResponse.json({ error: "identity is required" }, { status: 400 })
    }

    if (action === "mute") {
      await muteParticipantAudio(roomName, identity, true)
      return NextResponse.json({ success: true })
    }
    if (action === "unmute" || action === "invite") {
      await updateParticipantRole(roomName, identity, "speaker")
      await muteParticipantAudio(roomName, identity, false)
      return NextResponse.json({ success: true })
    }
    if (action === "kick") {
      await getLiveKitRoomService().removeParticipant(roomName, identity)
      return NextResponse.json({ success: true })
    }
    if (action === "demote") {
      await updateParticipantRole(roomName, identity, "listener")
      await muteParticipantAudio(roomName, identity, true)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (e) {
    console.error("[agent/voice-rooms/moderate]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Moderation failed" },
      { status: 403 },
    )
  }
}

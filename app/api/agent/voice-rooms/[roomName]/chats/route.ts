import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { voiceRegionsMatch } from "@/lib/voice-room-regions"
import { insertVoiceRoomChat, listVoiceRoomChats } from "@/lib/voice-room-chat"

export const dynamic = "force-dynamic"

function decodeRoomName(raw: string): string {
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw.trim()
  }
}

async function assertAgentCanAccessRoom(agentId: string, roomName: string) {
  const db = getAdminClient()
  const { data: agent, error: agentErr } = await db
    .from("agents")
    .select("id, region")
    .eq("id", agentId)
    .maybeSingle()

  if (agentErr || !agent) throw new Error("Agent not found")

  const { data: room, error: roomErr } = await db
    .from("voice_rooms")
    .select("region, is_active")
    .eq("room_name", roomName)
    .maybeSingle()

  if (roomErr || !room) throw new Error("Voice room not found")
  if (!room.is_active) throw new Error("This voice conference has ended")
  if (!voiceRegionsMatch(room.region, agent.region)) {
    throw new Error("This room is only for agents in your region")
  }

  return { agent }
}

export async function GET(
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
    await assertAgentCanAccessRoom(agentId, roomName)
    const chats = await listVoiceRoomChats(roomName)
    return NextResponse.json({ success: true, chats })
  } catch (e) {
    console.error("[agent/voice-rooms/chats GET]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load chat" },
      { status: 403 },
    )
  }
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
    await assertAgentCanAccessRoom(agentId, roomName)

    const body = await request.json()
    const message = String(body.message ?? "")

    const db = getAdminClient()
    const { data: profile } = await db
      .from("agents")
      .select("full_name, agent_name")
      .eq("id", agentId)
      .maybeSingle()

    const senderName = String(
      body.senderName || profile?.full_name || profile?.agent_name || "Agent",
    ).trim()

    const chat = await insertVoiceRoomChat({
      roomName,
      senderAgentId: agentId,
      senderName,
      message,
    })

    return NextResponse.json({ success: true, chat })
  } catch (e) {
    console.error("[agent/voice-rooms/chats POST]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send message" },
      { status: 400 },
    )
  }
}

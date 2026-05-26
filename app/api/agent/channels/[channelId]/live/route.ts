import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import {
  assertChannelHost,
  assertChannelMember,
  buildChannelLiveRoomName,
  createChannelLiveRoom,
  generateChannelHostToken,
  getActiveChannelLiveSession,
  getChannelLiveWsUrl,
  type ChannelLiveType,
} from "@/lib/channel-live-server"
import { getLiveKitRoomService } from "@/lib/livekit-server"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Unauthorized")

  const agentId = getAuthAgentId(auth)
  const { channelId } = await params
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await assertChannelMember(channelId, agentId)
  if (!member.ok) return NextResponse.json({ error: member.error }, { status: 403 })

  const session = await getActiveChannelLiveSession(channelId)
  return NextResponse.json({ success: true, session, memberRole: member.role })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Unauthorized")

  const agentId = getAuthAgentId(auth)
  const { channelId } = await params
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const hostCheck = await assertChannelHost(channelId, agentId)
  if (!hostCheck.ok) return NextResponse.json({ error: hostCheck.error }, { status: 403 })

  const existing = await getActiveChannelLiveSession(channelId)
  if (existing) {
    return NextResponse.json(
      { error: "A live session is already active on this channel", session: existing },
      { status: 409 },
    )
  }

  try {
    const body = await request.json()
    const sessionType = (body.sessionType === "video" ? "video" : "audio") as ChannelLiveType
    const title = typeof body.title === "string" ? body.title.trim() : ""

    const db = getAdminClient()
    const { data: agent } = await db
      .from("agents")
      .select("full_name, agent_name")
      .eq("id", agentId)
      .maybeSingle()

    const displayName = String(agent?.full_name || agent?.agent_name || "Host")
    const roomName = buildChannelLiveRoomName(channelId, sessionType)
    await createChannelLiveRoom(roomName, channelId, sessionType)

    const { data: session, error } = await db
      .from("channel_live_sessions")
      .insert({
        channel_id: channelId,
        room_name: roomName,
        session_type: sessionType,
        host_agent_id: agentId,
        title: title || null,
        is_active: true,
      })
      .select("*")
      .single()

    if (error || !session) {
      try {
        await getLiveKitRoomService().deleteRoom(roomName)
      } catch {
        /* ignore */
      }
      return NextResponse.json({ error: error?.message || "Failed to save session" }, { status: 500 })
    }

    const token = await generateChannelHostToken(roomName, agentId, displayName, sessionType)

    return NextResponse.json({
      success: true,
      session,
      token,
      serverUrl: getChannelLiveWsUrl(),
      roomName,
    })
  } catch (e) {
    console.error("[channel/live POST]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to start live" },
      { status: 500 },
    )
  }
}

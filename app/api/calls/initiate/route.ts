import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import {
  buildCallRoomName,
  createCallLiveKitRoom,
  generateCallAudioToken,
  getActiveCallSession,
  getCallServerUrl,
  getSupportAdminId,
} from "@/lib/call-sessions-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Agent authentication required")
  }

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const active = await getActiveCallSession()
    if (active) {
      return NextResponse.json(
        {
          success: false,
          busy: true,
          error: "Admin is on another call. Please wait…",
          activeCallId: active.id,
        },
        { status: 409 },
      )
    }

    const db = getAdminClient()
    const { data: agent, error: agentErr } = await db
      .from("agents")
      .select("id, full_name, agent_name")
      .eq("id", agentId)
      .maybeSingle()

    if (agentErr || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const receiverId = await getSupportAdminId()
    const roomName = buildCallRoomName(agentId)
    await createCallLiveKitRoom(roomName)

    const displayName = String(agent.full_name || agent.agent_name || "Agent")
    const agentToken = await generateCallAudioToken(agentId, roomName, displayName, "agent")

    const { data: session, error: insertErr } = await db
      .from("call_sessions")
      .insert({
        caller_id: agentId,
        receiver_id: receiverId,
        livekit_room_name: roomName,
        status: "ringing",
      })
      .select("*")
      .single()

    if (insertErr || !session) {
      return NextResponse.json(
        { error: insertErr?.message || "Failed to create call session" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      roomName,
      token: agentToken,
      serverUrl: getCallServerUrl(),
      status: "ringing",
    })
  } catch (e) {
    console.error("[calls/initiate]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to initiate call" },
      { status: 500 },
    )
  }
}

/** Agent polls call status while ringing. */
export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Agent authentication required")
  }

  const agentId = getAuthAgentId(auth)
  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim()
  if (!agentId || !sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  const db = getAdminClient()
  const { data: session } = await db
    .from("call_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("caller_id", agentId)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 })
  }

  const busy = await getActiveCallSession()
  return NextResponse.json({
    success: true,
    session,
    adminBusy: Boolean(busy && busy.id !== sessionId && ["ringing", "active"].includes(busy.status)),
  })
}

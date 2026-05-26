import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { generateAgentToken, getLiveKitWsUrl } from "@/lib/livekit-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Agent authentication required")
  }

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const roomName = request.nextUrl.searchParams.get("roomName")?.trim()
    if (!roomName) {
      return NextResponse.json({ error: "roomName is required" }, { status: 400 })
    }

    const speak = request.nextUrl.searchParams.get("speak") === "1"
    const video = request.nextUrl.searchParams.get("video") === "1"

    const db = getAdminClient()
    const { data: agent, error: agentErr } = await db
      .from("agents")
      .select("id, region, full_name, agent_name")
      .eq("id", agentId)
      .maybeSingle()

    if (agentErr || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const displayName = String(agent.full_name || agent.agent_name || "Agent")
    const token = await generateAgentToken(roomName, agentId, displayName, agent.region, {
      canPublish: speak,
      canPublishVideo: video && speak,
      role: speak ? "speaker" : "listener",
    })

    return NextResponse.json({
      success: true,
      token,
      serverUrl: getLiveKitWsUrl(),
      roomName,
      canPublish: speak,
      canPublishAudio: speak,
      canPublishVideo: video && speak,
    })
  } catch (e) {
    console.error("[agent/voice-rooms/token]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to join room" },
      { status: 403 },
    )
  }
}

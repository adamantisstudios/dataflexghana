import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { voiceRegionsMatch } from "@/lib/voice-room-regions"
import { getLiveKitParticipantCount } from "@/lib/livekit-server"

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
    const db = getAdminClient()
    const { data: agent, error: agentErr } = await db
      .from("agents")
      .select("id, region, full_name")
      .eq("id", agentId)
      .maybeSingle()

    if (agentErr || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const { data: rooms, error } = await db
      .from("voice_rooms")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const matched = (rooms || []).filter((r) => voiceRegionsMatch(r.region, agent.region))

    const enriched = await Promise.all(
      matched.map(async (room) => ({
        ...room,
        participant_count: await getLiveKitParticipantCount(room.room_name),
      })),
    )

    return NextResponse.json({
      success: true,
      agentRegion: agent.region,
      rooms: enriched,
      hasActiveRoom: enriched.length > 0,
    })
  } catch (e) {
    console.error("[agent/voice-rooms GET]", e)
    return NextResponse.json({ error: "Failed to load voice rooms" }, { status: 500 })
  }
}

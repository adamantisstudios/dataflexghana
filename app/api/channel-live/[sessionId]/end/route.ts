import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import {
  assertChannelLiveHost,
  getChannelLiveSessionById,
} from "@/lib/channel-live-server"
import { getLiveKitRoomService } from "@/lib/livekit-server"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Unauthorized")

  const agentId = getAuthAgentId(auth)
  const { sessionId } = await params
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const session = await getChannelLiveSessionById(sessionId)
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

  const host = await assertChannelLiveHost(session, agentId)
  if (!host.ok) return NextResponse.json({ error: host.error }, { status: 403 })

  const db = getAdminClient()
  await db
    .from("channel_live_sessions")
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq("id", sessionId)

  try {
    await getLiveKitRoomService().deleteRoom(session.room_name)
  } catch {
    /* ignore */
  }

  return NextResponse.json({ success: true })
}

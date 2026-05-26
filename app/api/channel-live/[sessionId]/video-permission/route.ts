import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import {
  assertChannelLiveHost,
  getChannelLiveSessionById,
} from "@/lib/channel-live-server"
import {
  muteParticipantVideo,
  sendVideoPermissionCommand,
  updateParticipantVideoPermission,
} from "@/lib/livekit-server"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Unauthorized")

  const agentId = getAuthAgentId(auth)
  const { sessionId } = await params
  const body = await request.json()
  const identity = String(body.identity ?? "").trim()
  const allowed = body.allowed === true
  if (!agentId || !identity) {
    return NextResponse.json({ error: "identity required" }, { status: 400 })
  }

  const session = await getChannelLiveSessionById(sessionId)
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

  const host = await assertChannelLiveHost(session, agentId)
  if (!host.ok) return NextResponse.json({ error: host.error }, { status: 403 })

  await updateParticipantVideoPermission(session.room_name, identity, allowed)
  await sendVideoPermissionCommand(session.room_name, identity, allowed)
  try {
    await muteParticipantVideo(session.room_name, identity, !allowed)
  } catch {
    /* no camera track */
  }

  return NextResponse.json({ success: true, allowed })
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import {
  assertChannelMember,
  generateChannelHostToken,
  generateChannelListenerToken,
  generateChannelSpeakerToken,
  getActiveChannelLiveSession,
  getChannelLiveWsUrl,
} from "@/lib/channel-live-server"

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
  if (!session) {
    return NextResponse.json({ error: "No live session on this channel" }, { status: 404 })
  }

  const speak = request.nextUrl.searchParams.get("speak") === "1"
  const video = request.nextUrl.searchParams.get("video") === "1"

  const db = getAdminClient()
  const { data: agent } = await db
    .from("agents")
    .select("full_name, agent_name, region")
    .eq("id", agentId)
    .maybeSingle()

  const displayName = String(agent?.full_name || agent?.agent_name || "Member")
  const isHost = session.host_agent_id === agentId

  let token: string
  if (isHost) {
    token = await generateChannelHostToken(
      session.room_name,
      agentId,
      displayName,
      session.session_type,
    )
  } else if (speak) {
    token = await generateChannelSpeakerToken(
      session.room_name,
      agentId,
      displayName,
      video && session.session_type === "video",
    )
  } else {
    token = await generateChannelListenerToken(session.room_name, agentId, displayName)
  }

  return NextResponse.json({
    success: true,
    token,
    serverUrl: getChannelLiveWsUrl(),
    session,
    roomName: session.room_name,
    isHost,
    canPublish: speak || isHost,
    canPublishVideo: (video && speak && session.session_type === "video") || (isHost && session.session_type === "video"),
  })
}

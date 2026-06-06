import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { addAgentToAnnouncementsChannel, getAnnouncementsChannel } from "@/lib/announcements-channel"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = getAdminClient()
  const channel = await getAnnouncementsChannel(db)
  if (!channel) {
    return NextResponse.json({ error: "Announcements channel is not configured" }, { status: 404 })
  }

  const result = await addAgentToAnnouncementsChannel(db, agentId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Could not join announcements" }, { status: 500 })
  }

  return NextResponse.json({ success: true, channelId: channel.id })
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { getAdminClient } from "@/lib/supabase-base"
import { isPlatformAdminAgent } from "@/lib/platform-admin"

export const dynamic = "force-dynamic"

/** Platform admin agent posts to official channel — audit + notification bell. */
export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Authentication required")
  }

  const agent = auth.agent as { id?: string; email?: string | null }
  if (!isPlatformAdminAgent(agent)) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const channelId = String(body.channel_id ?? "").trim()
    const postId = String(body.post_id ?? "").trim()
    const title = String(body.title ?? "").trim()

    if (!channelId || !postId) {
      return NextResponse.json({ error: "channel_id and post_id are required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: channel } = await db
      .from("teaching_channels")
      .select("id, name, is_official")
      .eq("id", channelId)
      .maybeSingle()

    if (!channel?.is_official) {
      return NextResponse.json({ error: "Not an official channel" }, { status: 400 })
    }

    await logAuditFromRequest(request, {
      actorId: getAuthAgentId(auth) ?? agent.id ?? null,
      actorType: "admin",
      action: "official_announcement",
      severity: "info",
      targetTable: "channel_posts",
      targetId: postId,
      newData: {
        channel_id: channelId,
        channel_name: channel.name,
        title,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[log-official-announcement]", e)
    return NextResponse.json({ error: "Failed to log announcement" }, { status: 500 })
  }
}

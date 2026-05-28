import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { requireAdminSession, authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, channelId } = body

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 })
    }

    const db = getAdminClient()

    const adminSession = await requireAdminSession(request)
    if (!adminSession.ok) {
      const auth = await authenticateAgent(request)
      if (!auth.success) return createAuthErrorResponse(auth.error!)

      const agentId = getAuthAgentId(auth)
      if (!agentId || !channelId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { data: membership } = await db
        .from("channel_members")
        .select("role")
        .eq("channel_id", channelId)
        .eq("agent_id", agentId)
        .eq("status", "active")
        .maybeSingle()

      if (!membership || (membership.role !== "admin" && membership.role !== "teacher")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { error } = await db
      .from("channel_join_requests")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("id", requestId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Join request rejected" })
  } catch (error) {
    console.error("[channel-join-requests reject]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

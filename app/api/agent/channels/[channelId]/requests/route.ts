import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

/** List join requests for a channel (channel admin / teacher). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { channelId } = await params
    const status = request.nextUrl.searchParams.get("status") || "pending"
    const db = getAdminClient()

    const { data: membership } = await db
      .from("channel_members")
      .select("role")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .eq("status", "active")
      .maybeSingle()

    if (!membership || (membership.role !== "admin" && membership.role !== "teacher")) {
      return NextResponse.json({ error: "Only channel admins can view join requests" }, { status: 403 })
    }

    let query = db
      .from("channel_join_requests_with_agents")
      .select(
        "id, channel_id, agent_id, request_message, status, requested_at, full_name, phone_number",
      )
      .eq("channel_id", channelId)
      .order("requested_at", { ascending: false })

    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, requests: data || [] })
  } catch (error) {
    console.error("[channel requests GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

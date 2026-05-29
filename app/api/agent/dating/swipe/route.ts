import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getClientIp, getClientUserAgent } from "@/lib/audit-logger"
import { recordSwipe } from "@/lib/dating/dating-server"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const targetAgentId = String(body.target_agent_id ?? "").trim()
    const direction = body.direction === "pass" ? "pass" : "like"
    const isTopPick = Boolean(body.is_top_pick)

    if (!targetAgentId) {
      return NextResponse.json({ error: "target_agent_id is required" }, { status: 400 })
    }

    if (isTopPick) {
      const { data: sub } = await getAdminClient()
        .from("dating_subscriptions")
        .select("plan")
        .eq("agent_id", agentId)
        .maybeSingle()
      if (!sub || sub.plan === "free") {
        return NextResponse.json(
          { error: "Upgrade to Silver or Gold to swipe on Top Picks" },
          { status: 403 },
        )
      }
    }

    const result = await recordSwipe(agentId, targetAgentId, direction, {
      ip: getClientIp(request),
      userAgent: getClientUserAgent(request),
    })

    return NextResponse.json({ success: true, ...result })
  } catch (e) {
    console.error("[dating/swipe]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Swipe failed" },
      { status: 400 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { blockAgent, reportAgent } from "@/lib/dating/dating-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const reportedId = String(body.reported_agent_id ?? "").trim()
    const reason = String(body.reason ?? "").trim()
    const details = body.details ? String(body.details).trim() : undefined

    if (!reportedId || !reason) {
      return NextResponse.json({ error: "reported_agent_id and reason are required" }, { status: 400 })
    }

    await reportAgent(agentId, reportedId, reason, details)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[dating/report]", e)
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 })
  }
}

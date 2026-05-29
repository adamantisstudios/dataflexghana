import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { blockAgent } from "@/lib/dating/dating-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const blockedId = String(body.blocked_agent_id ?? "").trim()
    if (!blockedId) {
      return NextResponse.json({ error: "blocked_agent_id is required" }, { status: 400 })
    }

    await blockAgent(agentId, blockedId)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[dating/block]", e)
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getMatches } from "@/lib/dating/dating-server"
import { ICEBREAKER_PROMPTS } from "@/lib/dating/constants"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const matches = await getMatches(agentId)
  return NextResponse.json({ success: true, matches, icebreakers: ICEBREAKER_PROMPTS })
}

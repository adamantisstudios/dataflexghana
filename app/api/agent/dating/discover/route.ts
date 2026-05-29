import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { discoverProfiles, formatCountdown, msUntilReset } from "@/lib/dating/dating-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await discoverProfiles(agentId)
  const sub = result.subscription

  return NextResponse.json({
    success: true,
    profiles: result.profiles,
    top_pick: result.topPick,
    error: result.error,
    limits: sub
      ? {
          plan: sub.plan,
          swipes_remaining: sub.swipes_remaining,
          matches_remaining: sub.matches_remaining,
          streak_count: sub.streak_count,
          resets_in: formatCountdown(msUntilReset(sub.swipes_reset_at)),
          resets_at: sub.swipes_reset_at,
        }
      : null,
  })
}

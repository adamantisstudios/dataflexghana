import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAgentDisplayBalances } from "@/lib/agent-display-balances"

export const dynamic = "force-dynamic"

/** Same wallet + commission figures as admin Agents tab and /agent/wallet. */
export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const balances = await getAgentDisplayBalances(agent.id)

  return NextResponse.json({ success: true, ...balances })
}

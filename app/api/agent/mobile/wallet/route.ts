import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAgentWalletSnapshot } from "@/lib/agent-mobile"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  try {
    const snapshot = await getAgentWalletSnapshot(agent.id)
    return NextResponse.json({ success: true, ...snapshot })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load wallet"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { AGENT_MOMO, listActiveDataBundles } from "@/lib/agent-mobile"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  try {
    const { bundles, byProvider } = await listActiveDataBundles()
    return NextResponse.json({
      success: true,
      bundles,
      by_provider: byProvider,
      providers: ["MTN", "AirtelTigo", "Telecel"],
      momo: AGENT_MOMO,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load bundles"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

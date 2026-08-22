import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { AGENT_MOMO, listActiveDataBundles } from "@/lib/agent-mobile"
import { calculateWalletBalance } from "@/lib/earnings-calculator"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }

  try {
    const [{ bundles, byProvider }, wallet_balance] = await Promise.all([
      listActiveDataBundles(),
      calculateWalletBalance(agent.id).catch(() => 0),
    ])

    return NextResponse.json({
      success: true,
      bundles,
      by_provider: byProvider,
      providers: ["MTN", "AirtelTigo", "Telecel"],
      counts: {
        MTN: byProvider.MTN?.length || 0,
        AirtelTigo: byProvider.AirtelTigo?.length || 0,
        Telecel: byProvider.Telecel?.length || 0,
        total: bundles.length,
      },
      wallet_balance,
      momo: AGENT_MOMO,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load bundles"
    console.error("[mobile/data-bundles]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

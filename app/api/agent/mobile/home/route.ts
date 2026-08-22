import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { AGENT_MOMO, sanitizeAgentForMobile } from "@/lib/agent-mobile"
import { getAgentDisplayBalances } from "@/lib/agent-display-balances"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as Record<string, unknown> & { id: string }
  const db = getAdminClient()
  const [{ data: fresh }, balances] = await Promise.all([
    db
      .from("agents")
      .select(
        "id, full_name, phone_number, email, profile_image_url, profile_verified, region, isapproved",
      )
      .eq("id", agent.id)
      .maybeSingle(),
    getAgentDisplayBalances(agent.id),
  ])

  const profile = sanitizeAgentForMobile({ ...agent, ...(fresh || {}) })

  return NextResponse.json({
    success: true,
    agent: {
      ...profile,
      wallet_balance: balances.wallet_balance,
      commission_balance: balances.commission_balance,
      available_balance: balances.available_balance,
      total_commission_earned: balances.total_commission_earned,
      total_paid_out: balances.total_paid_out,
      pending_payout: balances.pending_payout,
    },
    balances,
    momo: AGENT_MOMO,
    asset_base_url: "https://www.dataflexghana.com",
  })
}

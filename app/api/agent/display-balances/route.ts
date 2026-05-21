import { type NextRequest, NextResponse } from "next/server"
import { jsonWithReadOnlyGetCache } from "@/lib/api-cache-headers"
import { getAdminClient } from "@/lib/supabase-base"
import { calculateWalletBalance } from "@/lib/earnings-calculator"
import { computeAgentCommissionSummary } from "@/lib/commission-summary-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const agentId = new URL(request.url).searchParams.get("agentId")
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const [wallet_balance, summary] = await Promise.all([
      calculateWalletBalance(agentId),
      computeAgentCommissionSummary(getAdminClient(), agentId),
    ])

    const commission_balance = summary.availableForWithdrawal

    return jsonWithReadOnlyGetCache({
      wallet_balance,
      commission_balance,
      available_balance: commission_balance,
      total_commission_earned: summary.totalEarned,
      total_paid_out: summary.totalWithdrawn,
      pending_payout: summary.pendingWithdrawal,
    })
  } catch (error) {
    console.error("Error in display-balances API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

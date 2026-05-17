import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export async function GET() {
  try {
    const supabase = getAdminClient()

    const { count: totalAgents, error: countError } = await supabase
      .from("agents")
      .select("*", { count: "exact", head: true })

    if (countError) throw countError

    const { data: balanceRows, error: balanceError } = await supabase
      .from("agents")
      .select("wallet_balance, commission")

    if (balanceError) throw balanceError

    let totalBalance = 0
    let totalCommissionBalance = 0
    let agentsWithBalance = 0
    let agentsWithCommission = 0
    let highestBalance = 0
    let lowestBalance = Number.POSITIVE_INFINITY
    let highestCommission = 0

    for (const row of balanceRows || []) {
      const wb = Number(row.wallet_balance ?? 0)
      const cb = Number(row.commission ?? 0)
      totalBalance += wb
      totalCommissionBalance += cb
      if (wb > 0) agentsWithBalance++
      if (cb > 0) agentsWithCommission++
      highestBalance = Math.max(highestBalance, wb)
      if (wb > 0) lowestBalance = Math.min(lowestBalance, wb)
      highestCommission = Math.max(highestCommission, cb)
    }

    const agentCount = totalAgents ?? balanceRows?.length ?? 0
    if (lowestBalance === Number.POSITIVE_INFINITY) lowestBalance = 0

    return NextResponse.json({
      success: true,
      stats: {
        totalBalance,
        totalCommissionBalance,
        totalAgents: agentCount,
        agentsWithBalance,
        agentsWithCommission,
        averageBalance: agentCount > 0 ? totalBalance / agentCount : 0,
        averageCommission: agentCount > 0 ? totalCommissionBalance / agentCount : 0,
        highestBalance,
        lowestBalance,
        highestCommission,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[wallet-overview]", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load wallet overview",
      },
      { status: 500 },
    )
  }
}

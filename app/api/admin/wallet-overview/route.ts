import { type NextRequest, NextResponse } from "next/server"
import { jsonWithReadOnlyGetCache } from "@/lib/api-cache-headers"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"
import { isWalletCreditType, isWalletDebitType } from "@/lib/wallet-transaction-types"
import { meetsConstraints } from "@/lib/commission-calculation"

const PAGE_SIZE = 1000

type WalletTxRow = {
  agent_id: string
  transaction_type: string
  amount: number
}

type CommissionRow = {
  agent_id: string
  amount: number
  status: string
}

async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = []
  let offset = 0

  while (true) {
    const { data, error } = await fetchPage(offset, offset + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return rows
}

/** Spendable wallet per agent — same rules as calculateWalletBalance (excludes commission_deposit). */
function buildSpendableWalletBalances(transactions: WalletTxRow[]): Map<string, number> {
  const balances = new Map<string, number>()

  for (const tx of transactions) {
    const type = tx.transaction_type
    if (type === "commission_deposit") continue

    const amount = Number(tx.amount) || 0
    const current = balances.get(tx.agent_id) ?? 0

    if (isWalletCreditType(type)) {
      balances.set(tx.agent_id, current + amount)
    } else if (isWalletDebitType(type)) {
      balances.set(tx.agent_id, current - amount)
    }
  }

  for (const [agentId, balance] of balances) {
    balances.set(agentId, Math.max(Math.round(balance * 100) / 100, 0))
  }

  return balances
}

/** Available commission per agent — same rules as computeAgentCommissionSummary / Agents tab. */
function buildCommissionBalances(commissions: CommissionRow[]): Map<string, number> {
  const earned = new Map<string, number>()
  const pending = new Map<string, number>()

  for (const row of commissions) {
    let amount = Number(row.amount) || 0
    const validation = meetsConstraints(amount)
    if (!validation.valid) {
      amount = Math.max(0.01, Math.min(0.4, amount))
    }

    earned.set(row.agent_id, (earned.get(row.agent_id) ?? 0) + amount)

    if (row.status === "pending_withdrawal") {
      pending.set(row.agent_id, (pending.get(row.agent_id) ?? 0) + amount)
    }
  }

  const balances = new Map<string, number>()
  const agentIds = new Set([...earned.keys(), ...pending.keys()])

  for (const agentId of agentIds) {
    const totalEarned = earned.get(agentId) ?? 0
    const pendingWithdrawal = pending.get(agentId) ?? 0
    balances.set(agentId, Math.max(0, Math.round((totalEarned - pendingWithdrawal) * 100) / 100))
  }

  return balances
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const supabase = getAdminClient()

    const agentRows = await fetchAllPages<{ id: string }>((from, to) =>
      supabase.from("agents").select("id").range(from, to),
    )

    const agentIds = agentRows.map((a) => a.id)
    const totalAgents = agentIds.length

    const [walletTransactions, commissionRows] = await Promise.all([
      fetchAllPages<WalletTxRow>((from, to) =>
        supabase
          .from("wallet_transactions")
          .select("agent_id, transaction_type, amount")
          .eq("status", "approved")
          .range(from, to),
      ),
      fetchAllPages<CommissionRow>((from, to) =>
        supabase
          .from("commissions")
          .select("agent_id, amount, status")
          .neq("status", "withdrawn")
          .range(from, to),
      ),
    ])

    const walletByAgent = buildSpendableWalletBalances(walletTransactions)
    const commissionByAgent = buildCommissionBalances(commissionRows)

    let totalBalance = 0
    let totalCommissionBalance = 0
    let agentsWithBalance = 0
    let agentsWithCommission = 0
    let highestBalance = 0
    let lowestBalance = Number.POSITIVE_INFINITY
    let highestCommission = 0

    for (const agentId of agentIds) {
      const wb = walletByAgent.get(agentId) ?? 0
      const cb = commissionByAgent.get(agentId) ?? 0

      totalBalance += wb
      totalCommissionBalance += cb

      if (wb > 0) agentsWithBalance++
      if (cb > 0) agentsWithCommission++

      highestBalance = Math.max(highestBalance, wb)
      if (wb > 0) lowestBalance = Math.min(lowestBalance, wb)
      highestCommission = Math.max(highestCommission, cb)
    }

    if (lowestBalance === Number.POSITIVE_INFINITY) lowestBalance = 0

    totalBalance = Math.round(totalBalance * 100) / 100
    totalCommissionBalance = Math.round(totalCommissionBalance * 100) / 100

    return jsonWithReadOnlyGetCache({
      success: true,
      stats: {
        totalBalance,
        totalCommissionBalance,
        totalAgents,
        agentsWithBalance,
        agentsWithCommission,
        averageBalance: totalAgents > 0 ? totalBalance / totalAgents : 0,
        averageCommission: totalAgents > 0 ? totalCommissionBalance / totalAgents : 0,
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

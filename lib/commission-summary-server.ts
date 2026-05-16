import type { SupabaseClient } from "@supabase/supabase-js"
import { meetsConstraints } from "./commission-calculation"

export interface AgentCommissionSummary {
  availableForWithdrawal: number
  breakdown: string
  totalEarned: number
  totalWithdrawn: number
  pendingWithdrawal: number
  totalCommissions: number
  availableCommissions: number
  totalPaidOut: number
  pendingPayout: number
  referralCommissions: number
  dataOrderCommissions: number
  wholesaleCommissions: number
}

export function emptyAgentCommissionSummary(): AgentCommissionSummary {
  return {
    availableForWithdrawal: 0,
    breakdown: "referral: 0, data_order: 0, wholesale_order: 0",
    totalEarned: 0,
    totalWithdrawn: 0,
    pendingWithdrawal: 0,
    totalCommissions: 0,
    availableCommissions: 0,
    totalPaidOut: 0,
    pendingPayout: 0,
    referralCommissions: 0,
    dataOrderCommissions: 0,
    wholesaleCommissions: 0,
  }
}

/** Same logic as AgentsTab / getAgentCommissionSummary — requires service-role client. */
export async function computeAgentCommissionSummary(
  db: SupabaseClient,
  agentId: string,
): Promise<AgentCommissionSummary> {
  const { data: commissions, error: commissionsError } = await db
    .from("commissions")
    .select("*")
    .eq("agent_id", agentId)
    .neq("status", "withdrawn")

  if (commissionsError) {
    console.error(`Error fetching commissions for agent ${agentId}:`, commissionsError.message)
    return emptyAgentCommissionSummary()
  }

  const breakdown = { referral: 0, data_order: 0, wholesale_order: 0 }
  let totalEarned = 0
  let pendingWithdrawal = 0

  if (commissions && Array.isArray(commissions)) {
    for (const commission of commissions) {
      let amount = Number(commission.amount) || 0
      const validation = meetsConstraints(amount)
      if (!validation.valid) {
        amount = Math.max(0.01, Math.min(0.4, amount))
      }

      totalEarned += amount

      if (commission.status === "pending_withdrawal") {
        pendingWithdrawal += amount
      }

      if (commission.source_type in breakdown) {
        breakdown[commission.source_type as keyof typeof breakdown] += amount
      }
    }
  }

  const { data: withdrawals, error: withdrawalError } = await db
    .from("withdrawals")
    .select("amount")
    .eq("agent_id", agentId)
    .eq("status", "paid")

  let totalWithdrawn = 0
  if (!withdrawalError && withdrawals && Array.isArray(withdrawals)) {
    totalWithdrawn = withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0)
  }

  const availableForWithdrawal = Math.max(0, totalEarned - pendingWithdrawal)
  const breakdownString = `referral: ${breakdown.referral.toFixed(2)}, data_order: ${breakdown.data_order.toFixed(2)}, wholesale_order: ${breakdown.wholesale_order.toFixed(2)}`

  return {
    availableForWithdrawal,
    breakdown: breakdownString,
    totalEarned,
    totalWithdrawn,
    pendingWithdrawal,
    totalCommissions: totalEarned,
    availableCommissions: availableForWithdrawal,
    totalPaidOut: totalWithdrawn,
    pendingPayout: pendingWithdrawal,
    referralCommissions: breakdown.referral,
    dataOrderCommissions: breakdown.data_order,
    wholesaleCommissions: breakdown.wholesale_order,
  }
}

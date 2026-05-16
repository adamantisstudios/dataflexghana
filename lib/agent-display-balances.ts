/**
 * Single source of truth for wallet + commission display — matches admin AgentsTab:
 * - Wallet: calculateWalletBalance (same as AgentsTab.loadEarningsForAgents)
 * - Commission: getAgentCommissionSummary().availableForWithdrawal
 */
import { calculateWalletBalance } from "@/lib/earnings-calculator";
import { getAgentCommissionSummary } from "@/lib/commission-earnings";

export interface AgentDisplayBalances {
  wallet_balance: number;
  commission_balance: number;
  available_balance: number;
  total_commission_earned: number;
  total_paid_out: number;
  pending_payout: number;
}

export async function getAgentDisplayBalances(agentId: string): Promise<AgentDisplayBalances> {
  const [wallet_balance, summary] = await Promise.all([
    calculateWalletBalance(agentId),
    getAgentCommissionSummary(agentId),
  ]);

  const commission_balance = summary.availableForWithdrawal ?? 0;

  return {
    wallet_balance,
    commission_balance,
    available_balance: commission_balance,
    total_commission_earned: summary.totalEarned ?? 0,
    total_paid_out: summary.totalWithdrawn ?? 0,
    pending_payout: summary.pendingWithdrawal ?? 0,
  };
}

/** Apply display balances to many agents (same logic as AgentsTab, parallel). */
export async function applyDisplayBalancesToAgents<T extends { id: string }>(
  agents: T[]
): Promise<(T & AgentDisplayBalances)[]> {
  return Promise.all(
    agents.map(async (agent) => ({
      ...agent,
      ...(await getAgentDisplayBalances(agent.id)),
    }))
  );
}

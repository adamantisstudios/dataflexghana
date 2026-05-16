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
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(
        `/api/agent/display-balances?agentId=${encodeURIComponent(agentId)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          return {
            wallet_balance: Number(data.wallet_balance ?? 0),
            commission_balance: Number(data.commission_balance ?? 0),
            available_balance: Number(data.available_balance ?? data.commission_balance ?? 0),
            total_commission_earned: Number(data.total_commission_earned ?? 0),
            total_paid_out: Number(data.total_paid_out ?? 0),
            pending_payout: Number(data.pending_payout ?? 0),
          };
        }
      }
    } catch {
      // fall through to server-side helpers
    }
  }

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

/** Order quotas aligned with admin activity / automation risk checks */
export const MIN_DATA_ORDERS_7D = 5
export const MIN_DATA_ORDERS_30D = 20

export type AgentOrderStats = {
  data_orders_count_7d?: number | null
  data_orders_count_30d?: number | null
}

export function isBelowOrderQuota(agent: AgentOrderStats): boolean {
  const orders7d = agent.data_orders_count_7d ?? 0
  const orders30d = agent.data_orders_count_30d ?? 0
  return orders7d < MIN_DATA_ORDERS_7D && orders30d < MIN_DATA_ORDERS_30D
}

export function hasNoOrdersInPast7Days(agent: AgentOrderStats): boolean {
  return (agent.data_orders_count_7d ?? 0) === 0
}

export function ordersNeededForQuota(agent: AgentOrderStats): number {
  const current = agent.data_orders_count_7d ?? 0
  return Math.max(0, MIN_DATA_ORDERS_7D - current)
}

export function buildSevenDayWarningMessage(ordersNeeded: number): { title: string; message: string } {
  const x = ordersNeeded > 0 ? ordersNeeded : MIN_DATA_ORDERS_7D
  return {
    title: "Account deactivation in 7 days",
    message: `Your account will be deactivated in 7 days if you don't place at least ${x} data orders. Place orders now to keep your dashboard access. Your storefront will remain open.`,
  }
}

export function buildThreeDayWarningMessage(ordersNeeded: number): { title: string; message: string } {
  const x = ordersNeeded > 0 ? ordersNeeded : MIN_DATA_ORDERS_7D
  return {
    title: "Urgent: 3 days until deactivation",
    message: `Only 3 days left! Your account will be deactivated if you don't place ${x} more orders. Act now to avoid losing dashboard access.`,
  }
}

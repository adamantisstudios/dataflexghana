import { getAdminClient } from "@/lib/supabase-base"

export const STOREFRONT_PAYOUT_NOTE = "source:storefront"

export function isStorefrontWithdrawal(withdrawal: {
  source?: string | null
  admin_notes?: string | null
}): boolean {
  if (withdrawal.source === "storefront") return true
  const notes = withdrawal.admin_notes || ""
  return notes.includes(STOREFRONT_PAYOUT_NOTE)
}

/** Reads sandboxed storefront commission only (not agents.commission / wallet). */
export async function fetchStorefrontCommissionBalance(agentId: string): Promise<number> {
  const { data, error } = await getAdminClient()
    .from("agent_store_profiles")
    .select("storefront_commission_balance")
    .eq("agent_id", agentId)
    .maybeSingle()

  if (error) throw error
  return Number(data?.storefront_commission_balance ?? 0)
}

export async function restoreStorefrontCommissionBalance(
  agentId: string,
  amount: number,
): Promise<void> {
  const db = getAdminClient()
  const current = await fetchStorefrontCommissionBalance(agentId)
  const update: Record<string, unknown> = {
    storefront_commission_balance: current + amount,
  }
  update.updated_at = new Date().toISOString()

  const { error } = await db.from("agent_store_profiles").update(update).eq("agent_id", agentId)
  if (error) throw error
}

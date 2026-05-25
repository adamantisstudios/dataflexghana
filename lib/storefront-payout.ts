import { getAdminClient } from "@/lib/supabase-base"
import { upsertStoreProfile } from "@/lib/storefront-server"

export const STOREFRONT_PAYOUT_NOTE = "source:storefront"
export const STOREFRONT_MIN_PAYOUT_GHS = 50

export function storefrontPayoutMinimumMessage(balance: number): string {
  return `You can request a payout when your balance reaches GH₵ 50 or more. Current balance: GH₵ ${balance.toFixed(2)}.`
}

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

async function updateStorefrontBalance(
  agentId: string,
  balance: number,
): Promise<{ error: { message: string } | null }> {
  const db = getAdminClient()
  const payload: Record<string, unknown> = {
    storefront_commission_balance: balance,
    updated_at: new Date().toISOString(),
  }

  let result = await db.from("agent_store_profiles").update(payload).eq("agent_id", agentId)

  if (result.error?.message?.includes("updated_at")) {
    result = await db
      .from("agent_store_profiles")
      .update({ storefront_commission_balance: balance })
      .eq("agent_id", agentId)
  }

  return { error: result.error }
}

/** Ensures a store profile row exists before balance mutations. */
export async function ensureAgentStoreProfile(agentId: string): Promise<void> {
  const db = getAdminClient()
  const { data } = await db
    .from("agent_store_profiles")
    .select("agent_id")
    .eq("agent_id", agentId)
    .maybeSingle()

  if (!data) {
    await upsertStoreProfile(agentId, { storefront_commission_balance: 0 })
  }
}

export async function deductStorefrontCommissionBalance(
  agentId: string,
  amount: number,
): Promise<{ newBalance: number; error: string | null }> {
  await ensureAgentStoreProfile(agentId)
  const current = await fetchStorefrontCommissionBalance(agentId)
  const newBalance = Math.max(0, current - amount)
  const { error } = await updateStorefrontBalance(agentId, newBalance)
  if (error) {
    return { newBalance: current, error: error.message }
  }
  return { newBalance, error: null }
}

export async function restoreStorefrontCommissionBalance(
  agentId: string,
  amount: number,
): Promise<void> {
  await ensureAgentStoreProfile(agentId)
  const current = await fetchStorefrontCommissionBalance(agentId)
  const { error } = await updateStorefrontBalance(agentId, current + amount)
  if (error) throw new Error(error.message)
}

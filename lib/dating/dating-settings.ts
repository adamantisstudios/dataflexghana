import { getAdminClient } from "@/lib/supabase-base"

export type DatingSettings = {
  id: string
  silver_price: number
  gold_price: number
  coin_pack_price: number
  counselling_session_price: number
  updated_at: string
}

export const DEFAULT_DATING_SETTINGS: Omit<DatingSettings, "id" | "updated_at"> = {
  silver_price: 15,
  gold_price: 30,
  coin_pack_price: 5,
  counselling_session_price: 20,
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export function normalizeDatingSettings(row: Record<string, unknown> | null): DatingSettings {
  const defaults = DEFAULT_DATING_SETTINGS
  if (!row) {
    return {
      id: "default",
      ...defaults,
      updated_at: new Date().toISOString(),
    }
  }
  return {
    id: String(row.id ?? "default"),
    silver_price: toNumber(row.silver_price, defaults.silver_price),
    gold_price: toNumber(row.gold_price, defaults.gold_price),
    coin_pack_price: toNumber(row.coin_pack_price, defaults.coin_pack_price),
    counselling_session_price: toNumber(
      row.counselling_session_price,
      defaults.counselling_session_price,
    ),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  }
}

export async function getDatingSettings(): Promise<DatingSettings> {
  try {
    const { data, error } = await getAdminClient()
      .from("dating_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[dating-settings] read error:", error.message)
      return normalizeDatingSettings(null)
    }

    return normalizeDatingSettings(data as Record<string, unknown> | null)
  } catch (e) {
    console.error("[dating-settings] unexpected error:", e)
    return normalizeDatingSettings(null)
  }
}

export async function updateDatingSettings(updates: {
  silver_price?: number
  gold_price?: number
  coin_pack_price?: number
  counselling_session_price?: number
}): Promise<DatingSettings> {
  const current = await getDatingSettings()
  const payload = {
    silver_price: updates.silver_price ?? current.silver_price,
    gold_price: updates.gold_price ?? current.gold_price,
    coin_pack_price: updates.coin_pack_price ?? current.coin_pack_price,
    counselling_session_price:
      updates.counselling_session_price ?? current.counselling_session_price,
    updated_at: new Date().toISOString(),
  }

  const db = getAdminClient()

  if (current.id && current.id !== "default") {
    const { data, error } = await db
      .from("dating_settings")
      .update(payload)
      .eq("id", current.id)
      .select("*")
      .single()
    if (error) throw error
    return normalizeDatingSettings(data as Record<string, unknown>)
  }

  const { data, error } = await db.from("dating_settings").insert(payload).select("*").single()
  if (error) throw error
  return normalizeDatingSettings(data as Record<string, unknown>)
}

export function getPlanPriceGhs(
  plan: "silver" | "gold" | "coins",
  settings: DatingSettings,
): number {
  switch (plan) {
    case "silver":
      return settings.silver_price
    case "gold":
      return settings.gold_price
    case "coins":
      return settings.coin_pack_price
    default:
      return 0
  }
}

import { getAdminClient } from "@/lib/supabase-base"
import { isUuid, isValidStoreSlug, normalizeStoreSlug } from "@/lib/storefront-utils"

export type StoreItemType = "data_bundle" | "referral_service"

export interface StoreSettingRow {
  id: string
  agent_id: string
  item_id: string
  item_type: StoreItemType
  is_visible: boolean
  custom_margin: number
}

export interface StoreProfileRow {
  agent_id: string
  store_name: string | null
  store_slug: string | null
  whatsapp_number: string | null
  phone_number: string | null
  primary_color: string | null
  business_info: string | null
  storefront_commission_balance: number
}

export async function resolveStoreSegmentToAgentId(segment: string): Promise<string | null> {
  if (!segment?.trim()) return null
  const trimmed = segment.trim()
  if (isUuid(trimmed)) {
    const db = getAdminClient()
    const { data } = await db.from("agents").select("id").eq("id", trimmed).maybeSingle()
    return data?.id ?? null
  }
  const slug = normalizeStoreSlug(trimmed)
  const db = getAdminClient()
  const { data } = await db
    .from("agent_store_profiles")
    .select("agent_id")
    .eq("store_slug", slug)
    .maybeSingle()
  return data?.agent_id ?? null
}

export async function checkStoreSlugAvailable(
  slug: string,
  excludeAgentId?: string,
): Promise<{ available: boolean; normalized: string; reason?: string }> {
  const normalized = normalizeStoreSlug(slug)
  if (!isValidStoreSlug(normalized)) {
    return { available: false, normalized, reason: "Use 3–40 characters: lowercase letters, numbers, hyphens only" }
  }
  const db = getAdminClient()
  const { data: existing } = await db
    .from("agent_store_profiles")
    .select("agent_id")
    .eq("store_slug", normalized)
    .maybeSingle()

  if (existing && existing.agent_id !== excludeAgentId) {
    return { available: false, normalized, reason: "This store URL is already taken" }
  }
  return { available: true, normalized }
}

export async function deleteStoreSetting(
  agentId: string,
  itemId: string,
  itemType: StoreItemType,
): Promise<void> {
  const db = getAdminClient()
  const { error } = await db
    .from("agent_store_settings")
    .delete()
    .eq("agent_id", agentId)
    .eq("item_id", itemId)
    .eq("item_type", itemType)
  if (error) throw error
}

export async function getStoreProfile(agentId: string): Promise<StoreProfileRow | null> {
  const db = getAdminClient()
  const { data } = await db.from("agent_store_profiles").select("*").eq("agent_id", agentId).maybeSingle()
  return data as StoreProfileRow | null
}

export async function upsertStoreProfile(agentId: string, payload: Partial<StoreProfileRow>) {
  const db = getAdminClient()
  const { data, error } = await db
    .from("agent_store_profiles")
    .upsert(
      {
        agent_id: agentId,
        ...payload,
      },
      { onConflict: "agent_id" },
    )
    .select()
    .single()

  if (error) {
    throw error
  }
  return data
}

export async function getStoreSettings(agentId: string): Promise<StoreSettingRow[]> {
  const db = getAdminClient()
  const { data, error } = await db.from("agent_store_settings").select("*").eq("agent_id", agentId)

  if (error) {
    throw error
  }
  return (data || []) as StoreSettingRow[]
}

export async function upsertStoreSetting(
  agentId: string,
  itemId: string,
  itemType: StoreItemType,
  fields: { is_visible?: boolean; custom_margin?: number },
) {
  const db = getAdminClient()
  const margin =
    itemType === "referral_service" ? 0 : Number(fields.custom_margin ?? 0)

  const { data, error } = await db
    .from("agent_store_settings")
    .upsert(
      {
        agent_id: agentId,
        item_id: itemId,
        item_type: itemType,
        is_visible: fields.is_visible ?? true,
        custom_margin: margin,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agent_id,item_id,item_type" },
    )
    .select()
    .single()

  if (error) {
    throw error
  }
  return data
}

export async function getPublicStorefrontPayload(agentId: string) {
  const db = getAdminClient()

  const [profile, settings, agentRow] = await Promise.all([
    getStoreProfile(agentId),
    getStoreSettings(agentId),
    db.from("agents").select("id, full_name, phone_number, momo_number, isapproved, isbanned").eq("id", agentId).maybeSingle(),
  ])

  if (!agentRow.data || agentRow.data.isbanned || !agentRow.data.isapproved) {
    return null
  }

  const settingsMap = new Map(settings.map((s) => [`${s.item_type}:${s.item_id}`, s]))

  const { data: bundles } = await db
    .from("data_bundles")
    .select("id, name, provider, size_gb, price, validity_months, image_url, is_active")
    .eq("is_active", true)
    .order("provider")
    .order("size_gb")

  const { data: services } = await db
    .from("services")
    .select("id, title, description, commission_amount, product_cost, image_url, image_urls, service_type")
    .eq("service_type", "referral")
    .order("title", { ascending: true })

  const visibleBundles = (bundles || [])
    .map((b) => {
      const key = `data_bundle:${b.id}`
      const setting = settingsMap.get(key)
      const visible = setting ? setting.is_visible : false
      if (!visible) return null
      const margin = Number(setting?.custom_margin ?? 0)
      const baseCost = Number(b.price)
      return {
        ...b,
        custom_margin: margin,
        final_price: baseCost + margin,
      }
    })
    .filter(Boolean)

  const visibleServices = (services || [])
    .map((s) => {
      const key = `referral_service:${s.id}`
      const setting = settingsMap.get(key)
      const visible = setting ? setting.is_visible : false
      if (!visible) return null
      const images = (s.image_urls as string[] | null) || []
      const image_url =
        (s.image_url as string | null) || images[0] || null
      return {
        ...s,
        image_url,
        cost: Number(s.product_cost ?? s.commission_amount ?? 0),
        custom_margin: 0,
      }
    })
    .filter(Boolean)

  return {
    agent: agentRow.data,
    profile: profile || {
      agent_id: agentId,
      store_name: agentRow.data.full_name,
      store_slug: null,
      whatsapp_number: agentRow.data.momo_number || agentRow.data.phone_number,
      phone_number: agentRow.data.phone_number,
      primary_color: "#3B82F6",
      business_info: null,
      storefront_commission_balance: 0,
    },
    dataBundles: visibleBundles,
    referralServices: visibleServices,
  }
}

export async function creditStorefrontCommission(agentId: string, amount: number) {
  const db = getAdminClient()
  const profile = await getStoreProfile(agentId)
  const current = Number(profile?.storefront_commission_balance ?? 0)
  await upsertStoreProfile(agentId, {
    storefront_commission_balance: current + amount,
  } as Partial<StoreProfileRow>)
}

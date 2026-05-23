import { getAdminClient } from "@/lib/supabase-base"
import { creditStorefrontCommission } from "@/lib/storefront-server"
import type {
  PublicPropertyListing,
  AgentPropertyCatalogRow,
  PropertyDealType,
  PropertyListingSource,
} from "@/lib/property-types"

const LIVE_STATUSES = ["Published", "Featured"]

export function mapPropertyRow(row: Record<string, unknown>): PublicPropertyListing {
  const details = (row.details as Record<string, unknown>) || {}
  const contact = (row.contact_info as Record<string, unknown>) || {}
  return {
    id: String(row.id),
    title: String(row.title),
    price: Number(row.price),
    currency: String(row.currency || "GHS"),
    category: String(row.category),
    location: row.location != null ? String(row.location) : null,
    description: row.description != null ? String(row.description) : null,
    image_urls: Array.isArray(row.image_urls) ? (row.image_urls as string[]) : [],
    badges: Array.isArray(row.badges) ? (row.badges as string[]) : [],
    status: String(row.status),
    commission: Number(row.commission ?? 0),
    details,
    contact_info: contact,
    published_by_agent_id: row.published_by_agent_id != null ? String(row.published_by_agent_id) : null,
    is_platform_listing: row.published_by_agent_id == null,
  }
}

export async function isAgentStorefrontSuspended(agentId: string): Promise<boolean> {
  const db = getAdminClient()
  const { data } = await db.from("agents").select("isbanned, isapproved, deleted_at").eq("id", agentId).maybeSingle()
  if (!data) return true
  if (data.deleted_at) return true
  if (data.isbanned === true) return true
  if (data.isapproved === false) return true
  return false
}

export async function getVisiblePropertiesForAgent(agentId: string): Promise<PublicPropertyListing[]> {
  if (await isAgentStorefrontSuspended(agentId)) return []

  const db = getAdminClient()
  const { data: settings, error: settingsError } = await db
    .from("agent_store_settings")
    .select("item_id")
    .eq("agent_id", agentId)
    .eq("item_type", "property")
    .eq("is_visible", true)

  if (settingsError) throw settingsError
  const ids = (settings || []).map((s) => s.item_id).filter(Boolean)
  if (ids.length === 0) return []

  const { data: rows, error } = await db
    .from("properties")
    .select("*")
    .in("id", ids)
    .eq("is_approved", true)
    .in("status", LIVE_STATUSES)

  if (error) throw error

  return (rows || [])
    .map((r) => mapPropertyRow(r as Record<string, unknown>))
    .filter(
      (p) =>
        p.published_by_agent_id === agentId ||
        (p.is_platform_listing && p.published_by_agent_id === null),
    )
    .sort((a, b) => a.title.localeCompare(b.title))
}

export async function getAgentPropertyCatalog(agentId: string): Promise<{
  own: AgentPropertyCatalogRow[]
  platform: AgentPropertyCatalogRow[]
}> {
  const db = getAdminClient()
  const { data: settings } = await db
    .from("agent_store_settings")
    .select("item_id, is_visible")
    .eq("agent_id", agentId)
    .eq("item_type", "property")

  const visibleMap = new Map((settings || []).map((s) => [String(s.item_id), Boolean(s.is_visible)]))

  const { data: ownRows } = await db
    .from("properties")
    .select("*")
    .eq("published_by_agent_id", agentId)
    .eq("is_approved", true)
    .in("status", LIVE_STATUSES)
    .order("created_at", { ascending: false })

  const { data: platformRows } = await db
    .from("properties")
    .select("*")
    .is("published_by_agent_id", null)
    .eq("is_approved", true)
    .in("status", LIVE_STATUSES)
    .order("created_at", { ascending: false })

  const mapCatalog = (row: Record<string, unknown>, isOwn: boolean): AgentPropertyCatalogRow => {
    const p = mapPropertyRow(row)
    return {
      ...p,
      is_own_listing: isOwn,
      is_on_storefront: visibleMap.get(p.id) === true,
    }
  }

  return {
    own: (ownRows || []).map((r) => mapCatalog(r as Record<string, unknown>, true)),
    platform: (platformRows || []).map((r) => mapCatalog(r as Record<string, unknown>, false)),
  }
}

export async function recordPropertyDeal(params: {
  propertyId: string
  agentId: string
  dealType: PropertyDealType
  finalPrice?: number | null
  platformCommission: number
  agentCommission?: number
  notes?: string | null
}): Promise<{ dealId: string; credited: number }> {
  const db = getAdminClient()

  const { data: property, error: propErr } = await db
    .from("properties")
    .select("id, published_by_agent_id, title")
    .eq("id", params.propertyId)
    .maybeSingle()

  if (propErr || !property) throw new Error("Property not found")

  const listingSource: PropertyListingSource = property.published_by_agent_id
    ? "agent"
    : "platform"

  const agentCommission =
    listingSource === "platform" &&
    (params.dealType === "sale" || params.dealType === "rent")
      ? Number(params.agentCommission ?? 0)
      : 0

  const { data: deal, error: dealErr } = await db
    .from("property_deals")
    .insert({
      property_id: params.propertyId,
      agent_id: params.agentId,
      deal_type: params.dealType,
      listing_source: listingSource,
      final_price: params.finalPrice ?? null,
      platform_commission: params.platformCommission,
      agent_commission: agentCommission,
      notes: params.notes?.trim() || null,
    })
    .select("id")
    .single()

  if (dealErr) throw dealErr

  await db
    .from("properties")
    .update({ status: "Unpublished" })
    .eq("id", params.propertyId)

  let credited = 0
  if (agentCommission > 0 && params.agentId) {
    await creditStorefrontCommission(params.agentId, agentCommission)
    credited = agentCommission
  }

  return { dealId: deal.id, credited }
}

import { getAdminClient } from "@/lib/supabase-base"
import { creditStorefrontCommission } from "@/lib/storefront-server"
import type { FarmListing, PublicFarmListing, FarmOrder } from "@/lib/farm-types"
import {
  computeAgentCommission,
  computeRetailPrice,
  regionHintFromLocation,
  type FarmOrderStatus,
} from "@/lib/farm-types"

export function mapFarmListingRow(row: Record<string, unknown>): FarmListing {
  return {
    id: String(row.id),
    agent_id: String(row.agent_id),
    farmer_name: String(row.farmer_name),
    farmer_phone: String(row.farmer_phone),
    farmer_location: row.farmer_location != null ? String(row.farmer_location) : null,
    produce_name: String(row.produce_name),
    quantity_available: Number(row.quantity_available),
    unit: String(row.unit || "kg"),
    negotiated_price: Number(row.negotiated_price),
    admin_markup: Number(row.admin_markup ?? 0),
    retail_price: Number(row.retail_price ?? 0),
    photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
    harvest_date: row.harvest_date != null ? String(row.harvest_date) : null,
    notes: row.notes != null ? String(row.notes) : null,
    is_published: Boolean(row.is_published),
    is_fulfilled: Boolean(row.is_fulfilled),
    created_at: String(row.created_at),
    order_count: row.order_count != null ? Number(row.order_count) : undefined,
  }
}

export function toPublicFarmListing(listing: FarmListing): PublicFarmListing {
  return {
    id: listing.id,
    agent_id: listing.agent_id,
    produce_name: listing.produce_name,
    quantity_available: listing.quantity_available,
    unit: listing.unit,
    retail_price: listing.retail_price,
    photos: listing.photos,
    harvest_date: listing.harvest_date,
    notes: listing.notes,
    region_hint: regionHintFromLocation(listing.farmer_location),
    created_at: listing.created_at,
  }
}

export async function getFarmCommissionRate(): Promise<number> {
  const db = getAdminClient()
  const { data } = await db.from("farm_platform_config").select("agent_commission_rate").eq("id", 1).maybeSingle()
  const rate = Number(data?.agent_commission_rate ?? 0.1)
  return Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 0.1
}

export async function getDefaultDeliveryFee(): Promise<number> {
  const db = getAdminClient()
  const { data } = await db.from("farm_platform_config").select("default_delivery_fee").eq("id", 1).maybeSingle()
  return Number(data?.default_delivery_fee ?? 0)
}

export async function listPublishedFarmListings(options?: {
  agentId?: string
  search?: string
  location?: string
}): Promise<PublicFarmListing[]> {
  const db = getAdminClient()
  let query = db
    .from("farm_listings")
    .select("*")
    .eq("is_published", true)
    .eq("is_fulfilled", false)
    .gt("quantity_available", 0)
    .order("created_at", { ascending: false })

  if (options?.agentId) {
    query = query.eq("agent_id", options.agentId)
  }

  const { data, error } = await query
  if (error) throw error

  let rows = (data || []).map((r) => mapFarmListingRow(r as Record<string, unknown>))

  const q = options?.search?.trim().toLowerCase()
  if (q) {
    rows = rows.filter(
      (l) =>
        l.produce_name.toLowerCase().includes(q) ||
        (l.notes || "").toLowerCase().includes(q) ||
        (l.farmer_location || "").toLowerCase().includes(q),
    )
  }

  const loc = options?.location?.trim().toLowerCase()
  if (loc) {
    rows = rows.filter((l) => (l.farmer_location || "").toLowerCase().includes(loc))
  }

  return rows.map(toPublicFarmListing)
}

export async function applyListingMarkup(
  listingId: string,
  adminMarkup: number,
  publish?: boolean,
): Promise<FarmListing> {
  const db = getAdminClient()
  const { data: existing, error: fetchErr } = await db
    .from("farm_listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle()

  if (fetchErr || !existing) throw new Error("Listing not found")

  const negotiated = Number(existing.negotiated_price)
  const retail_price = computeRetailPrice(negotiated, adminMarkup)

  const updates: Record<string, unknown> = {
    admin_markup: adminMarkup,
    retail_price,
  }
  if (publish !== undefined) updates.is_published = publish

  const { data, error } = await db
    .from("farm_listings")
    .update(updates)
    .eq("id", listingId)
    .select("*")
    .single()

  if (error) throw error
  return mapFarmListingRow(data as Record<string, unknown>)
}

export async function creditFarmOrderCommissionIfNeeded(
  orderId: string,
  previousStatus: string,
  newStatus: string,
): Promise<{ credited: number }> {
  if (newStatus !== "delivered" || previousStatus === "delivered") {
    return { credited: 0 }
  }

  const db = getAdminClient()
  const { data: order, error } = await db
    .from("farm_orders")
    .select("id, agent_id, agent_commission, commission_credited")
    .eq("id", orderId)
    .maybeSingle()

  if (error || !order?.agent_id || order.commission_credited) {
    return { credited: 0 }
  }

  const commission = Number(order.agent_commission ?? 0)
  if (commission <= 0) return { credited: 0 }

  await creditStorefrontCommission(String(order.agent_id), commission)
  await db.from("farm_orders").update({ commission_credited: true }).eq("id", orderId)

  return { credited: commission }
}

export function mapFarmOrderRow(row: Record<string, unknown>): FarmOrder {
  const listing = row.farm_listings as Record<string, unknown> | null | undefined
  return {
    id: String(row.id),
    listing_id: row.listing_id != null ? String(row.listing_id) : null,
    agent_id: row.agent_id != null ? String(row.agent_id) : null,
    buyer_name: String(row.buyer_name),
    buyer_phone: String(row.buyer_phone),
    buyer_email: row.buyer_email != null ? String(row.buyer_email) : null,
    delivery_address: String(row.delivery_address),
    quantity_ordered: Number(row.quantity_ordered),
    total_price: Number(row.total_price),
    delivery_fee: Number(row.delivery_fee ?? 0),
    paystack_reference: row.paystack_reference != null ? String(row.paystack_reference) : null,
    status: row.status as FarmOrder["status"],
    agent_commission: Number(row.agent_commission ?? 0),
    commission_credited: Boolean(row.commission_credited),
    created_at: String(row.created_at),
    farm_listings: listing ? mapFarmListingRow(listing) : null,
  }
}

export { computeAgentCommission, computeRetailPrice }

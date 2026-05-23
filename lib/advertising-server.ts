import { getAdminClient } from "@/lib/supabase-base"
import { creditStorefrontCommission } from "@/lib/storefront-server"
import type { AdPackage, PublicAdPackage } from "@/lib/advertising-types"
import { parseCustomFields } from "@/lib/advertising-types"

export function mapAdPackageRow(row: Record<string, unknown>): AdPackage {
  return {
    id: String(row.id),
    station_name: String(row.station_name),
    media_type: row.media_type as AdPackage["media_type"],
    package_name: String(row.package_name),
    description: row.description != null ? String(row.description) : null,
    number_of_spots: row.number_of_spots != null ? Number(row.number_of_spots) : null,
    spot_duration: row.spot_duration != null ? String(row.spot_duration) : null,
    price: Number(row.price),
    agent_commission: Number(row.agent_commission ?? 0),
    custom_fields: parseCustomFields(row.custom_fields),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  }
}

export function toPublicAdPackage(pkg: AdPackage): PublicAdPackage {
  return {
    id: pkg.id,
    station_name: pkg.station_name,
    media_type: pkg.media_type,
    package_name: pkg.package_name,
    description: pkg.description,
    number_of_spots: pkg.number_of_spots,
    spot_duration: pkg.spot_duration,
    price: pkg.price,
    agent_commission: pkg.agent_commission,
    custom_fields: pkg.custom_fields,
  }
}

export async function listActiveAdPackages(): Promise<AdPackage[]> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("ad_packages")
    .select("*")
    .eq("is_active", true)
    .order("station_name", { ascending: true })

  if (error) throw error
  return (data || []).map((r) => mapAdPackageRow(r as Record<string, unknown>))
}

export async function getVisibleAdPackagesForAgent(agentId: string): Promise<PublicAdPackage[]> {
  const db = getAdminClient()
  const { data: settings, error: settingsError } = await db
    .from("agent_store_settings")
    .select("item_id")
    .eq("agent_id", agentId)
    .eq("item_type", "ad_package")
    .eq("is_visible", true)

  if (settingsError) throw settingsError
  const ids = (settings || []).map((s) => s.item_id).filter(Boolean)
  if (ids.length === 0) return []

  const { data: packages, error: pkgError } = await db
    .from("ad_packages")
    .select("*")
    .in("id", ids)
    .eq("is_active", true)

  if (pkgError) throw pkgError
  return (packages || []).map((r) => toPublicAdPackage(mapAdPackageRow(r as Record<string, unknown>)))
}

/** Credit agent commission when order first moves to completed. */
export async function creditAdOrderCommissionIfNeeded(
  orderId: string,
  previousStatus: string,
  newStatus: string,
): Promise<{ credited: number }> {
  if (newStatus !== "completed" || previousStatus === "completed") {
    return { credited: 0 }
  }

  const db = getAdminClient()
  const { data: order, error } = await db
    .from("ad_orders")
    .select("id, agent_id, package_id, status")
    .eq("id", orderId)
    .maybeSingle()

  if (error || !order?.agent_id || !order.package_id) {
    return { credited: 0 }
  }

  const { data: pkg } = await db
    .from("ad_packages")
    .select("agent_commission")
    .eq("id", order.package_id)
    .maybeSingle()

  const commission = Number(pkg?.agent_commission ?? 0)
  if (commission <= 0) return { credited: 0 }

  await creditStorefrontCommission(String(order.agent_id), commission)
  return { credited: commission }
}

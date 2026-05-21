import type { BuyerDetails } from "@/lib/storefront-catalog"
import { metadataValue, parseJsonArrayFromMetadata } from "@/lib/storefront-order-whatsapp"

export type WholesaleCartItemMeta = {
  wholesale_product_id: string
  quantity: number
  base_cost: number
  agent_markup: number
  total_paid: number
  product_name: string
}

export function parseWholesaleItemsFromMetadata(meta: Record<string, unknown>): WholesaleCartItemMeta[] {
  const parsed = parseJsonArrayFromMetadata(meta, "wholesale_items_json")
  return parsed ? (parsed as WholesaleCartItemMeta[]) : []
}

export function parseBuyerDetailsFromMetadata(meta: Record<string, unknown>): BuyerDetails | null {
  const raw = metadataValue(meta, "buyer_details_json")
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as BuyerDetails
  }
  if (typeof raw !== "string" || !raw.trim()) return null
  try {
    return JSON.parse(raw) as BuyerDetails
  } catch {
    return null
  }
}

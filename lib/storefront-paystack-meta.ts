import type { BuyerDetails } from "@/lib/storefront-catalog"

export type WholesaleCartItemMeta = {
  wholesale_product_id: string
  quantity: number
  base_cost: number
  agent_markup: number
  total_paid: number
  product_name: string
}

export function parseWholesaleItemsFromMetadata(meta: Record<string, unknown>): WholesaleCartItemMeta[] {
  const raw = meta.wholesale_items_json
  if (typeof raw !== "string" || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw) as WholesaleCartItemMeta[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function parseBuyerDetailsFromMetadata(meta: Record<string, unknown>): BuyerDetails | null {
  const raw = meta.buyer_details_json
  if (typeof raw !== "string" || !raw.trim()) return null
  try {
    return JSON.parse(raw) as BuyerDetails
  } catch {
    return null
  }
}

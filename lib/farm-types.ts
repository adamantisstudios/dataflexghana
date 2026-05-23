export const FARM_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const

export type FarmOrderStatus = (typeof FARM_ORDER_STATUSES)[number]

export const FARM_ORDER_STATUS_LABELS: Record<FarmOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export const FARM_UNITS = ["kg", "bag", "crate", "bunch", "piece", "ton", "litre"] as const
export type FarmUnit = (typeof FARM_UNITS)[number]

export type FarmListing = {
  id: string
  agent_id: string
  farmer_name: string
  farmer_phone: string
  farmer_location: string | null
  produce_name: string
  quantity_available: number
  unit: string
  negotiated_price: number
  admin_markup: number
  retail_price: number
  photos: string[]
  harvest_date: string | null
  notes: string | null
  is_published: boolean
  is_fulfilled: boolean
  created_at: string
  order_count?: number
}

export type PublicFarmListing = {
  id: string
  agent_id: string
  produce_name: string
  quantity_available: number
  unit: string
  retail_price: number
  photos: string[]
  harvest_date: string | null
  notes: string | null
  region_hint: string | null
  created_at: string
}

export type FarmOrder = {
  id: string
  listing_id: string | null
  agent_id: string | null
  buyer_name: string
  buyer_phone: string
  buyer_email: string | null
  delivery_address: string
  quantity_ordered: number
  total_price: number
  delivery_fee: number
  paystack_reference: string | null
  status: FarmOrderStatus
  agent_commission: number
  commission_credited: boolean
  created_at: string
  farm_listings?: FarmListing | PublicFarmListing | null
}

export function isFarmOrderStatus(v: string): v is FarmOrderStatus {
  return (FARM_ORDER_STATUSES as readonly string[]).includes(v)
}

export function computeRetailPrice(negotiatedPrice: number, adminMarkup: number): number {
  return Number((negotiatedPrice + adminMarkup).toFixed(2))
}

export function computeAgentCommission(
  adminMarkupPerUnit: number,
  quantity: number,
  rate: number,
): number {
  const markupTotal = adminMarkupPerUnit * quantity
  return Number((markupTotal * rate).toFixed(2))
}

/** Public region hint without exposing exact farmer location */
export function regionHintFromLocation(location: string | null | undefined): string | null {
  if (!location?.trim()) return null
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null
  return parts[parts.length - 1] || parts[0]
}

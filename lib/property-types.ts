export const PROPERTY_DEAL_TYPES = ["sale", "rent", "agent_owes_platform"] as const
export type PropertyDealType = (typeof PROPERTY_DEAL_TYPES)[number]

export const PROPERTY_LISTING_SOURCES = ["agent", "platform"] as const
export type PropertyListingSource = (typeof PROPERTY_LISTING_SOURCES)[number]

export type PublicPropertyListing = {
  id: string
  title: string
  price: number
  currency: string
  category: string
  location: string | null
  description: string | null
  image_urls: string[]
  badges: string[]
  status: string
  commission: number
  details: Record<string, unknown>
  contact_info: Record<string, unknown>
  published_by_agent_id: string | null
  is_platform_listing: boolean
}

export type AgentPropertyCatalogRow = PublicPropertyListing & {
  is_on_storefront: boolean
  is_own_listing: boolean
}

export type PropertyDeal = {
  id: string
  property_id: string | null
  agent_id: string | null
  deal_type: PropertyDealType
  listing_source: PropertyListingSource
  final_price: number | null
  platform_commission: number
  agent_commission: number
  deal_date: string
  notes: string | null
  created_at: string
}

export function isPropertyDealType(v: string): v is PropertyDealType {
  return (PROPERTY_DEAL_TYPES as readonly string[]).includes(v)
}

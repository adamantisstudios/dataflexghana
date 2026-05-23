/** Types for legacy agent property browse components (bookmark redirect flow). */

export interface AgentBrowseProperty {
  id: string
  title: string
  property_link?: string
  price: number
  currency: string
  commission?: number
  category: string
  details: {
    bedrooms?: number
    bathrooms?: number
    size?: string
    furnished?: string
    amenities?: string
    [key: string]: unknown
  }
  location?: string
  description?: string
  contact_info: {
    phone?: string
    whatsapp?: string
    [key: string]: unknown
  }
  badges?: string[]
  status: string
  image_urls?: string[]
  created_at: string
  updated_at: string
}

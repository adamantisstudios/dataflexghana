export const INFLUENCER_PLATFORM_FEE_RATE = 0.08
export const MIN_INFLUENCER_AUDIENCE = 50_000

export type InfluencerOrderStatus =
  | "pending"
  | "accepted"
  | "content_created"
  | "completed"
  | "disputed"
  | "cancelled"

export const INFLUENCER_ORDER_STATUSES: InfluencerOrderStatus[] = [
  "pending",
  "accepted",
  "content_created",
  "completed",
  "disputed",
  "cancelled",
]

export const INFLUENCER_ORDER_STATUS_LABELS: Record<InfluencerOrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  content_created: "Content created",
  completed: "Completed",
  disputed: "Disputed",
  cancelled: "Cancelled",
}

export type SocialHandles = Record<string, string>

export type InfluencerRegistrationSource = "referral_hub" | "self_registered"

export type InfluencerProfile = {
  id: string
  agent_id: string
  bio: string | null
  photo_url: string | null
  social_handles: SocialHandles
  audience_size: number
  niche: string | null
  approved: boolean
  registration_source?: InfluencerRegistrationSource
  created_at: string
}

export type InfluencerPackage = {
  id: string
  profile_id: string
  title: string
  description: string | null
  price: number
  delivery_days: number
  terms: string | null
  is_active: boolean
  created_at: string
}

export type InfluencerOrder = {
  id: string
  package_id: string
  agent_id: string
  client_name: string
  client_phone: string
  client_email: string | null
  requirements: string
  total_price: number
  platform_fee_client: number
  platform_fee_influencer: number
  influencer_payout: number
  paystack_reference: string | null
  status: InfluencerOrderStatus
  review: string | null
  rating: number | null
  escrow_released: boolean
  created_at: string
  package?: InfluencerPackage
}

export type PublicInfluencerProfile = {
  agent_id: string
  full_name: string
  bio: string | null
  photo_url: string | null
  social_handles: SocialHandles
  audience_size: number
  niche: string | null
  packages: PublicInfluencerPackage[]
}

export type PublicInfluencerPackage = {
  id: string
  title: string
  description: string | null
  price: number
  delivery_days: number
  terms: string | null
}

export function calculateInfluencerFees(packagePrice: number) {
  const price = Math.round(packagePrice * 100) / 100
  const platform_fee_client = Math.round(price * INFLUENCER_PLATFORM_FEE_RATE * 100) / 100
  const platform_fee_influencer = Math.round(price * INFLUENCER_PLATFORM_FEE_RATE * 100) / 100
  const total_price = Math.round((price + platform_fee_client) * 100) / 100
  const influencer_payout = Math.round((price - platform_fee_influencer) * 100) / 100
  return {
    package_price: price,
    platform_fee_client,
    platform_fee_influencer,
    total_price,
    influencer_payout,
  }
}

export function parseSocialHandles(raw: unknown): SocialHandles {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const out: SocialHandles = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = String(k).trim()
    const val = String(v ?? "").trim()
    if (key && val) out[key] = val
  }
  return out
}

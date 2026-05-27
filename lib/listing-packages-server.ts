import { getAdminClient } from "@/lib/supabase-base"
import {
  getActiveAgentFeatures,
  getDefaultFreeFeatures,
  type ListingFeatures,
} from "@/lib/listing-package-utils"

export type ListingPackage = {
  id: string
  name: string
  max_listings: number
  price: number
  features: Record<string, unknown> | null
  includes_analytics: boolean
  is_active: boolean
  created_at: string
}

export type ListingSubscription = {
  id: string
  agent_id: string
  package_id: string
  paystack_reference: string | null
  status: string
  started_at: string | null
  expires_at: string | null
  created_at: string
  package?: ListingPackage
}

export type AgentProduct = {
  id: string
  agent_id: string
  subscription_id: string | null
  title: string
  description: string | null
  price: number
  images: string[]
  momo_number: string | null
  momo_name: string | null
  category: string | null
  is_active: boolean
  view_count: number
  created_at: string
}

export type PublicAgentProductsPayload = {
  products: AgentProduct[]
  features: ListingFeatures
}

const LISTING_DURATION_DAYS = 30

export async function getActiveListingPackages(): Promise<ListingPackage[]> {
  const db = getAdminClient()
  const { data } = await db
    .from("listing_packages")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true })
  return (data || []).map((p) => ({
    ...p,
    price: Number(p.price),
    max_listings: Number(p.max_listings),
    features: p.features ?? null,
    includes_analytics: Boolean(p.includes_analytics),
    is_active: Boolean(p.is_active),
  }))
}

export async function getAgentActiveSubscription(agentId: string): Promise<ListingSubscription | null> {
  const db = getAdminClient()
  const now = new Date().toISOString()
  const { data } = await db
    .from("agent_listing_subscriptions")
    .select("*")
    .eq("agent_id", agentId)
    .eq("status", "active")
    .gt("expires_at", now)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  const { data: pkgRow } = await db
    .from("listing_packages")
    .select("*")
    .eq("id", data.package_id)
    .maybeSingle()

  const pkg = pkgRow as ListingPackage | null
  return {
    ...data,
    package: pkg
      ? {
          ...pkg,
          price: Number(pkg.price),
          max_listings: Number(pkg.max_listings),
          features: pkg.features ?? null,
          includes_analytics: Boolean(pkg.includes_analytics),
          is_active: Boolean(pkg.is_active),
        }
      : undefined,
  }
}

export async function countAgentProducts(agentId: string, activeOnly = false): Promise<number> {
  const db = getAdminClient()
  let q = db.from("agent_products").select("id", { count: "exact", head: true }).eq("agent_id", agentId)
  if (activeOnly) q = q.eq("is_active", true)
  const { count } = await q
  return count ?? 0
}

export async function agentCanListProducts(agentId: string): Promise<boolean> {
  const db = getAdminClient()
  const { data } = await db
    .from("agent_store_profiles")
    .select("can_list_products")
    .eq("agent_id", agentId)
    .maybeSingle()
  return data?.can_list_products !== false
}

export async function activateListingSubscription(subscriptionId: string): Promise<void> {
  const db = getAdminClient()
  const started = new Date()
  const expires = new Date(started)
  expires.setDate(expires.getDate() + LISTING_DURATION_DAYS)
  const { error } = await db
    .from("agent_listing_subscriptions")
    .update({
      status: "active",
      started_at: started.toISOString(),
      expires_at: expires.toISOString(),
    })
    .eq("id", subscriptionId)
  if (error) throw error
}

export async function createPendingListingSubscription(params: {
  agent_id: string
  package_id: string
  paystack_reference: string
}): Promise<ListingSubscription> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("agent_listing_subscriptions")
    .insert({
      agent_id: params.agent_id,
      package_id: params.package_id,
      paystack_reference: params.paystack_reference,
      status: "pending",
    })
    .select("*")
    .single()
  if (error) throw error
  return data as ListingSubscription
}

export async function getPublicAgentProducts(agentId: string): Promise<PublicAgentProductsPayload> {
  const canList = await agentCanListProducts(agentId)
  const sub = await getAgentActiveSubscription(agentId)
  const features = getActiveAgentFeatures(sub)
  if (!canList) return { products: [], features }

  const db = getAdminClient()
  const { data } = await db
    .from("agent_products")
    .select("*")
    .eq("agent_id", agentId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const allProducts = (data || []).map((p) => ({
    ...p,
    price: Number(p.price),
    images: Array.isArray(p.images) ? p.images : [],
    view_count: Number(p.view_count ?? 0),
    is_active: Boolean(p.is_active),
  }))

  const maxListings = Number(features.max_listings)
  const limitedProducts =
    Number.isFinite(maxListings) && maxListings > 0
      ? allProducts.slice(0, maxListings)
      : allProducts

  return {
    products: limitedProducts,
    features: features ?? getDefaultFreeFeatures(),
  }
}

export async function getAgentListingFeatures(agentId: string): Promise<ListingFeatures> {
  const sub = await getAgentActiveSubscription(agentId)
  return getActiveAgentFeatures(sub) ?? getDefaultFreeFeatures()
}

import { getAdminClient } from "@/lib/supabase-base"
import { buildStorefrontUrl, getStorefrontOrigin } from "@/lib/storefront-utils"

export type PublicPropertyListingAgent = {
  agent_id: string
  store_name: string | null
  store_slug: string | null
  storefront_url: string
}

export type PublicPropertyWithAgent = Record<string, unknown> & {
  id: string
  published_by_agent_id: string | null
  listing_agent: PublicPropertyListingAgent | null
}

export type FeaturedRealEstateAgent = {
  agent_id: string
  full_name: string
  store_name: string | null
  store_slug: string | null
  storefront_url: string
  listing_count: number
}

export async function getPublicPropertiesMarketplace(): Promise<{
  properties: PublicPropertyWithAgent[]
  featured_agents: FeaturedRealEstateAgent[]
  storefront_home_url: string
}> {
  const db = getAdminClient()
  const storefrontHomeUrl = getStorefrontOrigin()

  const { data: propertyRows, error: propErr } = await db
    .from("properties")
    .select("*")
    .in("status", ["Published", "Featured"])
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  if (propErr) throw propErr

  const agentIds = [
    ...new Set(
      (propertyRows || [])
        .map((p) => p.published_by_agent_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  const profileMap = new Map<string, { store_name: string | null; store_slug: string | null }>()
  if (agentIds.length > 0) {
    const { data: profiles } = await db
      .from("agent_store_profiles")
      .select("agent_id, store_name, store_slug")
      .in("agent_id", agentIds)
    for (const p of profiles || []) {
      profileMap.set(String(p.agent_id), {
        store_name: p.store_name != null ? String(p.store_name) : null,
        store_slug: p.store_slug != null ? String(p.store_slug) : null,
      })
    }
  }

  const properties: PublicPropertyWithAgent[] = (propertyRows || []).map((row) => {
    const agentId = row.published_by_agent_id != null ? String(row.published_by_agent_id) : null
    const profile = agentId ? profileMap.get(agentId) : null
    const listing_agent: PublicPropertyListingAgent | null = agentId
      ? {
          agent_id: agentId,
          store_name: profile?.store_name ?? null,
          store_slug: profile?.store_slug ?? null,
          storefront_url: buildStorefrontUrl(agentId, profile?.store_slug ?? null),
        }
      : null
    return { ...(row as Record<string, unknown>), listing_agent }
  })

  const { data: visibleSettings } = await db
    .from("agent_store_settings")
    .select("agent_id, item_id")
    .eq("item_type", "property")
    .eq("is_visible", true)

  const agentListingCounts = new Map<string, number>()
  for (const s of visibleSettings || []) {
    const aid = String(s.agent_id)
    agentListingCounts.set(aid, (agentListingCounts.get(aid) || 0) + 1)
  }

  const featuredAgentIds = [...agentListingCounts.keys()]
  let featured_agents: FeaturedRealEstateAgent[] = []

  if (featuredAgentIds.length > 0) {
    const { data: agents } = await db
      .from("agents")
      .select("id, full_name, isapproved, isbanned")
      .in("id", featuredAgentIds)

    const activeIds = (agents || [])
      .filter((a) => a.isapproved === true && a.isbanned !== true)
      .map((a) => String(a.id))

    if (activeIds.length > 0) {
      const { data: profiles } = await db
        .from("agent_store_profiles")
        .select("agent_id, store_name, store_slug")
        .in("agent_id", activeIds)

      const nameMap = new Map((agents || []).map((a) => [String(a.id), String(a.full_name || "Agent")]))

      featured_agents = (profiles || [])
        .map((p) => {
          const agentId = String(p.agent_id)
          const count = agentListingCounts.get(agentId) || 0
          if (count === 0) return null
          return {
            agent_id: agentId,
            full_name: nameMap.get(agentId) || "Agent",
            store_name: p.store_name != null ? String(p.store_name) : null,
            store_slug: p.store_slug != null ? String(p.store_slug) : null,
            storefront_url: buildStorefrontUrl(agentId, p.store_slug != null ? String(p.store_slug) : null),
            listing_count: count,
          }
        })
        .filter((a): a is FeaturedRealEstateAgent => a != null)
        .sort((a, b) => b.listing_count - a.listing_count)
        .slice(0, 12)
    }
  }

  return {
    properties,
    featured_agents,
    storefront_home_url: storefrontHomeUrl,
  }
}

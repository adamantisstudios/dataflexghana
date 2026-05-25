import { getAdminClient } from "@/lib/supabase-base"
import type { InfluencerPackage, InfluencerProfile, PublicInfluencerProfile, SocialHandles } from "@/lib/influencer-types"
import { parseSocialHandles } from "@/lib/influencer-types"

export async function getInfluencerProfileByAgentId(agentId: string): Promise<InfluencerProfile | null> {
  const db = getAdminClient()
  const { data, error } = await db
    .from("influencer_profiles")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle()
  if (error || !data) return null
  return {
    ...data,
    social_handles: parseSocialHandles(data.social_handles),
    audience_size: Number(data.audience_size),
    approved: Boolean(data.approved),
  } as InfluencerProfile
}

export async function getPackagesForProfile(profileId: string, activeOnly = false): Promise<InfluencerPackage[]> {
  const db = getAdminClient()
  let q = db.from("influencer_packages").select("*").eq("profile_id", profileId).order("created_at", { ascending: false })
  if (activeOnly) q = q.eq("is_active", true)
  const { data, error } = await q
  if (error) return []
  return (data || []).map((row) => ({
    ...row,
    price: Number(row.price),
    delivery_days: Number(row.delivery_days ?? 7),
    is_active: Boolean(row.is_active),
  })) as InfluencerPackage[]
}

export type PublicInfluencerListItem = {
  profile_id: string
  agent_id: string
  full_name: string
  photo_url: string | null
  niche: string | null
  audience_size: number
  bio: string | null
  social_handles: SocialHandles
  package_count: number
}

export async function listPublicApprovedInfluencers(): Promise<PublicInfluencerListItem[]> {
  const db = getAdminClient()
  const { data: profiles, error } = await db
    .from("influencer_profiles")
    .select("*")
    .eq("approved", true)
    .order("created_at", { ascending: false })

  if (error || !profiles?.length) return []

  const profileIds = profiles.map((p) => p.id)
  const agentIds = [...new Set(profiles.map((p) => p.agent_id))]

  const [{ data: agents }, { data: packages }] = await Promise.all([
    db.from("agents").select("id, full_name").in("id", agentIds),
    db
      .from("influencer_packages")
      .select("profile_id")
      .in("profile_id", profileIds)
      .eq("is_active", true),
  ])

  const agentMap = new Map((agents || []).map((a) => [a.id, a.full_name || "Influencer"]))
  const packageCounts = new Map<string, number>()
  for (const pkg of packages || []) {
    const pid = String(pkg.profile_id)
    packageCounts.set(pid, (packageCounts.get(pid) || 0) + 1)
  }

  return profiles.map((p) => ({
    profile_id: p.id,
    agent_id: p.agent_id,
    full_name: agentMap.get(p.agent_id) || "Influencer",
    photo_url: p.photo_url,
    niche: p.niche,
    audience_size: Number(p.audience_size),
    bio: p.bio,
    social_handles: parseSocialHandles(p.social_handles) as SocialHandles,
    package_count: packageCounts.get(p.id) || 0,
  }))
}

export async function getPublicInfluencerDetail(profileId: string): Promise<PublicInfluencerProfile | null> {
  const db = getAdminClient()
  const { data: profile, error } = await db
    .from("influencer_profiles")
    .select("*")
    .eq("id", profileId)
    .eq("approved", true)
    .maybeSingle()

  if (error || !profile) return null

  const { data: agent } = await db.from("agents").select("full_name").eq("id", profile.agent_id).maybeSingle()
  const packages = await getPackagesForProfile(profile.id, true)

  return {
    agent_id: profile.agent_id,
    full_name: agent?.full_name || "Influencer",
    bio: profile.bio,
    photo_url: profile.photo_url,
    social_handles: parseSocialHandles(profile.social_handles) as SocialHandles,
    audience_size: Number(profile.audience_size),
    niche: profile.niche,
    packages: packages.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      delivery_days: p.delivery_days,
      terms: p.terms,
    })),
  }
}

export async function getPublicInfluencerForAgent(agentId: string): Promise<PublicInfluencerProfile | null> {
  const profile = await getInfluencerProfileByAgentId(agentId)
  if (!profile?.approved) return null

  const db = getAdminClient()
  const { data: agent } = await db.from("agents").select("full_name").eq("id", agentId).maybeSingle()
  if (!agent) return null

  const packages = await getPackagesForProfile(profile.id, true)

  return {
    agent_id: agentId,
    full_name: agent.full_name || "Influencer",
    bio: profile.bio,
    photo_url: profile.photo_url,
    social_handles: profile.social_handles as SocialHandles,
    audience_size: profile.audience_size,
    niche: profile.niche,
    packages: packages.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      delivery_days: p.delivery_days,
      terms: p.terms,
    })),
  }
}

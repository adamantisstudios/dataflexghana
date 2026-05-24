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

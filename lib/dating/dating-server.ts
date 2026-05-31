import { getAdminClient } from "@/lib/supabase-base"
import {
  calculateProfileCompleteness,
  type ProfileCompletenessInput,
} from "@/lib/dating/profile-completeness"
import {
  countProfilePhotos,
  getPhotosForProfile,
  getPhotosForProfiles,
  type DatingProfilePhoto,
} from "@/lib/dating/dating-photos"
import {
  DATING_PLANS,
  type DatingIntention,
  type DatingPlan,
  childrenCompatible,
  intentionCompatibilityScore,
  isFemaleGender,
  lifestyleAligned,
  locationProximityMatch,
  religionCompatible,
} from "@/lib/dating/constants"

export type { DatingProfilePhoto } from "@/lib/dating/dating-photos"

export type DatingProfile = {
  id: string
  agent_id: string
  display_name: string
  bio: string | null
  age: number | null
  gender: string | null
  interested_in: string | null
  relationship_status: string | null
  intentions: DatingIntention
  location: string | null
  occupation: string | null
  interests: string[]
  height_cm?: number | null
  education?: string | null
  religion?: string | null
  drinking?: string | null
  smoking?: string | null
  children?: string | null
  languages?: string[]
  personality_traits?: string[]
  weekly_availability?: string | null
  photos?: DatingProfilePhoto[]
  is_active: boolean
  is_approved: boolean
  is_suspended: boolean
  ladies_first: boolean
  profile_completeness: number
  created_at: string
  updated_at: string
}

export type DatingSubscription = {
  id: string
  agent_id: string
  plan: DatingPlan
  swipes_remaining: number
  matches_remaining: number
  coins: number
  streak_count: number
  last_active_date: string | null
  swipes_reset_at: string | null
  matches_reset_at: string | null
  intro_counselling_claimed: boolean
  monthly_counselling_claimed_at: string | null
  expires_at: string | null
}

function db() {
  return getAdminClient()
}

export { calculateProfileCompleteness }

export function profileToCompletenessInput(
  profile: Partial<DatingProfile> & ProfileCompletenessInput,
  photoCount: number,
): ProfileCompletenessInput {
  return {
    display_name: profile.display_name,
    bio: profile.bio,
    age: profile.age,
    relationship_status: profile.relationship_status,
    intentions: profile.intentions,
    location: profile.location,
    occupation: profile.occupation,
    interests: profile.interests,
    photo_count: photoCount,
    height_cm: profile.height_cm,
    education: profile.education,
    religion: profile.religion,
    drinking: profile.drinking,
    smoking: profile.smoking,
    children: profile.children,
    languages: profile.languages,
    personality_traits: profile.personality_traits,
    weekly_availability: profile.weekly_availability,
  }
}

export async function recalculateProfileCompleteness(profileId: string): Promise<number> {
  const { data } = await db().from("dating_profiles").select("*").eq("id", profileId).maybeSingle()
  if (!data) return 0
  const photoCount = await countProfilePhotos(profileId)
  return calculateProfileCompleteness(profileToCompletenessInput(data as DatingProfile, photoCount))
}

export function compatibilityPercent(rawScore: number): number {
  const MAX = 130
  return Math.min(99, Math.max(0, Math.round((rawScore / MAX) * 100)))
}

export function createDefaultSubscription(agentId: string): DatingSubscription {
  const now = new Date()
  const resetAt = new Date(now)
  resetAt.setHours(24, 0, 0, 0)
  if (resetAt <= now) resetAt.setDate(resetAt.getDate() + 1)
  return {
    id: "fallback",
    agent_id: agentId,
    plan: "free",
    swipes_remaining: DATING_PLANS.free.swipesPerDay,
    matches_remaining: DATING_PLANS.free.matchesPerDay,
    coins: 0,
    streak_count: 0,
    last_active_date: null,
    swipes_reset_at: resetAt.toISOString(),
    matches_reset_at: resetAt.toISOString(),
    intro_counselling_claimed: false,
    monthly_counselling_claimed_at: null,
    expires_at: null,
  }
}

export async function getOrCreateSubscription(agentId: string): Promise<DatingSubscription> {
  try {
    const { data: existing, error: readError } = await db()
      .from("dating_subscriptions")
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle()

    if (readError) {
      console.error("[dating] subscription read error:", readError.message)
      return createDefaultSubscription(agentId)
    }

    if (existing) {
      return existing as DatingSubscription
    }

    const now = new Date()
    const resetAt = new Date(now)
    resetAt.setHours(24, 0, 0, 0)

    const { data: created, error } = await db()
      .from("dating_subscriptions")
      .insert({
        agent_id: agentId,
        plan: "free",
        swipes_remaining: DATING_PLANS.free.swipesPerDay,
        matches_remaining: DATING_PLANS.free.matchesPerDay,
        swipes_reset_at: resetAt.toISOString(),
        matches_reset_at: resetAt.toISOString(),
      })
      .select("*")
      .single()

    if (error || !created) {
      console.error("[dating] subscription create error:", error?.message)
      return createDefaultSubscription(agentId)
    }
    return created as DatingSubscription
  } catch (e) {
    console.error("[dating] getOrCreateSubscription:", e)
    return createDefaultSubscription(agentId)
  }
}

async function resetDailyLimitsIfNeeded(sub: DatingSubscription): Promise<DatingSubscription> {
  const now = new Date()
  const plan = (sub.plan in DATING_PLANS ? sub.plan : "free") as DatingPlan
  const limits = DATING_PLANS[plan]
  let swipesRemaining = sub.swipes_remaining
  let matchesRemaining = sub.matches_remaining
  let swipesResetAt = sub.swipes_reset_at
  let matchesResetAt = sub.matches_reset_at
  let updated = false

  if (!swipesResetAt || new Date(swipesResetAt) <= now) {
    swipesRemaining = limits.swipesPerDay === 999999 ? 999999 : limits.swipesPerDay
    const next = new Date(now)
    next.setHours(24, 0, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 1)
    swipesResetAt = next.toISOString()
    updated = true
  }

  if (!matchesResetAt || new Date(matchesResetAt) <= now) {
    matchesRemaining = limits.matchesPerDay
    const next = new Date(now)
    next.setHours(24, 0, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 1)
    matchesResetAt = next.toISOString()
    updated = true
  }

  if (!updated) return sub

  const { data } = await db()
    .from("dating_subscriptions")
    .update({
      swipes_remaining: swipesRemaining,
      matches_remaining: matchesRemaining,
      swipes_reset_at: swipesResetAt,
      matches_reset_at: matchesResetAt,
      updated_at: now.toISOString(),
    })
    .eq("id", sub.id)
    .select("*")
    .single()

  return (data ?? sub) as DatingSubscription
}

export async function touchDatingStreak(agentId: string): Promise<DatingSubscription> {
  const sub = await resetDailyLimitsIfNeeded(await getOrCreateSubscription(agentId))
  const today = new Date().toISOString().slice(0, 10)
  const last = sub.last_active_date

  if (last === today) return sub

  let streak = sub.streak_count ?? 0
  if (last) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().slice(0, 10)
    streak = last === yStr ? streak + 1 : 1
  } else {
    streak = 1
  }

  let bonusSwipes = sub.swipes_remaining
  if (streak > 0 && streak % 3 === 0) {
    bonusSwipes += 5
  }

  const { data } = await db()
    .from("dating_subscriptions")
    .update({
      streak_count: streak,
      last_active_date: today,
      swipes_remaining: bonusSwipes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id)
    .select("*")
    .single()

  return (data ?? sub) as DatingSubscription
}

export async function getDatingProfile(agentId: string): Promise<DatingProfile | null> {
  try {
    const { data, error } = await db()
      .from("dating_profiles")
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle()
    if (error) {
      console.error("[dating] profile read error:", error.message)
      return null
    }
    return data as DatingProfile | null
  } catch (e) {
    console.error("[dating] getDatingProfile:", e)
    return null
  }
}

export async function getBlockedAgentIds(agentId: string): Promise<Set<string>> {
  const { data } = await db()
    .from("dating_blocks")
    .select("blocker_agent_id, blocked_agent_id")
    .or(`blocker_agent_id.eq.${agentId},blocked_agent_id.eq.${agentId}`)

  const set = new Set<string>()
  for (const row of data ?? []) {
    if (row.blocker_agent_id === agentId) set.add(row.blocked_agent_id)
    if (row.blocked_agent_id === agentId) set.add(row.blocker_agent_id)
  }
  return set
}

export async function getSwipedAgentIds(agentId: string): Promise<Set<string>> {
  const { data } = await db()
    .from("dating_swipes")
    .select("swiped_agent_id")
    .eq("swiper_agent_id", agentId)
  return new Set((data ?? []).map((r) => r.swiped_agent_id))
}

function scoreProfile(
  viewer: DatingProfile,
  candidate: DatingProfile,
  prefs?: {
    min_age?: number
    max_age?: number
    preferred_genders?: string[]
    max_distance_km?: number
  } | null,
): number {
  let score = intentionCompatibilityScore(viewer.intentions, candidate.intentions)

  const viewerInterests = new Set((viewer.interests ?? []).map((i) => i.toLowerCase().trim()))
  for (const interest of candidate.interests ?? []) {
    if (viewerInterests.has(interest.toLowerCase().trim())) score += 10
  }

  if (viewer.education && candidate.education && viewer.education === candidate.education) {
    score += 15
  }

  if (religionCompatible(viewer.religion, candidate.religion)) score += 15

  const drinkingAlign =
    viewer.drinking &&
    candidate.drinking &&
    lifestyleAligned(viewer.drinking, candidate.drinking)
  const smokingAlign =
    viewer.smoking &&
    candidate.smoking &&
    lifestyleAligned(viewer.smoking, candidate.smoking)
  if (drinkingAlign || smokingAlign) score += 10

  if (childrenCompatible(viewer.children, candidate.children)) score += 15

  const viewerTraits = new Set((viewer.personality_traits ?? []).map((t) => t.toLowerCase()))
  for (const trait of candidate.personality_traits ?? []) {
    if (viewerTraits.has(trait.toLowerCase())) score += 5
  }

  if (
    locationProximityMatch(viewer.location, candidate.location, prefs?.max_distance_km ?? 100)
  ) {
    score += 10
  }

  if (prefs?.min_age && candidate.age && candidate.age < prefs.min_age) score -= 30
  if (prefs?.max_age && candidate.age && candidate.age > prefs.max_age) score -= 30

  const preferred = prefs?.preferred_genders ?? []
  if (preferred.length > 0 && candidate.gender && !preferred.includes(candidate.gender)) {
    score -= 20
  }

  if (viewer.interested_in && candidate.gender) {
    const interest = viewer.interested_in.toLowerCase()
    const gender = candidate.gender.toLowerCase()
    if (interest !== "everyone" && interest !== "all" && !gender.includes(interest.slice(0, 4))) {
      score -= 10
    }
  }

  if ((candidate.profile_completeness ?? 0) < 40) {
    score = Math.round(score * 0.8)
  }

  return Math.max(0, score)
}

export async function discoverProfiles(agentId: string) {
  const viewer = await getDatingProfile(agentId)
  if (!viewer?.is_active || !viewer.is_approved || viewer.is_suspended) {
    return { profiles: [], topPick: null, subscription: null, error: "Profile not active or approved" }
  }

  const subscription = await touchDatingStreak(agentId)
  const blocked = await getBlockedAgentIds(agentId)
  const swiped = await getSwipedAgentIds(agentId)

  const { data: prefs } = await db()
    .from("dating_preferences")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle()

  const { data: candidates } = await db()
    .from("dating_profiles")
    .select("*")
    .eq("is_active", true)
    .eq("is_approved", true)
    .eq("is_suspended", false)
    .neq("agent_id", agentId)

  const profileIds = (candidates ?? []).map((c) => c.id as string)
  const photosByProfile = await getPhotosForProfiles(profileIds)

  const scored = (candidates ?? [])
    .filter((c) => !blocked.has(c.agent_id) && !swiped.has(c.agent_id))
    .map((c) => {
      const photos = photosByProfile.get(c.id) ?? []
      const rawScore = scoreProfile(viewer, c as DatingProfile, prefs)
      return {
        ...(c as DatingProfile),
        photos,
        first_photo_id: photos[0]?.id ?? null,
        compatibility_score: compatibilityPercent(rawScore),
        raw_compatibility_score: rawScore,
      }
    })
    .sort((a, b) => b.raw_compatibility_score - a.raw_compatibility_score)

  const topPick = scored[0] ?? null
  const rest = scored.slice(1)

  const mapDiscover = (p: (typeof scored)[0], isTop: boolean) => {
    const { raw_compatibility_score: _raw, ...restProfile } = p
    return {
      ...restProfile,
      photo_preview_count: Math.min(1, p.photos?.length ?? 0),
      is_top_pick: isTop,
    }
  }

  return {
    profiles: rest.map((p) => mapDiscover(p, false)),
    topPick: topPick ? mapDiscover(topPick, true) : null,
    subscription,
  }
}

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export async function recordSwipe(
  agentId: string,
  targetAgentId: string,
  direction: "like" | "pass",
  requestMeta?: { ip?: string | null; userAgent?: string | null },
) {
  if (agentId === targetAgentId) throw new Error("Cannot swipe on yourself")

  let sub = await resetDailyLimitsIfNeeded(await getOrCreateSubscription(agentId))
  if (direction === "like" && sub.swipes_remaining <= 0 && sub.plan !== "gold") {
    throw new Error("Daily swipe limit reached")
  }

  await db().from("dating_swipes").upsert(
    {
      swiper_agent_id: agentId,
      swiped_agent_id: targetAgentId,
      direction,
    },
    { onConflict: "swiper_agent_id,swiped_agent_id" },
  )

  if (direction === "like" && sub.plan !== "gold") {
    sub = (await db()
      .from("dating_subscriptions")
      .update({ swipes_remaining: Math.max(0, sub.swipes_remaining - 1) })
      .eq("id", sub.id)
      .select("*")
      .single()).data as DatingSubscription
  }

  let matched = false
  let matchId: string | null = null

  if (direction === "like") {
    const { data: reciprocal } = await db()
      .from("dating_swipes")
      .select("id")
      .eq("swiper_agent_id", targetAgentId)
      .eq("swiped_agent_id", agentId)
      .eq("direction", "like")
      .maybeSingle()

    if (reciprocal) {
      if (sub.matches_remaining <= 0) {
        throw new Error("Daily match limit reached")
      }

      const [a, b] = orderedPair(agentId, targetAgentId)
      const targetProfile = await getDatingProfile(targetAgentId)
      const myProfile = await getDatingProfile(agentId)

      let chatInitiator: string | null = null
      if (targetProfile && isFemaleGender(targetProfile.gender) && targetProfile.ladies_first) {
        chatInitiator = targetAgentId
      } else if (myProfile && isFemaleGender(myProfile.gender) && myProfile.ladies_first) {
        chatInitiator = agentId
      }

      const { data: match, error: matchErr } = await db()
        .from("dating_matches")
        .upsert(
          {
            agent_a_id: a,
            agent_b_id: b,
            chat_initiator_agent_id: chatInitiator,
            chat_started: chatInitiator ? false : true,
            is_active: true,
            matched_at: new Date().toISOString(),
          },
          { onConflict: "agent_a_id,agent_b_id" },
        )
        .select("id")
        .single()

      if (matchErr) throw new Error(matchErr.message)
      matchId = match?.id ?? null
      matched = true

      sub = (await db()
        .from("dating_subscriptions")
        .update({ matches_remaining: Math.max(0, sub.matches_remaining - 1) })
        .eq("id", sub.id)
        .select("*")
        .single()).data as DatingSubscription
    } else {
      const { logAudit } = await import("@/lib/audit-logger")
      await logAudit({
        actorId: targetAgentId,
        actorType: "agent",
        action: "dating_like_received",
        severity: "info",
        targetTable: "dating_profiles",
        targetId: targetAgentId,
        newData: { from_agent_id: agentId },
        ipAddress: requestMeta?.ip ?? null,
        userAgent: requestMeta?.userAgent ?? null,
      })
    }
  }

  return { matched, matchId, subscription: sub }
}

export async function getMatches(agentId: string) {
  const { data: matches } = await db()
    .from("dating_matches")
    .select("*")
    .or(`agent_a_id.eq.${agentId},agent_b_id.eq.${agentId}`)
    .eq("is_active", true)
    .order("matched_at", { ascending: false })

  const results = []
  for (const m of matches ?? []) {
    const otherId = m.agent_a_id === agentId ? m.agent_b_id : m.agent_a_id
    const { data: profile } = await db()
      .from("dating_profiles")
      .select("id, agent_id, display_name, intentions, profile_completeness, ladies_first, gender")
      .eq("agent_id", otherId)
      .maybeSingle()

    let photos: DatingProfilePhoto[] = []
    if (profile?.id) {
      photos = await getPhotosForProfile(profile.id)
    }

    results.push({
      ...m,
      other_agent_id: otherId,
      profile: profile ? { ...profile, photos, first_photo_id: photos[0]?.id ?? null } : null,
      can_send_message: !m.chat_initiator_agent_id || m.chat_started || m.chat_initiator_agent_id === agentId,
      waiting_for_her: m.chat_initiator_agent_id && !m.chat_started && m.chat_initiator_agent_id !== agentId,
    })
  }
  return results
}

export async function blockAgent(blockerId: string, blockedId: string) {
  await db().from("dating_blocks").upsert(
    { blocker_agent_id: blockerId, blocked_agent_id: blockedId },
    { onConflict: "blocker_agent_id,blocked_agent_id" },
  )

  const [a, b] = orderedPair(blockerId, blockedId)
  await db()
    .from("dating_matches")
    .update({ is_active: false })
    .eq("agent_a_id", a)
    .eq("agent_b_id", b)
}

export async function reportAgent(
  reporterId: string,
  reportedId: string,
  reason: string,
  details?: string,
) {
  await db().from("dating_reports").insert({
    reporter_agent_id: reporterId,
    reported_agent_id: reportedId,
    reason,
    details: details ?? null,
  })
}

export async function canViewDatingPhoto(
  viewerAgentId: string,
  profileAgentId: string,
): Promise<boolean> {
  if (viewerAgentId === profileAgentId) return true

  const viewerProfile = await getDatingProfile(viewerAgentId)
  if (!viewerProfile?.is_approved) return false

  const blocked = await getBlockedAgentIds(viewerAgentId)
  if (blocked.has(profileAgentId)) return false

  const [a, b] = orderedPair(viewerAgentId, profileAgentId)
  const { data: match } = await db()
    .from("dating_matches")
    .select("id")
    .eq("agent_a_id", a)
    .eq("agent_b_id", b)
    .eq("is_active", true)
    .maybeSingle()

  if (match) return true

  const sub = await getOrCreateSubscription(viewerAgentId)
  return sub.plan === "gold" || sub.plan === "silver"
}

export async function grantIntroCounselling(agentId: string) {
  const sub = await getOrCreateSubscription(agentId)
  if (sub.intro_counselling_claimed) return

  const scheduled = new Date()
  scheduled.setDate(scheduled.getDate() + 3)

  await db().from("dating_counselling_sessions").insert({
    agent_id: agentId,
    counsellor_name: "DataFlex Counselling Team",
    scheduled_at: scheduled.toISOString(),
    duration_minutes: 30,
    status: "pending",
    is_free: true,
    session_type: "intro",
  })

  await db()
    .from("dating_subscriptions")
    .update({ intro_counselling_claimed: true })
    .eq("agent_id", agentId)
}

export async function applyDatingPlanPurchase(
  agentId: string,
  plan: DatingPlan | "coins",
  reference: string,
) {
  const sub = await getOrCreateSubscription(agentId)
  const now = new Date()

  if (plan === "coins") {
    await db()
      .from("dating_subscriptions")
      .update({
        swipes_remaining: sub.swipes_remaining + 20,
        matches_remaining: sub.matches_remaining + 5,
        coins: (sub.coins ?? 0) + 1,
        paystack_reference: reference,
        updated_at: now.toISOString(),
      })
      .eq("agent_id", agentId)
    return
  }

  const limits = DATING_PLANS[plan]
  const expires = new Date(now)
  expires.setDate(expires.getDate() + 30)

  await db()
    .from("dating_subscriptions")
    .update({
      plan,
      swipes_remaining: limits.swipesPerDay === 999999 ? 999999 : limits.swipesPerDay,
      matches_remaining: limits.matchesPerDay,
      expires_at: expires.toISOString(),
      paystack_reference: reference,
      updated_at: now.toISOString(),
    })
    .eq("agent_id", agentId)

  if (plan === "gold") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const claimed = sub.monthly_counselling_claimed_at
    if (!claimed || claimed < monthStart) {
      const scheduled = new Date()
      scheduled.setDate(scheduled.getDate() + 5)
      await db().from("dating_counselling_sessions").insert({
        agent_id: agentId,
        counsellor_name: "DataFlex Gold Counsellor",
        scheduled_at: scheduled.toISOString(),
        duration_minutes: 30,
        status: "pending",
        is_free: true,
        session_type: "monthly",
      })
      await db()
        .from("dating_subscriptions")
        .update({ monthly_counselling_claimed_at: now.toISOString() })
        .eq("agent_id", agentId)
    }
  }
}

export function msUntilReset(resetAt: string | null): number {
  if (!resetAt) return 0
  return Math.max(0, new Date(resetAt).getTime() - Date.now())
}

export function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import {
  calculateProfileCompleteness,
  createDefaultSubscription,
  getDatingProfile,
  getOrCreateSubscription,
  grantIntroCounselling,
  profileToCompletenessInput,
  touchDatingStreak,
} from "@/lib/dating/dating-server"
import { countProfilePhotos, getPhotosForProfile } from "@/lib/dating/dating-photos"
import { DATING_INTENTIONS } from "@/lib/dating/constants"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

function parseStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.map(String).filter((s) => s.trim().length > 0)
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const profile = await getDatingProfile(agentId)
    let photos: Awaited<ReturnType<typeof getPhotosForProfile>> = []
    if (profile) {
      photos = await getPhotosForProfile(profile.id)
    }
    let subscription
    try {
      subscription = await touchDatingStreak(agentId)
    } catch (e) {
      console.error("[dating/profile GET] streak error:", e)
      subscription = createDefaultSubscription(agentId)
    }

    const db = getAdminClient()
    const { data: prefs } = await db
      .from("dating_preferences")
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      profile: profile ? { ...profile, photos } : null,
      preferences: prefs ?? null,
      subscription,
    })
  } catch (e) {
    console.error("[dating/profile GET]", e)
    return NextResponse.json({
      success: true,
      profile: null,
      preferences: null,
      subscription: createDefaultSubscription(agentId),
    })
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const intentions = String(body.intentions ?? "").trim()
    if (!DATING_INTENTIONS.includes(intentions as (typeof DATING_INTENTIONS)[number])) {
      return NextResponse.json({ error: "Valid intentions are required" }, { status: 400 })
    }
    const db = getAdminClient()
    const existing = await getDatingProfile(agentId)
    const saveDraft = Boolean(body.save_draft)

    if (!existing && !body.terms_accepted && !saveDraft) {
      return NextResponse.json({ error: "You must accept the Dating Terms" }, { status: 400 })
    }
    const photoCount = existing ? await countProfilePhotos(existing.id) : 0

    const payload = {
      agent_id: agentId,
      display_name: String(body.display_name ?? "").trim(),
      bio: body.bio ? String(body.bio).trim() : null,
      age: body.age ? Number(body.age) : null,
      gender: body.gender ? String(body.gender).trim() : null,
      interested_in: body.interested_in ? String(body.interested_in).trim() : null,
      relationship_status: body.relationship_status ? String(body.relationship_status).trim() : null,
      intentions,
      location: body.location ? String(body.location).trim() : null,
      occupation: body.occupation ? String(body.occupation).trim() : null,
      interests: parseStringArray(body.interests),
      height_cm: body.height_cm ? Number(body.height_cm) : null,
      education: body.education ? String(body.education).trim() : null,
      religion: body.religion ? String(body.religion).trim() : null,
      drinking: body.drinking ? String(body.drinking).trim() : null,
      smoking: body.smoking ? String(body.smoking).trim() : null,
      children: body.children ? String(body.children).trim() : null,
      languages: parseStringArray(body.languages),
      personality_traits: parseStringArray(body.personality_traits),
      weekly_availability: body.weekly_availability
        ? String(body.weekly_availability).trim()
        : null,
      ladies_first: Boolean(body.ladies_first),
      terms_accepted_at:
        body.terms_accepted || existing?.terms_accepted_at
          ? new Date().toISOString()
          : null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    if (!payload.display_name) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 })
    }

    const completeness = calculateProfileCompleteness(
      profileToCompletenessInput({ ...payload, intentions }, photoCount),
    )

    let profile
    if (existing) {
      const resubmitAfterReject = Boolean(existing.rejection_reason)
      const { data, error } = await db
        .from("dating_profiles")
        .update({
          ...payload,
          profile_completeness: completeness,
          ...(resubmitAfterReject
            ? {
                rejection_reason: null,
                rejected_at: null,
                is_approved: false,
              }
            : {}),
        })
        .eq("agent_id", agentId)
        .select("*")
        .single()
      if (error) throw error
      profile = data
    } else {
      const { data, error } = await db
        .from("dating_profiles")
        .insert({ ...payload, profile_completeness: completeness })
        .select("*")
        .single()
      if (error) throw error
      profile = data
      await grantIntroCounselling(agentId)
    }

    if (body.preferences) {
      const prefs = body.preferences
      await db.from("dating_preferences").upsert(
        {
          agent_id: agentId,
          min_age: prefs.min_age != null ? Number(prefs.min_age) : 18,
          max_age: prefs.max_age != null ? Number(prefs.max_age) : 60,
          preferred_genders: parseStringArray(prefs.preferred_genders),
          max_distance_km: prefs.max_distance_km != null ? Number(prefs.max_distance_km) : 100,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "agent_id" },
      )
    }

    const photos = await getPhotosForProfile(profile.id)
    const finalCompleteness = calculateProfileCompleteness(
      profileToCompletenessInput({ ...profile, intentions: profile.intentions }, photos.length),
    )
    if (finalCompleteness !== profile.profile_completeness) {
      await db
        .from("dating_profiles")
        .update({ profile_completeness: finalCompleteness })
        .eq("id", profile.id)
      profile.profile_completeness = finalCompleteness
    }

    await getOrCreateSubscription(agentId)
    return NextResponse.json({ success: true, profile: { ...profile, photos } })
  } catch (e) {
    console.error("[dating/profile POST]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save profile" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request)
}

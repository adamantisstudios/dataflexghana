import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { MIN_INFLUENCER_AUDIENCE, parseSocialHandles } from "@/lib/influencer-types"
import { getInfluencerProfileByAgentId } from "@/lib/influencer-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAgent(request)
    if (!auth.success) return createAuthErrorResponse(auth.error!)

    const sessionAgentId = getAuthAgentId(auth)
    if (!sessionAgentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const agentId = request.nextUrl.searchParams.get("agentId")?.trim() || sessionAgentId
    if (agentId !== sessionAgentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const profile = await getInfluencerProfileByAgentId(agentId)
    return NextResponse.json({ success: true, profile })
  } catch (e) {
    console.error("[agent influencer profile GET]", e)
    return NextResponse.json(
      { success: true, profile: null, error: "Influencer service temporarily unavailable" },
      { status: 200 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  try {
    const body = await request.json()
    const sessionAgentId = getAuthAgentId(auth)
    if (!sessionAgentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const agentId = String(body.agentId ?? sessionAgentId).trim()
    if (agentId !== sessionAgentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const bio = String(body.bio ?? "").trim()
    const photo_url = body.photo_url ? String(body.photo_url).trim() : null
    const niche = body.niche ? String(body.niche).trim() : null
    const audience_size = Number(body.audience_size)
    const social_handles = parseSocialHandles(body.social_handles)
    const termsAccepted = Boolean(body.terms_accepted)

    if (!termsAccepted) {
      return NextResponse.json({ error: "You must accept the Influencer Terms" }, { status: 400 })
    }
    if (!Number.isFinite(audience_size) || audience_size < MIN_INFLUENCER_AUDIENCE) {
      return NextResponse.json(
        { error: `Audience size must be at least ${MIN_INFLUENCER_AUDIENCE.toLocaleString()}` },
        { status: 400 },
      )
    }
    if (!bio) {
      return NextResponse.json({ error: "Bio is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const existing = await getInfluencerProfileByAgentId(agentId)

    if (existing?.approved) {
      const { data, error } = await db
        .from("influencer_profiles")
        .update({ bio, photo_url, social_handles, audience_size, niche })
        .eq("agent_id", agentId)
        .select("*")
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({
        success: true,
        profile: { ...data, social_handles: parseSocialHandles(data.social_handles) },
      })
    }

    if (existing && !existing.approved) {
      const { data, error } = await db
        .from("influencer_profiles")
        .update({
          bio,
          photo_url,
          social_handles,
          audience_size,
          niche,
          approved: false,
        })
        .eq("agent_id", agentId)
        .select("*")
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({
        success: true,
        profile: { ...data, social_handles: parseSocialHandles(data.social_handles) },
        message: "Application updated. Awaiting admin approval.",
      })
    }

    const { data, error } = await db
      .from("influencer_profiles")
      .insert({
        agent_id: agentId,
        bio,
        photo_url,
        social_handles,
        audience_size,
        niche,
        approved: false,
      })
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: { ...data, social_handles: parseSocialHandles(data.social_handles) },
      message: "Application submitted. Awaiting admin approval.",
    })
  } catch (e) {
    console.error("[agent influencer profile POST]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

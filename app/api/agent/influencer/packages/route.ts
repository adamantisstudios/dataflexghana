import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { getInfluencerProfileByAgentId, getPackagesForProfile } from "@/lib/influencer-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const agentId = request.nextUrl.searchParams.get("agentId")?.trim() || auth.agent!.id
  if (agentId !== auth.agent!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const profile = await getInfluencerProfileByAgentId(agentId)
  if (!profile) {
    return NextResponse.json({ success: true, packages: [], approved: false })
  }

  const packages = await getPackagesForProfile(profile.id)
  return NextResponse.json({ success: true, packages, approved: profile.approved, profile_id: profile.id })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  try {
    const body = await request.json()
    const agentId = String(body.agentId ?? auth.agent!.id).trim()
    if (agentId !== auth.agent!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const profile = await getInfluencerProfileByAgentId(agentId)
    if (!profile?.approved) {
      return NextResponse.json({ error: "Your influencer profile must be approved first" }, { status: 403 })
    }

    const title = String(body.title ?? "").trim()
    const description = body.description ? String(body.description).trim() : null
    const price = Number(body.price)
    const delivery_days = Number(body.delivery_days ?? 7)
    const terms = body.terms ? String(body.terms).trim() : null

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("influencer_packages")
      .insert({
        profile_id: profile.id,
        title,
        description,
        price,
        delivery_days: Number.isFinite(delivery_days) && delivery_days > 0 ? delivery_days : 7,
        terms,
        is_active: true,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, package: data })
  } catch (e) {
    console.error("[agent influencer packages POST]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

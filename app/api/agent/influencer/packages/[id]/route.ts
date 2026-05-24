import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { getInfluencerProfileByAgentId } from "@/lib/influencer-server"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const { id } = await params
  try {
    const body = await request.json()
    const agentId = String(body.agentId ?? auth.agent!.id).trim()
    if (agentId !== auth.agent!.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const profile = await getInfluencerProfileByAgentId(agentId)
    if (!profile?.approved) {
      return NextResponse.json({ error: "Profile not approved" }, { status: 403 })
    }

    const db = getAdminClient()
    const { data: pkg } = await db
      .from("influencer_packages")
      .select("profile_id")
      .eq("id", id)
      .maybeSingle()

    if (!pkg || pkg.profile_id !== profile.id) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active
    if (body.title !== undefined) updates.title = String(body.title).trim()
    if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null
    if (body.price !== undefined) updates.price = Number(body.price)
    if (body.delivery_days !== undefined) updates.delivery_days = Number(body.delivery_days)
    if (body.terms !== undefined) updates.terms = body.terms ? String(body.terms).trim() : null

    const { data, error } = await db
      .from("influencer_packages")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, package: data })
  } catch (e) {
    console.error("[agent influencer package PATCH]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

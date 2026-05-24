import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const db = getAdminClient()
  const { data, error } = await db
    .from("influencer_packages")
    .select(
      `
      *,
      profile:influencer_profiles(id, agent_id, niche, approved)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const agentIds = [...new Set((data || []).map((p) => p.profile?.agent_id).filter(Boolean))]
  const { data: agents } = await db
    .from("agents")
    .select("id, full_name")
    .in("id", agentIds.length ? agentIds : ["00000000-0000-0000-0000-000000000000"])

  const agentMap = new Map((agents || []).map((a) => [a.id, a.full_name]))

  const packages = (data || []).map((p) => ({
    ...p,
    price: Number(p.price),
    agent_name: p.profile?.agent_id ? agentMap.get(p.profile.agent_id) ?? "" : "",
  }))

  return NextResponse.json({ success: true, packages })
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const id = String(body.id ?? "").trim()
    if (!id || typeof body.is_active !== "boolean") {
      return NextResponse.json({ error: "id and is_active required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("influencer_packages")
      .update({ is_active: body.is_active })
      .eq("id", id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, package: data })
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

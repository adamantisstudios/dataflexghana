import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { parseSocialHandles } from "@/lib/influencer-types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() || ""
  const status = request.nextUrl.searchParams.get("status")?.trim() // approved | pending | rejected

  const db = getAdminClient()
  const { data: profiles, error } = await db
    .from("influencer_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const agentIds = [...new Set((profiles || []).map((p) => p.agent_id))]
  const { data: agents } = await db
    .from("agents")
    .select("id, full_name, phone_number, email")
    .in("id", agentIds.length ? agentIds : ["00000000-0000-0000-0000-000000000000"])

  const agentMap = new Map((agents || []).map((a) => [a.id, a]))

  let rows = (profiles || []).map((p) => {
    const agent = agentMap.get(p.agent_id)
    return {
      ...p,
      social_handles: parseSocialHandles(p.social_handles),
      audience_size: Number(p.audience_size),
      approved: Boolean(p.approved),
      agent_name: agent?.full_name ?? "Unknown",
      agent_phone: agent?.phone_number ?? "",
      agent_email: agent?.email ?? "",
    }
  })

  if (status === "approved") rows = rows.filter((r) => r.approved)
  else if (status === "pending") rows = rows.filter((r) => !r.approved)

  if (q) {
    rows = rows.filter(
      (r) =>
        r.agent_name.toLowerCase().includes(q) ||
        (r.agent_phone || "").includes(q) ||
        (r.niche || "").toLowerCase().includes(q),
    )
  }

  return NextResponse.json({ success: true, profiles: rows })
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const id = String(body.id ?? "").trim()
    const approved = body.approved

    if (!id || typeof approved !== "boolean") {
      return NextResponse.json({ error: "id and approved (boolean) required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("influencer_profiles")
      .update({ approved })
      .eq("id", id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, profile: data })
  } catch (e) {
    console.error("[admin influencers profiles PATCH]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

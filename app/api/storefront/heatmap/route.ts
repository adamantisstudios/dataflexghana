import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { getAgentListingFeatures } from "@/lib/listing-packages-server"

export const dynamic = "force-dynamic"

function snapTo5(value: number): number {
  const clamped = Math.max(0, Math.min(100, value))
  return Math.round(clamped / 5) * 5
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const agentId = String(body.agentId ?? "").trim()
    const x = Number(body.x)
    const y = Number(body.y)
    if (!agentId || !Number.isFinite(x) || !Number.isFinite(y)) {
      return NextResponse.json({ error: "agentId, x, y are required" }, { status: 400 })
    }

    const features = await getAgentListingFeatures(agentId)
    if (!features.heatmap) {
      return NextResponse.json({ success: true, ignored: true })
    }

    const sx = snapTo5(x)
    const sy = snapTo5(y)
    const date = new Date().toISOString().slice(0, 10)
    const db = getAdminClient()

    const { data: existing } = await db
      .from("storefront_heatmap")
      .select("id, clicks")
      .eq("agent_id", agentId)
      .eq("x", sx)
      .eq("y", sy)
      .eq("date", date)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await db
        .from("storefront_heatmap")
        .update({ clicks: Number(existing.clicks ?? 0) + 1 })
        .eq("id", existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    const { error } = await db.from("storefront_heatmap").insert({
      agent_id: agentId,
      x: sx,
      y: sy,
      clicks: 1,
      date,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[storefront heatmap POST]", error)
    return NextResponse.json({ error: "Failed to record heatmap click" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId")?.trim()
    if (!agentId) return NextResponse.json({ error: "agentId is required" }, { status: 400 })

    const features = await getAgentListingFeatures(agentId)
    if (!features.heatmap) {
      return NextResponse.json({ success: true, cells: [] })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("storefront_heatmap")
      .select("x,y,clicks")
      .eq("agent_id", agentId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const map = new Map<string, { x: number; y: number; clicks: number }>()
    for (const row of data || []) {
      const x = Number(row.x)
      const y = Number(row.y)
      const clicks = Number(row.clicks ?? 0)
      const key = `${x}-${y}`
      const prev = map.get(key)
      if (prev) prev.clicks += clicks
      else map.set(key, { x, y, clicks })
    }

    return NextResponse.json({ success: true, cells: Array.from(map.values()) })
  } catch (error) {
    console.error("[storefront heatmap GET]", error)
    return NextResponse.json({ error: "Failed to load heatmap data" }, { status: 500 })
  }
}

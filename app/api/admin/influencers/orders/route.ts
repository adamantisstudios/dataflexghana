import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { INFLUENCER_ORDER_STATUSES, type InfluencerOrderStatus } from "@/lib/influencer-types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const status = request.nextUrl.searchParams.get("status")?.trim()

  const db = getAdminClient()
  let q = db
    .from("influencer_orders")
    .select(
      `
      *,
      package:influencer_packages(id, title, price)
    `,
    )
    .order("created_at", { ascending: false })

  if (status && INFLUENCER_ORDER_STATUSES.includes(status as InfluencerOrderStatus)) {
    q = q.eq("status", status)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const agentIds = [...new Set((data || []).map((o) => o.agent_id))]
  const { data: agents } = await db
    .from("agents")
    .select("id, full_name, phone_number")
    .in("id", agentIds.length ? agentIds : ["00000000-0000-0000-0000-000000000000"])

  const agentMap = new Map((agents || []).map((a) => [a.id, a]))

  const orders = (data || []).map((o) => {
    const agent = agentMap.get(o.agent_id)
    const packagePrice =
      Number(o.total_price) -
      Number(o.platform_fee_client)
    return {
      ...o,
      total_price: Number(o.total_price),
      platform_fee_client: Number(o.platform_fee_client),
      platform_fee_influencer: Number(o.platform_fee_influencer),
      influencer_payout: Number(o.influencer_payout),
      package_price: Math.round(packagePrice * 100) / 100,
      influencer_name: agent?.full_name ?? "",
      influencer_phone: agent?.phone_number ?? "",
      escrow_released: Boolean(o.escrow_released),
    }
  })

  return NextResponse.json({ success: true, orders })
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const id = String(body.id ?? "").trim()
    const status = body.status ? String(body.status).trim() : null
    const release_escrow = Boolean(body.release_escrow)

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (status) {
      if (!INFLUENCER_ORDER_STATUSES.includes(status as InfluencerOrderStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      updates.status = status
    }
    if (release_escrow) {
      updates.escrow_released = true
      if (!updates.status) updates.status = "completed"
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("influencer_orders")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, order: data })
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

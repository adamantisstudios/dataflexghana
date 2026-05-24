import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { getInfluencerProfileByAgentId } from "@/lib/influencer-server"
import type { InfluencerOrderStatus } from "@/lib/influencer-types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const agentId = request.nextUrl.searchParams.get("agentId")?.trim() || auth.agent!.id
  if (agentId !== auth.agent!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const profile = await getInfluencerProfileByAgentId(agentId)
  if (!profile?.approved) {
    return NextResponse.json({ success: true, orders: [], approved: false })
  }

  const db = getAdminClient()
  const { data: orders, error } = await db
    .from("influencer_orders")
    .select(
      `
      *,
      package:influencer_packages(id, title, price, delivery_days)
    `,
    )
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (orders || []).map((o) => ({
    ...o,
    total_price: Number(o.total_price),
    platform_fee_client: Number(o.platform_fee_client),
    platform_fee_influencer: Number(o.platform_fee_influencer),
    influencer_payout: Number(o.influencer_payout),
    status: o.status as InfluencerOrderStatus,
  }))

  return NextResponse.json({ success: true, orders: rows, approved: true })
}

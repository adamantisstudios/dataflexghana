import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { getInfluencerProfileByAgentId } from "@/lib/influencer-server"
import type { InfluencerOrderStatus } from "@/lib/influencer-types"

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
    if (!profile?.approved) {
      return NextResponse.json({ success: true, orders: [], approved: false })
    }

    const db = getAdminClient()
    const { data: orders, error } = await db
      .from("influencer_orders")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const packageIds = [...new Set((orders || []).map((o) => o.package_id).filter(Boolean))]
    let packageMap = new Map<string, { id: string; title: string; price: number; delivery_days: number }>()
    if (packageIds.length > 0) {
      const { data: pkgs } = await db
        .from("influencer_packages")
        .select("id, title, price, delivery_days")
        .in("id", packageIds)
      packageMap = new Map((pkgs || []).map((p) => [p.id, p]))
    }

    const rows = (orders || []).map((o) => ({
      ...o,
      total_price: Number(o.total_price),
      platform_fee_client: Number(o.platform_fee_client),
      platform_fee_influencer: Number(o.platform_fee_influencer),
      influencer_payout: Number(o.influencer_payout),
      status: o.status as InfluencerOrderStatus,
      package: o.package_id ? packageMap.get(o.package_id) ?? null : null,
    }))

    return NextResponse.json({ success: true, orders: rows, approved: true })
  } catch (e) {
    console.error("[agent influencer orders GET]", e)
    return NextResponse.json({ success: true, orders: [], approved: false })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"
import { isStorefrontWithdrawal } from "@/lib/storefront-payout"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const search = (searchParams.get("search") || "").trim()
    const positiveOnly = searchParams.get("positiveOnly") !== "false"
    const requestedOnly = searchParams.get("requestedOnly") !== "false"
    const offset = (page - 1) * limit

    const db = getAdminClient()

    let requestedAgentIds: string[] | null = null
    const withdrawalByAgent = new Map<
      string,
      { id: string; amount: number; status: string; requested_at: string | null; momo_number: string | null }
    >()

    if (requestedOnly) {
      let { data: withdrawals, error: withdrawalError } = await db
        .from("withdrawals")
        .select("id, agent_id, amount, status, requested_at, momo_number, source, admin_notes")
        .in("status", ["requested", "pending", "processing"])

      if (withdrawalError?.message?.includes("source")) {
        const retry = await db
          .from("withdrawals")
          .select("id, agent_id, amount, status, requested_at, momo_number, admin_notes")
          .in("status", ["requested", "pending", "processing"])
          .ilike("admin_notes", "%source:storefront%")
        withdrawals = retry.data
        withdrawalError = retry.error
      }

      if (withdrawalError) {
        return NextResponse.json({ error: withdrawalError.message }, { status: 500 })
      }

      withdrawals = (withdrawals || []).filter((w) =>
        isStorefrontWithdrawal(w as { source?: string | null; admin_notes?: string | null }),
      )

      requestedAgentIds = [...new Set((withdrawals || []).map((w) => w.agent_id).filter(Boolean))]
      for (const w of withdrawals || []) {
        if (!w.agent_id || withdrawalByAgent.has(w.agent_id)) continue
        withdrawalByAgent.set(w.agent_id, {
          id: w.id,
          amount: Number(w.amount ?? 0),
          status: w.status,
          requested_at: w.requested_at ?? null,
          momo_number: w.momo_number ?? null,
        })
      }

      if (requestedAgentIds.length === 0) {
        return NextResponse.json({
          success: true,
          profiles: [],
          page,
          limit,
          total: 0,
          totalPages: 1,
        })
      }
    }

    let profileQuery = db
      .from("agent_store_profiles")
      .select("agent_id, store_name, storefront_commission_balance", { count: "exact" })

    if (requestedAgentIds) {
      profileQuery = profileQuery.in("agent_id", requestedAgentIds)
    }

    if (positiveOnly) {
      profileQuery = profileQuery.gt("storefront_commission_balance", 0)
    }

    if (search) {
      const { data: matchingAgents } = await db
        .from("agents")
        .select("id")
        .or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%`)

      const ids = (matchingAgents || []).map((a) => a.id)
      if (ids.length === 0) {
        return NextResponse.json({
          success: true,
          profiles: [],
          page,
          limit,
          total: 0,
          totalPages: 1,
        })
      }
      profileQuery = profileQuery.in("agent_id", ids)
    }

    profileQuery = profileQuery.order("storefront_commission_balance", { ascending: false }).range(offset, offset + limit - 1)

    const { data: profiles, error: profileError, count } = await profileQuery

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const agentIds = (profiles || []).map((p) => p.agent_id)
    let agentsMap = new Map<string, { full_name: string; phone_number: string }>()
    const lastOrderByAgent = new Map<string, string>()

    if (agentIds.length > 0) {
      const { data: agents } = await db.from("agents").select("id, full_name, phone_number").in("id", agentIds)
      for (const a of agents || []) {
        agentsMap.set(a.id, a)
      }

      const { data: recentOrders } = await db
        .from("storefront_orders")
        .select("agent_id, created_at")
        .in("agent_id", agentIds)
        .order("created_at", { ascending: false })

      for (const o of recentOrders || []) {
        if (!lastOrderByAgent.has(o.agent_id)) {
          lastOrderByAgent.set(o.agent_id, o.created_at)
        }
      }
    }

    const merged = (profiles || []).map((p) => {
      const a = agentsMap.get(p.agent_id)
      return {
        agent_id: p.agent_id,
        store_name: p.store_name,
        storefront_commission_balance: Number(p.storefront_commission_balance ?? 0),
        agent_name: a?.full_name ?? "Unknown",
        phone_number: withdrawalByAgent.get(p.agent_id)?.momo_number || a?.phone_number || "",
        last_order_date: lastOrderByAgent.get(p.agent_id) ?? null,
        payout_request: withdrawalByAgent.get(p.agent_id) ?? null,
      }
    })

    const total = count ?? 0

    return NextResponse.json({
      success: true,
      profiles: merged,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error("cashout-profiles GET:", error)
    return NextResponse.json({ error: "Failed to load profiles" }, { status: 500 })
  }
}

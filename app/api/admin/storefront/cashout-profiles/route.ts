import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"

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
    const offset = (page - 1) * limit

    const db = getAdminClient()

    let profileQuery = db
      .from("agent_store_profiles")
      .select("agent_id, store_name, storefront_commission_balance", { count: "exact" })

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

    if (agentIds.length > 0) {
      const { data: agents } = await db.from("agents").select("id, full_name, phone_number").in("id", agentIds)
      for (const a of agents || []) {
        agentsMap.set(a.id, a)
      }
    }

    const merged = (profiles || []).map((p) => {
      const a = agentsMap.get(p.agent_id)
      return {
        agent_id: p.agent_id,
        store_name: p.store_name,
        storefront_commission_balance: Number(p.storefront_commission_balance ?? 0),
        agent_name: a?.full_name ?? "Unknown",
        phone_number: a?.phone_number ?? "",
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

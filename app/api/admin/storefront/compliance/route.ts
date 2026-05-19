import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const status = request.nextUrl.searchParams.get("status") || "all"
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10))
    const limit = Math.min(50, parseInt(request.nextUrl.searchParams.get("limit") || "20", 10))
    const offset = (page - 1) * limit

    const db = getAdminClient()
    let query = db
      .from("storefront_compliance_submissions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })

    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const agentIds = [...new Set((data || []).map((r) => r.agent_id))]
    const agentMap = new Map<string, { full_name: string; phone_number: string }>()

    if (agentIds.length) {
      const { data: agents } = await db
        .from("agents")
        .select("id, full_name, phone_number")
        .in("id", agentIds)
      for (const a of agents || []) {
        agentMap.set(a.id, { full_name: a.full_name, phone_number: a.phone_number })
      }
    }

    const submissions = (data || []).map((row) => ({
      ...row,
      agent: agentMap.get(row.agent_id) ?? null,
    }))

    const total = count ?? 0
    return NextResponse.json({
      submissions,
      page,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error("admin storefront compliance GET:", error)
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { id, status } = await request.json()
    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 })
    }

    const allowed = ["pending", "processing", "completed", "rejected"]
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("storefront_compliance_submissions")
      .update({ status })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, submission: data })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

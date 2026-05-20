import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

const STATUS_SORT: Record<string, number> = {
  pending: 0,
  processing: 1,
  completed: 2,
  rejected: 3,
}

function sortSubmissions<T extends { status: string; created_at: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const sa = STATUS_SORT[a.status] ?? 99
    const sb = STATUS_SORT[b.status] ?? 99
    if (sa !== sb) return sa - sb
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const status = request.nextUrl.searchParams.get("status") || "all"
    const search = (request.nextUrl.searchParams.get("search") || "").trim()
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "20", 10)))

    const db = getAdminClient()
    let query = db.from("storefront_compliance_submissions").select("*")

    if (status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      const { data: matchingAgents } = await db
        .from("agents")
        .select("id")
        .or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%`)
      const agentIds = (matchingAgents || []).map((a) => a.id)
      const orParts = [`form_type.ilike.%${search}%`]
      if (agentIds.length > 0) {
        orParts.push(`agent_id.in.(${agentIds.join(",")})`)
      }
      query = query.or(orParts.join(","))
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const sorted = sortSubmissions(data || [])
    const total = sorted.length
    const offset = (page - 1) * limit
    const pageRows = sorted.slice(offset, offset + limit)

    const agentIds = [...new Set(pageRows.map((r) => r.agent_id))]
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

    const submissions = pageRows.map((row) => ({
      ...row,
      agent: agentMap.get(row.agent_id) ?? null,
    }))

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

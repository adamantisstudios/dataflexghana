import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin, requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

const STATUS_SORT: Record<string, number> = {
  pending: 0,
  processing: 1,
  completed: 2,
  cancelled: 3,
  canceled: 3,
  rejected: 4,
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

    const allowed = ["pending", "processing", "completed", "cancelled", "canceled", "rejected"]
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

export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    let id = request.nextUrl.searchParams.get("id")?.trim()
    if (!id) {
      try {
        const body = await request.json()
        if (body?.id) id = String(body.id).trim()
      } catch {
        // ignore
      }
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: existing, error: fetchError } = await db
      .from("storefront_compliance_submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 })
    }

    const { error: deleteError } = await db.from("storefront_compliance_submissions").delete().eq("id", id)

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_deleted_storefront_compliance_submission",
      targetTable: "storefront_compliance_submissions",
      targetId: id,
      oldData: existing as Record<string, unknown>,
      newData: null,
    })

    return NextResponse.json({ success: true, id })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    )
  }
}

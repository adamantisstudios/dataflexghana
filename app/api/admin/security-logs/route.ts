import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

const VALID_SEVERITIES = new Set(["info", "warning", "critical"])

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)))
    const severity = (searchParams.get("severity") || "all").trim().toLowerCase()
    const actionSearch = (searchParams.get("action") || "").trim()
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const offset = (page - 1) * limit

    const db = getAdminClient()
    let query = db
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })

    if (severity !== "all" && VALID_SEVERITIES.has(severity)) {
      query = query.eq("severity", severity)
    }

    if (actionSearch) {
      query = query.ilike("action", `%${actionSearch.replace(/%/g, "")}%`)
    }

    if (from) {
      query = query.gte("created_at", from)
    }
    if (to) {
      query = query.lte("created_at", to)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("[security-logs] query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const logs = (data || []).map((row) => {
      const newData = (row.new_data ?? {}) as Record<string, unknown>
      const session = newData.session ?? null
      const { session: _s, ...detailsWithoutSession } = newData
      const hasOtherDetails = Object.keys(detailsWithoutSession).length > 0

      return {
        id: row.id,
        actor_id: row.actor_id,
        actor_type: row.actor_type,
        action: row.action,
        severity: row.severity ?? "info",
        target_table: row.target_table,
        target_id: row.target_id,
        session,
        details: hasOtherDetails ? detailsWithoutSession : row.old_data ?? null,
        old_data: row.old_data,
        new_data: row.new_data,
        ip_masked: row.ip_address,
        created_at: row.created_at,
      }
    })

    const total = count ?? 0

    return NextResponse.json({
      success: true,
      logs,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (err) {
    console.error("[security-logs] GET:", err)
    return NextResponse.json({ error: "Failed to load security logs" }, { status: 500 })
  }
}

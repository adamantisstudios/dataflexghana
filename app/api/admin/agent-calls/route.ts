import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

const CALL_STATUSES = ["completed", "no_answer", "voicemail", "scheduled"] as const
const PAGE_SIZE = 50

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&")
}

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agent_id")?.trim() || ""
    const status = searchParams.get("status")?.trim() || ""
    const search = searchParams.get("search")?.trim() || ""
    const followUp = searchParams.get("follow_up") === "true"
    const followUpDate = searchParams.get("follow_up_date")?.trim() || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10), 100)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const db = getAdminClient()

    let agentIdsFilter: string[] | null = null
    if (search.length >= 2) {
      const pattern = `%${escapeIlike(search)}%`
      const { data: matchedAgents } = await db
        .from("agents")
        .select("id")
        .or(`full_name.ilike.${pattern},phone_number.ilike.${pattern}`)
        .limit(200)
      agentIdsFilter = (matchedAgents || []).map((a) => a.id)
      if (agentIdsFilter.length === 0) {
        return NextResponse.json({
          success: true,
          logs: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
    }

    let query = db
      .from("agent_call_logs")
      .select("*", { count: "exact" })
      .order("call_date", { ascending: false })
      .range(from, to)

    if (agentId) query = query.eq("agent_id", agentId)
    if (status && CALL_STATUSES.includes(status as (typeof CALL_STATUSES)[number])) {
      query = query.eq("call_status", status)
    }
    if (followUp) query = query.eq("follow_up_required", true)
    if (followUpDate) query = query.eq("follow_up_date", followUpDate)
    if (agentIdsFilter) query = query.in("agent_id", agentIdsFilter)

    const { data: logs, error, count } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const agentIds = [...new Set((logs || []).map((l) => l.agent_id).filter(Boolean))]
    const { data: agents } = await db
      .from("agents")
      .select("id, full_name, phone_number")
      .in("id", agentIds.length ? agentIds : ["00000000-0000-0000-0000-000000000000"])

    const agentMap = new Map((agents || []).map((a) => [a.id, a]))

    const rows = (logs || []).map((log) => {
      const agent = log.agent_id ? agentMap.get(log.agent_id) : null
      return {
        ...log,
        agent_name: agent?.full_name ?? "Unknown",
        agent_phone: agent?.phone_number ?? "",
      }
    })

    const total = count ?? 0
    return NextResponse.json({
      success: true,
      logs: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error("[admin/agent-calls GET]", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load call logs" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const agent_id = String(body.agent_id ?? "").trim()
    const call_status = String(body.call_status ?? "completed").trim()
    const discussion_notes = body.discussion_notes ? String(body.discussion_notes).trim() : null
    const follow_up_required = Boolean(body.follow_up_required)
    const follow_up_date = body.follow_up_date ? String(body.follow_up_date).trim() : null
    const call_duration_minutes =
      body.call_duration_minutes != null && body.call_duration_minutes !== ""
        ? parseInt(String(body.call_duration_minutes), 10)
        : null
    const call_date = body.call_date ? String(body.call_date).trim() : new Date().toISOString()

    if (!agent_id) {
      return NextResponse.json({ error: "agent_id is required" }, { status: 400 })
    }
    if (!CALL_STATUSES.includes(call_status as (typeof CALL_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid call status" }, { status: 400 })
    }
    if (follow_up_required && !follow_up_date) {
      return NextResponse.json({ error: "Follow-up date is required when follow-up is checked" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("agent_call_logs")
      .insert({
        agent_id,
        call_date,
        call_duration_minutes: Number.isFinite(call_duration_minutes) ? call_duration_minutes : null,
        discussion_notes,
        follow_up_required,
        follow_up_date: follow_up_required ? follow_up_date : null,
        call_status,
        admin_id: session.admin?.id ?? null,
      })
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, log: data })
  } catch (e) {
    console.error("[admin/agent-calls POST]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

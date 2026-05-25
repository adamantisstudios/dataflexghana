import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

const CALL_STATUSES = ["completed", "no_answer", "voicemail", "scheduled"] as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { id } = await params
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.call_date != null) updates.call_date = String(body.call_date)
    if (body.call_duration_minutes !== undefined) {
      const n = parseInt(String(body.call_duration_minutes), 10)
      updates.call_duration_minutes = Number.isFinite(n) ? n : null
    }
    if (body.discussion_notes !== undefined) {
      updates.discussion_notes = body.discussion_notes ? String(body.discussion_notes).trim() : null
    }
    if (body.follow_up_required !== undefined) {
      updates.follow_up_required = Boolean(body.follow_up_required)
    }
    if (body.follow_up_date !== undefined) {
      updates.follow_up_date = body.follow_up_date ? String(body.follow_up_date).trim() : null
    }
    if (body.call_status != null) {
      const status = String(body.call_status).trim()
      if (!CALL_STATUSES.includes(status as (typeof CALL_STATUSES)[number])) {
        return NextResponse.json({ error: "Invalid call status" }, { status: 400 })
      }
      updates.call_status = status
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("agent_call_logs")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, log: data })
  } catch (e) {
    console.error("[admin/agent-calls PATCH]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { id } = await params
    const db = getAdminClient()
    const { error } = await db.from("agent_call_logs").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[admin/agent-calls DELETE]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

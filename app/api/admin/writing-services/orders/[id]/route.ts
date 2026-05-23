import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { mapWritingOrderRow } from "@/lib/writing-server"
import { isWritingOrderStatus } from "@/lib/writing-types"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const { id } = await context.params

  try {
    const body = await request.json()
    const db = getAdminClient()

    const { data: existing, error: fetchErr } = await db
      .from("writing_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}

    if (body.status !== undefined) {
      const status = String(body.status)
      if (!isWritingOrderStatus(status)) {
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
      }
      if (status === "completed" && !existing.completed_file_url && !body.completed_file_url) {
        return NextResponse.json(
          { success: false, error: "Upload the completed PDF before marking as Completed" },
          { status: 400 },
        )
      }
      updates.status = status
    }

    if (body.admin_notes !== undefined) {
      updates.admin_notes = body.admin_notes ? String(body.admin_notes).trim() : null
    }

    if (body.completed_file_url !== undefined) {
      updates.completed_file_url = body.completed_file_url ? String(body.completed_file_url).trim() : null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await db
      .from("writing_orders")
      .update(updates)
      .eq("id", id)
      .select("*, writing_services(*), agents(full_name, phone_number)")
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_updated_writing_order",
      targetTable: "writing_orders",
      targetId: id,
      oldData: existing as Record<string, unknown>,
      newData: data as Record<string, unknown>,
    })

    return NextResponse.json({
      success: true,
      data: mapWritingOrderRow(data as Record<string, unknown>),
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { mapWritingServiceRow } from "@/lib/writing-server"
import { isWritingCategory } from "@/lib/writing-types"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const { id } = await context.params

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.service_name !== undefined) updates.service_name = String(body.service_name).trim()
    if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null
    if (body.price !== undefined) {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ success: false, error: "Invalid price" }, { status: 400 })
      }
      updates.price = price
    }
    if (body.agent_commission !== undefined) updates.agent_commission = Number(body.agent_commission ?? 0)
    if (body.turnaround_time !== undefined) updates.turnaround_time = String(body.turnaround_time).trim()
    if (body.category !== undefined) {
      const category = String(body.category)
      if (!isWritingCategory(category)) {
        return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 })
      }
      updates.category = category
    }
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data, error } = await db.from("writing_services").update(updates).eq("id", id).select("*").single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_updated_writing_service",
      targetTable: "writing_services",
      targetId: id,
      newData: data as Record<string, unknown>,
    })

    return NextResponse.json({
      success: true,
      data: mapWritingServiceRow(data as Record<string, unknown>),
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const { id } = await context.params

  try {
    const db = getAdminClient()
    const { error } = await db.from("writing_services").delete().eq("id", id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_deleted_writing_service",
      targetTable: "writing_services",
      targetId: id,
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

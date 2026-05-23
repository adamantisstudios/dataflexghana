import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { creditAdOrderCommissionIfNeeded } from "@/lib/advertising-server"
import { isAdOrderStatus } from "@/lib/advertising-types"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const { id } = await context.params

  try {
    const body = await request.json()
    const db = getAdminClient()

    const { data: existing, error: fetchError } = await db
      .from("ad_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    if (!existing) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })

    const updates: Record<string, unknown> = {}
    const previousStatus = String(existing.status)

    if (body.status !== undefined) {
      const status = String(body.status)
      if (!isAdOrderStatus(status)) {
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
      }
      updates.status = status
    }

    if (body.admin_notes !== undefined) {
      updates.admin_notes = body.admin_notes ? String(body.admin_notes).trim() : null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await db.from("ad_orders").update(updates).eq("id", id).select("*").single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    let commissionCredited = 0
    if (updates.status === "completed") {
      const credit = await creditAdOrderCommissionIfNeeded(id, previousStatus, "completed")
      commissionCredited = credit.credited
    }

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_updated_ad_order",
      targetTable: "ad_orders",
      targetId: id,
      oldData: existing as Record<string, unknown>,
      newData: { ...(data as Record<string, unknown>), commission_credited: commissionCredited },
    })

    return NextResponse.json({
      success: true,
      data,
      commission_credited: commissionCredited,
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
    const { data: existing, error: fetchError } = await db
      .from("ad_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    if (!existing) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })

    const { error } = await db.from("ad_orders").delete().eq("id", id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_deleted_ad_order",
      targetTable: "ad_orders",
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

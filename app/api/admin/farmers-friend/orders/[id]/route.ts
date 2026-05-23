import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { creditFarmOrderCommissionIfNeeded, mapFarmOrderRow } from "@/lib/farm-server"
import { isFarmOrderStatus } from "@/lib/farm-types"

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
      .from("farm_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}
    const previousStatus = String(existing.status)

    if (body.status !== undefined) {
      const status = String(body.status)
      if (!isFarmOrderStatus(status)) {
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
      }
      updates.status = status
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await db.from("farm_orders").update(updates).eq("id", id).select("*").single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    let commission_credited = 0
    if (updates.status === "delivered") {
      const credit = await creditFarmOrderCommissionIfNeeded(id, previousStatus, "delivered")
      commission_credited = credit.credited
    }

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_updated_farm_order",
      targetTable: "farm_orders",
      targetId: id,
      newData: { status: updates.status, commission_credited },
    })

    return NextResponse.json({
      success: true,
      data: mapFarmOrderRow(data as Record<string, unknown>),
      commission_credited,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    )
  }
}

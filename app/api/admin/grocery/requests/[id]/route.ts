import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { GROCERY_STATUSES } from "@/lib/grocery-types"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  const { id } = await context.params

  try {
    const db = getAdminClient()
    const { data, error } = await db.from("grocery_requests").select("*").eq("id", id).maybeSingle()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load request" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const { id } = await context.params

  try {
    const body = await request.json()
    const db = getAdminClient()

    const { data: existing, error: fetchError } = await db
      .from("grocery_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}

    if (body.status !== undefined) {
      const status = String(body.status)
      if (!GROCERY_STATUSES.includes(status as (typeof GROCERY_STATUSES)[number])) {
        return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
      }
      updates.status = status
    }

    if (body.estimated_price !== undefined) {
      updates.estimated_price =
        body.estimated_price === null || body.estimated_price === ""
          ? null
          : Number(body.estimated_price)
    }

    if (body.delivery_fee !== undefined) {
      updates.delivery_fee =
        body.delivery_fee === null || body.delivery_fee === "" ? null : Number(body.delivery_fee)
    }

    if (body.admin_notes !== undefined) {
      updates.admin_notes = body.admin_notes ? String(body.admin_notes).trim() : null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 })
    }

    const { data, error } = await db
      .from("grocery_requests")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "grocery_request_updated",
      targetTable: "grocery_requests",
      targetId: id,
      oldData: existing as Record<string, unknown>,
      newData: data as Record<string, unknown>,
    })

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update request" },
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
      .from("grocery_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 })
    }

    const { error: deleteError } = await db.from("grocery_requests").delete().eq("id", id)

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_deleted_grocery_request",
      targetTable: "grocery_requests",
      targetId: id,
      oldData: existing as Record<string, unknown>,
      newData: null,
    })

    return NextResponse.json({ success: true, id })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to delete request" },
      { status: 500 },
    )
  }
}

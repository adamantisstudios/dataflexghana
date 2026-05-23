import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { mapAdPackageRow } from "@/lib/advertising-server"
import { isAdMediaType, rowsToCustomFields } from "@/lib/advertising-types"

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
      .from("ad_packages")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    if (!existing) return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 })

    const updates: Record<string, unknown> = {}

    if (body.station_name !== undefined) updates.station_name = String(body.station_name).trim()
    if (body.media_type !== undefined) {
      const mt = String(body.media_type).trim()
      if (!isAdMediaType(mt)) {
        return NextResponse.json({ success: false, error: "Invalid media type" }, { status: 400 })
      }
      updates.media_type = mt
    }
    if (body.package_name !== undefined) updates.package_name = String(body.package_name).trim()
    if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null
    if (body.number_of_spots !== undefined) {
      updates.number_of_spots =
        body.number_of_spots === null || body.number_of_spots === ""
          ? null
          : Number(body.number_of_spots)
    }
    if (body.spot_duration !== undefined) {
      updates.spot_duration = body.spot_duration ? String(body.spot_duration).trim() : null
    }
    if (body.price !== undefined) {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ success: false, error: "Invalid price" }, { status: 400 })
      }
      updates.price = price
    }
    if (body.agent_commission !== undefined) updates.agent_commission = Number(body.agent_commission ?? 0)
    if (body.custom_fields !== undefined) {
      updates.custom_fields = Array.isArray(body.custom_fields)
        ? rowsToCustomFields(body.custom_fields)
        : body.custom_fields
    }
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await db.from("ad_packages").update(updates).eq("id", id).select("*").single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_updated_ad_package",
      targetTable: "ad_packages",
      targetId: id,
      oldData: existing as Record<string, unknown>,
      newData: data as Record<string, unknown>,
    })

    return NextResponse.json({ success: true, data: mapAdPackageRow(data as Record<string, unknown>) })
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
      .from("ad_packages")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    if (!existing) return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 })

    const { error } = await db.from("ad_packages").delete().eq("id", id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_deleted_ad_package",
      targetTable: "ad_packages",
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

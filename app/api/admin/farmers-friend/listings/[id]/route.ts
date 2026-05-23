import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { applyListingMarkup, mapFarmListingRow } from "@/lib/farm-server"
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
      .from("farm_listings")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 })
    }

    if (body.admin_markup !== undefined || body.is_published !== undefined) {
      const markup =
        body.admin_markup !== undefined
          ? Number(body.admin_markup)
          : Number(existing.admin_markup ?? 0)

      if (!Number.isFinite(markup) || markup < 0) {
        return NextResponse.json({ success: false, error: "Invalid markup" }, { status: 400 })
      }

      const publish = body.is_published !== undefined ? Boolean(body.is_published) : undefined
      const listing = await applyListingMarkup(id, markup, publish)

      await logAuditFromRequest(request, {
        actorId: session.admin?.id ?? null,
        actorType: "admin",
        action: "admin_updated_farm_listing",
        targetTable: "farm_listings",
        targetId: id,
        newData: { admin_markup: markup, is_published: listing.is_published },
      })

      return NextResponse.json({ success: true, data: listing })
    }

    if (body.markup_percent !== undefined) {
      const pct = Number(body.markup_percent)
      if (!Number.isFinite(pct) || pct < 0) {
        return NextResponse.json({ success: false, error: "Invalid markup percent" }, { status: 400 })
      }
      const negotiated = Number(existing.negotiated_price)
      const markup = Number((negotiated * (pct / 100)).toFixed(2))
      const listing = await applyListingMarkup(
        id,
        markup,
        body.is_published !== undefined ? Boolean(body.is_published) : undefined,
      )
      return NextResponse.json({ success: true, data: listing })
    }

    const updates: Record<string, unknown> = {}
    if (body.is_fulfilled !== undefined) updates.is_fulfilled = Boolean(body.is_fulfilled)
    if (body.notes !== undefined) updates.notes = body.notes ? String(body.notes).trim() : null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await db.from("farm_listings").update(updates).eq("id", id).select("*").single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data: mapFarmListingRow(data as Record<string, unknown>) })
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
    const { error } = await db.from("farm_listings").delete().eq("id", id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_deleted_farm_listing",
      targetTable: "farm_listings",
      targetId: id,
      newData: null,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    )
  }
}

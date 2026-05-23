import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { mapAdPackageRow } from "@/lib/advertising-server"
import { isAdMediaType, rowsToCustomFields } from "@/lib/advertising-types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const db = getAdminClient()
    const { data, error } = await db.from("ad_packages").select("*").order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map((r) => mapAdPackageRow(r as Record<string, unknown>)),
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load packages" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const station_name = String(body.station_name ?? "").trim()
    const media_type = String(body.media_type ?? "").trim()
    const package_name = String(body.package_name ?? "").trim()
    const price = Number(body.price)

    if (!station_name || !package_name || !isAdMediaType(media_type)) {
      return NextResponse.json({ success: false, error: "Invalid package fields" }, { status: 400 })
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ success: false, error: "Price must be greater than 0" }, { status: 400 })
    }

    const custom_fields = Array.isArray(body.custom_fields)
      ? rowsToCustomFields(body.custom_fields)
      : typeof body.custom_fields === "object" && body.custom_fields
        ? body.custom_fields
        : {}

    const row = {
      station_name,
      media_type,
      package_name,
      description: body.description ? String(body.description).trim() : null,
      number_of_spots: body.number_of_spots != null && body.number_of_spots !== "" ? Number(body.number_of_spots) : null,
      spot_duration: body.spot_duration ? String(body.spot_duration).trim() : null,
      price,
      agent_commission: Number(body.agent_commission ?? 0),
      custom_fields,
      is_active: body.is_active !== false,
    }

    const db = getAdminClient()
    const { data, error } = await db.from("ad_packages").insert(row).select("*").single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_created_ad_package",
      targetTable: "ad_packages",
      targetId: data.id,
      newData: data as Record<string, unknown>,
    })

    return NextResponse.json({ success: true, data: mapAdPackageRow(data as Record<string, unknown>) })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to create package" },
      { status: 500 },
    )
  }
}

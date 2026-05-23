import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { mapWritingServiceRow } from "@/lib/writing-server"
import { isWritingCategory } from "@/lib/writing-types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("writing_services")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      data: (data || []).map((r) => mapWritingServiceRow(r as Record<string, unknown>)),
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load services" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const service_name = String(body.service_name ?? "").trim()
    const price = Number(body.price)
    const category = String(body.category ?? "General").trim()

    if (!service_name) {
      return NextResponse.json({ success: false, error: "Service name is required" }, { status: 400 })
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ success: false, error: "Price must be greater than 0" }, { status: 400 })
    }
    if (!isWritingCategory(category)) {
      return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 })
    }

    const row = {
      service_name,
      description: body.description ? String(body.description).trim() : null,
      price,
      agent_commission: Number(body.agent_commission ?? 0),
      turnaround_time: body.turnaround_time ? String(body.turnaround_time).trim() : "2-3 business days",
      category,
      is_active: body.is_active !== false,
    }

    const db = getAdminClient()
    const { data, error } = await db.from("writing_services").insert(row).select("*").single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    await logAuditFromRequest(request, {
      actorId: session.admin?.id ?? null,
      actorType: "admin",
      action: "admin_created_writing_service",
      targetTable: "writing_services",
      targetId: data.id,
      newData: data as Record<string, unknown>,
    })

    return NextResponse.json({
      success: true,
      data: mapWritingServiceRow(data as Record<string, unknown>),
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to create service" },
      { status: 500 },
    )
  }
}

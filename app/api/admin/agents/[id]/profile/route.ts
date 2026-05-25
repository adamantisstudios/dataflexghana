import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { getAdminClient } from "@/lib/supabase-base"
import { VOICE_ROOM_REGIONS } from "@/lib/voice-room-regions"

export const dynamic = "force-dynamic"

const REQUIRED_STRING_FIELDS = ["full_name", "phone_number", "momo_number", "region"] as const

function parseBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === "boolean") return value
  if (value === "true" || value === 1 || value === "1") return true
  if (value === "false" || value === 0 || value === "0") return false
  return undefined
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { id: agentId } = await params
    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const db = getAdminClient()

    const { data: existing, error: fetchError } = await db
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .maybeSingle()

    if (fetchError || !existing) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}

    if (body.full_name != null) updates.full_name = String(body.full_name).trim()
    if (body.phone_number != null) updates.phone_number = String(body.phone_number).trim()
    if (body.momo_number != null) updates.momo_number = String(body.momo_number).trim()
    if (body.email != null) updates.email = String(body.email).trim()
    if (body.region != null) {
      const region = String(body.region).trim()
      if (!VOICE_ROOM_REGIONS.includes(region as (typeof VOICE_ROOM_REGIONS)[number])) {
        return NextResponse.json({ success: false, error: "Invalid region" }, { status: 400 })
      }
      updates.region = region
    }
    if (body.profession != null) updates.profession = String(body.profession).trim()
    if (body.exact_location != null) updates.exact_location = String(body.exact_location).trim()
    if (body.admin_notes != null) {
      updates.admin_notes = String(body.admin_notes).trim() || null
    }

    const isbanned = parseBool(body.isbanned)
    if (isbanned !== undefined) updates.isbanned = isbanned

    const canTeach = parseBool(body.can_teach)
    if (canTeach !== undefined) updates.can_teach = canTeach

    for (const key of [
      "can_publish_products",
      "can_update_products",
      "can_publish_properties",
      "can_update_properties",
    ] as const) {
      const val = parseBool(body[key])
      if (val !== undefined) updates[key] = val
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 })
    }

    const merged = { ...existing, ...updates }
    for (const field of REQUIRED_STRING_FIELDS) {
      const v = merged[field]
      if (v == null || String(v).trim() === "") {
        return NextResponse.json(
          { success: false, error: `${field.replace(/_/g, " ")} is required` },
          { status: 400 },
        )
      }
    }

    const { data, error } = await db
      .from("agents")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", agentId)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorId: session.admin.id,
      actorType: "admin",
      action: "admin_updated_agent_profile",
      targetTable: "agents",
      targetId: agentId,
      oldData: existing as Record<string, unknown>,
      newData: data as Record<string, unknown>,
    })

    return NextResponse.json({ success: true, agent: data })
  } catch (e) {
    console.error("[admin/agents/profile PATCH]", e)
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to update profile" },
      { status: 500 },
    )
  }
}

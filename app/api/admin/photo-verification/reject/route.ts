import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const agent_id = String(body.agent_id ?? "").trim()
    if (!agent_id) {
      return NextResponse.json({ error: "agent_id is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: before, error: fetchErr } = await db
      .from("agents")
      .select("id, full_name, profile_image_url, profile_verified")
      .eq("id", agent_id)
      .maybeSingle()

    if (fetchErr || !before) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const { data: updated, error } = await db
      .from("agents")
      .update({ profile_image_url: null, profile_verified: false })
      .eq("id", agent_id)
      .select("id, full_name, profile_image_url, profile_verified")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorId: session.admin.id,
      actorType: "admin",
      action: "profile_photo_rejected",
      targetTable: "agents",
      targetId: agent_id,
      oldData: {
        profile_verified: before.profile_verified,
        profile_image_url: before.profile_image_url,
      },
      newData: {
        profile_verified: false,
        profile_image_url: null,
      },
    })

    return NextResponse.json({ success: true, agent: updated })
  } catch (e) {
    console.error("[admin/photo-verification/reject]", e)
    return NextResponse.json({ error: "Failed to reject photo" }, { status: 500 })
  }
}

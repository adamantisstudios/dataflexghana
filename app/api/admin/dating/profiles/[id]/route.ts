import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/api-auth"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { notifyAgentDatingProfileRejected } from "@/lib/dating/dating-notifications"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAdmin(request)
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const action = String(body.action ?? "")
  const rejectionReason =
    typeof body.rejection_reason === "string" ? body.rejection_reason.trim() : ""

  const db = getAdminClient()

  const { data: before, error: fetchErr } = await db
    .from("dating_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (fetchErr || !before) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (action === "approve") {
    updates.is_approved = true
    updates.is_active = true
    updates.rejection_reason = null
    updates.rejected_at = null
  } else if (action === "reject") {
    if (!rejectionReason) {
      return NextResponse.json({ error: "rejection_reason is required" }, { status: 400 })
    }
    updates.is_approved = false
    updates.is_active = false
    updates.is_suspended = false
    updates.rejection_reason = rejectionReason
    updates.rejected_at = new Date().toISOString()
  } else if (action === "suspend") {
    updates.is_suspended = true
    updates.is_active = false
  } else if (action === "unsuspend") {
    updates.is_suspended = false
    updates.is_active = true
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const { data, error } = await db
    .from("dating_profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const adminId = auth.user?.id ?? "admin"

  if (action === "reject") {
    await notifyAgentDatingProfileRejected(before.agent_id as string, rejectionReason)
    await logAuditFromRequest(request, {
      actorId: adminId,
      actorType: "admin",
      action: "dating_profile_rejected",
      severity: "info",
      targetTable: "dating_profiles",
      targetId: id,
      oldData: {
        is_approved: before.is_approved,
        rejection_reason: before.rejection_reason ?? null,
      },
      newData: {
        is_approved: false,
        rejection_reason: rejectionReason,
        agent_id: before.agent_id,
      },
    })
  } else if (action === "approve") {
    await logAuditFromRequest(request, {
      actorId: adminId,
      actorType: "admin",
      action: "dating_profile_approved",
      severity: "info",
      targetTable: "dating_profiles",
      targetId: id,
      oldData: { is_approved: before.is_approved },
      newData: { is_approved: true, agent_id: before.agent_id },
    })
  }

  return NextResponse.json({ success: true, profile: data })
}

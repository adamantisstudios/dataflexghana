import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) {
    return createAuthErrorResponse(auth.error || "Agent authentication required")
  }

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Agent authentication required" }, { status: 401 })
  }

  try {
    const db = getAdminClient()
    const { data: agent, error: fetchError } = await db
      .from("agents")
      .select(
        "id, full_name, phone_number, email, profession, exact_location, profile_image_url, profile_verified, isapproved, created_at, deleted_at",
      )
      .eq("id", agentId)
      .maybeSingle()

    if (fetchError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (agent.deleted_at) {
      return NextResponse.json({ success: true })
    }

    const deletedAt = new Date().toISOString()
    const { error: updateError } = await db
      .from("agents")
      .update({
        deleted_at: deletedAt,
        status: "deleted",
        isbanned: true,
        auto_deactivation_reason: "Agent requested account deletion",
      })
      .eq("id", agentId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await logAuditFromRequest(request, {
      actorId: agentId,
      actorType: "agent",
      action: "agent_account_deleted",
      severity: "warning",
      targetTable: "agents",
      targetId: agentId,
      oldData: {
        ...agent,
        password_hash: undefined,
      },
      newData: {
        deleted_at: deletedAt,
        status: "deleted",
        retained_for_audit: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[agent/account/delete]", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}

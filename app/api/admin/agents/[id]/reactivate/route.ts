import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"
import { logAuditFromRequest } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateAdmin(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Admin authentication required. Please log in again." },
        { status: 401 },
      )
    }

    const { id: agentId } = await params
    const adminId = auth.user.id

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: agent, error: agentError } = await db
      .from("agents")
      .select(
        "id, full_name, isbanned, isapproved, status, auto_deactivated_at, auto_deactivation_reason",
      )
      .eq("id", agentId)
      .maybeSingle()

    if (agentError || !agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    if (!agent.isbanned || !agent.auto_deactivated_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Agent is not auto-deactivated. Only auto-banned agents can be reactivated here.",
        },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()

    const { data: updated, error: updateError } = await db
      .from("agents")
      .update({
        isbanned: false,
        status: "active",
        auto_deactivated_at: null,
        auto_deactivation_reason: null,
        warned_at: null,
        updated_at: now,
      })
      .eq("id", agentId)
      .select()
      .single()

    if (updateError || !updated) {
      return NextResponse.json(
        { success: false, error: updateError?.message || "Failed to reactivate agent" },
        { status: 500 },
      )
    }

    await logAuditFromRequest(request, {
      actorId: adminId,
      actorType: "admin",
      action: "agent_reactivated",
      targetTable: "agents",
      targetId: agentId,
      oldData: {
        isbanned: agent.isbanned,
        auto_deactivated_at: agent.auto_deactivated_at,
        auto_deactivation_reason: agent.auto_deactivation_reason,
        status: agent.status,
      },
      newData: {
        isbanned: false,
        status: "active",
        auto_deactivated_at: null,
        auto_deactivation_reason: null,
      },
    })

    return NextResponse.json({
      success: true,
      agent: updated,
      message: `Agent ${agent.full_name} has been reactivated.`,
    })
  } catch (error) {
    console.error("[reactivate] error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reactivate agent",
      },
      { status: 500 },
    )
  }
}

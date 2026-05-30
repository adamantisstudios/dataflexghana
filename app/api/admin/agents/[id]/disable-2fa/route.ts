import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  const { id: agentId } = await params
  if (!agentId) {
    return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
  }

  const db = getAdminClient()
  const { data: agent, error } = await db
    .from("agents")
    .select("id, full_name, phone_number, two_factor_enabled")
    .eq("id", agentId)
    .maybeSingle()

  if (error || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  await db
    .from("agents")
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_backup_codes: [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId)

  await logAuditFromRequest(request, {
    actorId: session.user.id,
    actorType: "admin",
    action: "agent_2fa_disabled_by_admin",
    severity: "warning",
    targetTable: "agents",
    targetId: agentId,
    newData: {
      agent_name: agent.full_name,
      phone_number: agent.phone_number,
      was_enabled: agent.two_factor_enabled,
    },
  })

  return NextResponse.json({ success: true, message: "Two-factor authentication disabled for agent" })
}

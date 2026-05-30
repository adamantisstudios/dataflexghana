import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { logAuditFromRequest } from "@/lib/audit-logger"
import {
  appendTrustDeviceCookie,
  sanitizeAgentForClient,
  verifyPending2FAToken,
  verifyTwoFactorCode,
} from "@/lib/two-factor-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = String(body.code ?? "").trim()
    const pendingToken = String(body.pendingToken ?? body.pending_token ?? "").trim()
    const rememberDevice = body.rememberDevice !== false

    if (!code || !pendingToken) {
      return NextResponse.json({ error: "Code and pending token are required" }, { status: 400 })
    }

    const pending = verifyPending2FAToken(pendingToken)
    if (!pending || pending.userType !== "agent") {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 })
    }

    const verify = await verifyTwoFactorCode(pending.userId, "agent", code)
    if (!verify.ok) {
      return NextResponse.json({ error: verify.error }, { status: 401 })
    }

    const { data: agent, error } = await getAdminClient()
      .from("agents")
      .select("*")
      .eq("id", pending.userId)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (agent.isbanned || !agent.isapproved) {
      return NextResponse.json({ error: "Account is not allowed to sign in" }, { status: 403 })
    }

    await logAuditFromRequest(request, {
      actorId: agent.id,
      actorType: "agent",
      action: "agent_login",
      severity: "info",
      targetTable: "agents",
      targetId: agent.id,
      newData: { via_2fa: true, backup_code_used: verify.usedBackup },
    })

    const response = NextResponse.json({
      success: true,
      agent: sanitizeAgentForClient(agent as Record<string, unknown>),
      usedBackupCode: verify.usedBackup,
    })

    if (rememberDevice) {
      appendTrustDeviceCookie(response, agent.id, "agent")
    }

    return response
  } catch (e) {
    console.error("[agent/verify-2fa]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 500 },
    )
  }
}

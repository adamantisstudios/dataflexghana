import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { verifyPassword } from "@/lib/supabase"
import { logAuditFromRequest, getClientIp } from "@/lib/audit-logger"
import {
  createPending2FAToken,
  getTrustCookieFromRequest,
  sanitizeAgentForClient,
  verifyTrustDeviceCookie,
} from "@/lib/two-factor-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { phone_number, password } = await request.json()

    if (!phone_number || !password) {
      return NextResponse.json({ error: "Phone number and password are required" }, { status: 400 })
    }

    const supabase = getAdminClient()
    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("phone_number", phone_number)
      .single()

    if (error || !agent) {
      await logAuditFromRequest(request, {
        actorType: "agent",
        action: "failed_login",
        severity: "warning",
        newData: { reason: "agent_not_found", phone_number },
      })
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (agent.isbanned === true) {
      return NextResponse.json(
        {
          error: "Your account has been deactivated and you cannot sign in.",
          banned: true,
          auto_deactivation_reason:
            agent.auto_deactivation_reason ||
            "Your account was deactivated. Contact support if you believe this is an error.",
        },
        { status: 403 },
      )
    }

    if (!agent.isapproved) {
      return NextResponse.json({ error: "Account pending approval" }, { status: 403 })
    }

    if (!agent.password_hash || !(await verifyPassword(password, agent.password_hash))) {
      await logAuditFromRequest(request, {
        actorId: agent.id,
        actorType: "agent",
        action: "failed_login",
        severity: "warning",
        targetTable: "agents",
        targetId: agent.id,
        newData: { reason: "invalid_password", phone_number },
      })
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    const clientIp = getClientIp(request)
    if (clientIp) {
      await supabase
        .from("agents")
        .update({ last_ip: clientIp, updated_at: new Date().toISOString() })
        .eq("id", agent.id)
    }

    if (agent.two_factor_enabled && agent.two_factor_secret) {
      const trustCookie = getTrustCookieFromRequest(request, "agent")
      if (!verifyTrustDeviceCookie(trustCookie, agent.id, "agent")) {
        await logAuditFromRequest(request, {
          actorId: agent.id,
          actorType: "agent",
          action: "agent_login_2fa_required",
          severity: "info",
          targetTable: "agents",
          targetId: agent.id,
        })
        return NextResponse.json({
          requires2FA: true,
          userId: agent.id,
          userType: "agent",
          pendingToken: createPending2FAToken(agent.id, "agent"),
        })
      }
    }

    const safeAgent = sanitizeAgentForClient(agent as Record<string, unknown>)

    await logAuditFromRequest(request, {
      actorId: agent.id,
      actorType: "agent",
      action: "agent_login",
      severity: "info",
      targetTable: "agents",
      targetId: agent.id,
    })

    return NextResponse.json({ agent: safeAgent })
  } catch (error) {
    console.error("[api/agent/login] error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 500 },
    )
  }
}

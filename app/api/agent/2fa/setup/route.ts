import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { buildOtpAuthUrl, generateTwoFactorSecret } from "@/lib/two-factor-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: agent, error } = await getAdminClient()
    .from("agents")
    .select("id, phone_number, two_factor_enabled")
    .eq("id", agentId)
    .single()

  if (error || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  if (agent.two_factor_enabled) {
    return NextResponse.json({ error: "Two-factor authentication is already enabled" }, { status: 400 })
  }

  const secret = generateTwoFactorSecret()
  const label = String(agent.phone_number || agent.id)
  const otpauthUrl = buildOtpAuthUrl(label, secret)

  await getAdminClient()
    .from("agents")
    .update({
      two_factor_secret: secret,
      two_factor_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId)

  return NextResponse.json({
    success: true,
    secret,
    otpauthUrl,
    accountLabel: label,
  })
}

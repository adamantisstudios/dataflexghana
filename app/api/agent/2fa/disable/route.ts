import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { verifyPassword } from "@/lib/supabase"
import { verifyTotpToken } from "@/lib/two-factor-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { password, code } = await request.json()

  const { data: agent, error } = await getAdminClient()
    .from("agents")
    .select("password_hash, two_factor_secret, two_factor_enabled")
    .eq("id", agentId)
    .single()

  if (error || !agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  if (!agent.two_factor_enabled) {
    return NextResponse.json({ success: true, message: "2FA was not enabled" })
  }

  let authorized = false
  if (password && agent.password_hash && (await verifyPassword(password, agent.password_hash))) {
    authorized = true
  }
  if (!authorized && code && agent.two_factor_secret && verifyTotpToken(String(code), agent.two_factor_secret)) {
    authorized = true
  }

  if (!authorized) {
    return NextResponse.json({ error: "Enter your password or a valid authenticator code" }, { status: 401 })
  }

  await getAdminClient()
    .from("agents")
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_backup_codes: [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId)

  return NextResponse.json({ success: true })
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import {
  generatePlainBackupCodes,
  hashBackupCodes,
  verifyTotpToken,
} from "@/lib/two-factor-auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: "Verification code is required" }, { status: 400 })

  const { data: agent, error } = await getAdminClient()
    .from("agents")
    .select("two_factor_secret, two_factor_enabled")
    .eq("id", agentId)
    .single()

  if (error || !agent?.two_factor_secret) {
    return NextResponse.json({ error: "Start setup first" }, { status: 400 })
  }

  if (agent.two_factor_enabled) {
    return NextResponse.json({ error: "Already enabled" }, { status: 400 })
  }

  if (!verifyTotpToken(String(code), agent.two_factor_secret)) {
    return NextResponse.json({ error: "Invalid code. Check your authenticator app and try again." }, { status: 400 })
  }

  const plainBackupCodes = generatePlainBackupCodes()
  const hashed = hashBackupCodes(plainBackupCodes)

  await getAdminClient()
    .from("agents")
    .update({
      two_factor_enabled: true,
      two_factor_backup_codes: hashed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId)

  return NextResponse.json({
    success: true,
    backupCodes: plainBackupCodes,
    message: "Save these backup codes in a safe place. Each can only be used once.",
  })
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await getAdminClient()
    .from("agents")
    .select("two_factor_enabled, two_factor_secret, two_factor_backup_codes")
    .eq("id", agentId)
    .single()

  const backupRemaining = Array.isArray(data?.two_factor_backup_codes)
    ? data.two_factor_backup_codes.length
    : 0

  return NextResponse.json({
    enabled: Boolean(data?.two_factor_enabled),
    pendingSetup: Boolean(data?.two_factor_secret && !data?.two_factor_enabled),
    backupCodesRemaining: backupRemaining,
  })
}

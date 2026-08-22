import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { AGENT_MOMO, sanitizeAgentForMobile } from "@/lib/agent-mobile"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as Record<string, unknown>
  const db = getAdminClient()
  const { data: fresh } = await db
    .from("agents")
    .select(
      "id, full_name, phone_number, email, wallet_balance, commission_balance, profile_image_url, profile_verified, region, isapproved",
    )
    .eq("id", agent.id)
    .maybeSingle()

  return NextResponse.json({
    success: true,
    agent: sanitizeAgentForMobile({ ...agent, ...(fresh || {}) }),
    momo: AGENT_MOMO,
    asset_base_url: "https://www.dataflexghana.com",
  })
}

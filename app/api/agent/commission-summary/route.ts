import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { computeAgentCommissionSummary } from "@/lib/commission-summary-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const agentId = new URL(request.url).searchParams.get("agentId")
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const summary = await computeAgentCommissionSummary(getAdminClient(), agentId)
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error in commission summary API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

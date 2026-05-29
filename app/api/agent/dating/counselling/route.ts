import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { getOrCreateSubscription } from "@/lib/dating/dating-server"
import { COUNSELLING_SESSION_MINUTES } from "@/lib/dating/constants"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: sessions } = await getAdminClient()
    .from("dating_counselling_sessions")
    .select("*")
    .eq("agent_id", agentId)
    .order("scheduled_at", { ascending: true })

  const sub = await getOrCreateSubscription(agentId)

  return NextResponse.json({
    success: true,
    sessions: sessions ?? [],
    intro_claimed: sub.intro_counselling_claimed,
    monthly_claimed_at: sub.monthly_counselling_claimed_at,
    plan: sub.plan,
  })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const scheduled_at = String(body.scheduled_at ?? "").trim()
    const session_type = String(body.session_type ?? "paid")

    if (!scheduled_at) {
      return NextResponse.json({ error: "scheduled_at is required" }, { status: 400 })
    }

    const isFree = session_type === "intro" || session_type === "monthly"
    const { data, error } = await getAdminClient()
      .from("dating_counselling_sessions")
      .insert({
        agent_id: agentId,
        counsellor_name: body.counsellor_name ? String(body.counsellor_name) : "DataFlex Counsellor",
        scheduled_at,
        duration_minutes: COUNSELLING_SESSION_MINUTES,
        status: "pending",
        is_free: isFree,
        session_type,
      })
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, session: data })
  } catch (e) {
    console.error("[dating/counselling POST]", e)
    return NextResponse.json({ error: "Failed to book session" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { getOrCreateSubscription } from "@/lib/dating/dating-server"

export const dynamic = "force-dynamic"

async function verifyMatchAccess(matchId: string, agentId: string) {
  const db = getAdminClient()
  const { data: match } = await db
    .from("dating_matches")
    .select("*")
    .eq("id", matchId)
    .eq("is_active", true)
    .maybeSingle()

  if (!match) return null
  if (match.agent_a_id !== agentId && match.agent_b_id !== agentId) return null
  return match
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matchId } = await params
  const match = await verifyMatchAccess(matchId, agentId)
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

  const sub = await getOrCreateSubscription(agentId)
  const { data: messages } = await getAdminClient()
    .from("dating_messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true })

  return NextResponse.json({
    success: true,
    match: {
      ...match,
      can_send_message:
        !match.chat_initiator_agent_id ||
        match.chat_started ||
        match.chat_initiator_agent_id === agentId,
      waiting_for_her:
        match.chat_initiator_agent_id &&
        !match.chat_started &&
        match.chat_initiator_agent_id !== agentId,
    },
    messages: messages ?? [],
    read_receipts_enabled: sub.plan === "gold" || sub.plan === "silver",
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { matchId } = await params
  const match = await verifyMatchAccess(matchId, agentId)
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

  const canSend =
    !match.chat_initiator_agent_id ||
    match.chat_started ||
    match.chat_initiator_agent_id === agentId

  if (!canSend) {
    return NextResponse.json(
      { error: "She will start the conversation when she's ready." },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const content = String(body.content ?? "").trim()
    const messageType = body.message_type === "icebreaker" ? "icebreaker" : "text"

    if (!content) return NextResponse.json({ error: "Message content required" }, { status: 400 })

    const db = getAdminClient()
    const { data: msg, error } = await db
      .from("dating_messages")
      .insert({
        match_id: matchId,
        sender_agent_id: agentId,
        content,
        message_type: messageType,
      })
      .select("*")
      .single()

    if (error) throw error

    if (!match.chat_started) {
      await db.from("dating_matches").update({ chat_started: true }).eq("id", matchId)
    }

    return NextResponse.json({ success: true, message: msg })
  } catch (e) {
    console.error("[dating/messages POST]", e)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sub = await getOrCreateSubscription(agentId)
  if (sub.plan !== "gold" && sub.plan !== "silver") {
    return NextResponse.json({ error: "Read receipts require Silver or Gold" }, { status: 403 })
  }

  const { matchId } = await params
  const match = await verifyMatchAccess(matchId, agentId)
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

  const body = await request.json()
  const messageIds = Array.isArray(body.message_ids) ? body.message_ids : []

  if (messageIds.length === 0) {
    return NextResponse.json({ error: "message_ids required" }, { status: 400 })
  }

  await getAdminClient()
    .from("dating_messages")
    .update({ read_at: new Date().toISOString() })
    .in("id", messageIds)
    .neq("sender_agent_id", agentId)

  return NextResponse.json({ success: true })
}

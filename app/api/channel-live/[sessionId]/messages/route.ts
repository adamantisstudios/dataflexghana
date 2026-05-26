import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import {
  assertChannelMember,
  getChannelLiveSessionById,
} from "@/lib/channel-live-server"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Unauthorized")

  const agentId = getAuthAgentId(auth)
  const { sessionId } = await params
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const session = await getChannelLiveSessionById(sessionId)
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

  const member = await assertChannelMember(session.channel_id, agentId)
  if (!member.ok) return NextResponse.json({ error: member.error }, { status: 403 })

  const db = getAdminClient()
  const { data, error } = await db
    .from("channel_live_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, messages: data ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Unauthorized")

  const agentId = getAuthAgentId(auth)
  const { sessionId } = await params
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const session = await getChannelLiveSessionById(sessionId)
  if (!session || !session.is_active) {
    return NextResponse.json({ error: "Live session not active" }, { status: 404 })
  }

  const member = await assertChannelMember(session.channel_id, agentId)
  if (!member.ok) return NextResponse.json({ error: member.error }, { status: 403 })

  const body = await request.json()
  const message = String(body.message ?? "").trim()
  const senderName = String(body.senderName ?? "Member").trim()
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 })

  const db = getAdminClient()
  const { data, error } = await db
    .from("channel_live_messages")
    .insert({
      session_id: sessionId,
      sender_agent_id: agentId,
      sender_name: senderName,
      message,
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, message: data })
}

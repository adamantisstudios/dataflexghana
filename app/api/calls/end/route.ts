import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse, requireAdminSession } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { deleteCallLiveKitRoom } from "@/lib/call-sessions-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sessionId = String(body.sessionId ?? "").trim()
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    const agentAuth = await authenticateAgent(request)
    const adminSession = agentAuth.success ? null : await requireAdminSession(request)

    if (!agentAuth.success && (!adminSession || !adminSession.ok)) {
      if (adminSession && !adminSession.ok) return adminSession.response
      return createAuthErrorResponse("Authentication required")
    }

    const db = getAdminClient()
    const { data: callSession } = await db
      .from("call_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle()

    if (!callSession) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 })
    }

    if (agentAuth.success) {
      const agentId = getAuthAgentId(agentAuth)
      if (callSession.caller_id !== agentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else if (adminSession?.ok) {
      const adminId = String(adminSession.admin.id ?? "")
      if (callSession.receiver_id !== adminId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    if (callSession.status === "ended") {
      return NextResponse.json({ success: true, status: "ended" })
    }

    const { data: updated, error: updateErr } = await db
      .from("call_sessions")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select("*")
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    await deleteCallLiveKitRoom(callSession.livekit_room_name)

    return NextResponse.json({ success: true, status: "ended", session: updated })
  } catch (e) {
    console.error("[calls/end]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to end call" },
      { status: 500 },
    )
  }
}

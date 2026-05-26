import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import {
  generateCallAudioToken,
  getCallServerUrl,
  type CallSessionStatus,
} from "@/lib/call-sessions-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const sessionId = String(body.sessionId ?? "").trim()
    const action = String(body.action ?? "").trim().toLowerCase()

    if (!sessionId || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "sessionId and action (accept|decline) are required" },
        { status: 400 },
      )
    }

    const adminId = String(session.admin.id ?? "")
    const db = getAdminClient()

    const { data: callSession, error: fetchErr } = await db
      .from("call_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("receiver_id", adminId)
      .maybeSingle()

    if (fetchErr || !callSession) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 })
    }

    if (callSession.status !== "ringing") {
      return NextResponse.json(
        { error: `Call is already ${callSession.status}` },
        { status: 409 },
      )
    }

    const nextStatus: CallSessionStatus = action === "accept" ? "active" : "declined"
    const { data: updated, error: updateErr } = await db
      .from("call_sessions")
      .update({
        status: nextStatus,
        ...(action === "decline" ? { ended_at: new Date().toISOString() } : {}),
      })
      .eq("id", sessionId)
      .select("*")
      .single()

    if (updateErr || !updated) {
      return NextResponse.json(
        { error: updateErr?.message || "Failed to update call" },
        { status: 500 },
      )
    }

    if (action === "decline") {
      return NextResponse.json({ success: true, status: "declined" })
    }

    const adminName = String(session.admin.full_name || session.admin.email || "Support")
    const token = await generateCallAudioToken(
      `admin-${adminId}`,
      callSession.livekit_room_name,
      adminName,
      "admin",
    )

    return NextResponse.json({
      success: true,
      status: "active",
      token,
      serverUrl: getCallServerUrl(),
      roomName: callSession.livekit_room_name,
      session: updated,
    })
  } catch (e) {
    console.error("[calls/respond]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to respond to call" },
      { status: 500 },
    )
  }
}

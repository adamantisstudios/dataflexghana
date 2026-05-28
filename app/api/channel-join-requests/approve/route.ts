import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { requireAdminSession } from "@/lib/api-auth"
import { ensureChannelMemberActive } from "@/lib/ensure-channel-member-active"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: joinRequest, error: fetchError } = await db
      .from("channel_join_requests")
      .select("*")
      .eq("id", requestId)
      .single()

    if (fetchError || !joinRequest) {
      return NextResponse.json({ error: "Join request not found" }, { status: 404 })
    }

    const now = new Date().toISOString()

    const { error: updateError } = await db
      .from("channel_join_requests")
      .update({ status: "approved", responded_at: now })
      .eq("id", requestId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const memberResult = await ensureChannelMemberActive(
      db,
      joinRequest.channel_id,
      joinRequest.agent_id,
      "member",
    )
    if (!memberResult.ok) {
      return NextResponse.json({ error: memberResult.error || "Failed to activate membership" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Join request approved" })
  } catch (error: unknown) {
    console.error("approve join request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

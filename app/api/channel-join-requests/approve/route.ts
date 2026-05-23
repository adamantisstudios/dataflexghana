import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { requireAdminSession } from "@/lib/api-auth"

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

    const { data: existingMember } = await db
      .from("channel_members")
      .select("id")
      .eq("channel_id", joinRequest.channel_id)
      .eq("agent_id", joinRequest.agent_id)
      .maybeSingle()

    if (!existingMember) {
      const { error: memberError } = await db.from("channel_members").insert({
        channel_id: joinRequest.channel_id,
        agent_id: joinRequest.agent_id,
        role: "member",
        status: "active",
      })
      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Join request approved" })
  } catch (error: unknown) {
    console.error("approve join request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

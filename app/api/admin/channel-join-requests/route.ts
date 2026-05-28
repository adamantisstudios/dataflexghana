import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { requireAdminSession } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

/** Platform admin: all channel join requests (newest first). */
export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const status = request.nextUrl.searchParams.get("status") || "pending"
    const channelId = request.nextUrl.searchParams.get("channelId")
    const db = getAdminClient()

    let query = db
      .from("channel_join_requests_with_agents")
      .select(
        "id, channel_id, agent_id, request_message, status, requested_at, responded_at, full_name, phone_number, teaching_channels(name)",
      )
      .order("requested_at", { ascending: false })

    if (status !== "all") {
      query = query.eq("status", status)
    }
    if (channelId) {
      query = query.eq("channel_id", channelId)
    }

    const { data, error } = await query.limit(200)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: paidSettings } = await db
      .from("channel_subscription_settings")
      .select("channel_id, is_enabled, monthly_fee")
      .eq("is_enabled", true)

    const paidMap = new Map((paidSettings || []).map((s) => [s.channel_id, s.monthly_fee]))

    const requests = (data || []).map((r) => ({
      ...r,
      channel_name: (r.teaching_channels as { name?: string } | null)?.name || "Channel",
      requires_payment: paidMap.has(r.channel_id),
      monthly_fee: paidMap.get(r.channel_id) ?? 0,
    }))

    return NextResponse.json({ success: true, requests })
  } catch (error) {
    console.error("[admin channel-join-requests GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

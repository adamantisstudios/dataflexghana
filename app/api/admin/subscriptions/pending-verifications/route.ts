import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { requireAdminSession } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

/** Pending payment verifications: renewal requests + paid channel join requests. */
export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const db = getAdminClient()

    const [renewalsRes, joinRequestsRes, settingsRes] = await Promise.all([
      db
        .from("subscription_renewal_requests")
        .select("id, channel_id, agent_id, renewal_amount, payment_status, created_at, teaching_channels(name)")
        .eq("payment_status", "pending")
        .order("created_at", { ascending: false }),
      db
        .from("channel_join_requests_with_agents")
        .select(
          "id, channel_id, agent_id, request_message, status, requested_at, full_name, phone_number, teaching_channels(name)",
        )
        .eq("status", "pending")
        .order("requested_at", { ascending: false }),
      db.from("channel_subscription_settings").select("channel_id, is_enabled, monthly_fee").eq("is_enabled", true),
    ])

    if (renewalsRes.error) {
      return NextResponse.json({ error: renewalsRes.error.message }, { status: 500 })
    }
    if (joinRequestsRes.error) {
      return NextResponse.json({ error: joinRequestsRes.error.message }, { status: 500 })
    }

    const paidChannelIds = new Set((settingsRes.data || []).map((s) => s.channel_id))
    const feeMap = new Map((settingsRes.data || []).map((s) => [s.channel_id, s.monthly_fee]))

    const joinVerifications = (joinRequestsRes.data || [])
      .filter((r) => paidChannelIds.has(r.channel_id))
      .map((r) => ({
        id: r.id,
        type: "join" as const,
        channel_id: r.channel_id,
        agent_id: r.agent_id,
        agent_name: r.full_name,
        agent_phone: r.phone_number,
        channel_name: (r.teaching_channels as { name?: string } | null)?.name || "Channel",
        amount: Number(feeMap.get(r.channel_id) || 0),
        request_message: r.request_message,
        created_at: r.requested_at,
      }))

    const renewals = (renewalsRes.data || []).map((r) => ({
      id: r.id,
      type: "renewal" as const,
      channel_id: r.channel_id,
      agent_id: r.agent_id,
      channel_name: (r.teaching_channels as { name?: string } | null)?.name || "Channel",
      amount: Number(r.renewal_amount || 0),
      created_at: r.created_at,
    }))

    return NextResponse.json({
      success: true,
      verifications: [...joinVerifications, ...renewals],
      paidChannelIds: Array.from(paidChannelIds),
    })
  } catch (error) {
    console.error("[admin pending verifications]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

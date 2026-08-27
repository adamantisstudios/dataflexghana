import { type NextRequest, NextResponse } from "next/server"
import { ensureChannelMemberActive } from "@/lib/ensure-channel-member-active"
import { badRequest, num, readJson, requireChannelHost, serverError, str } from "../host-guard"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ channelId: string }> }
type Row = Record<string, any>

/** Pending (or all) join requests for the channel. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const status = str(request.nextUrl.searchParams.get("status")) || "pending"
    const search = str(request.nextUrl.searchParams.get("search")).toLowerCase()

    let query = db
      .from("channel_join_requests_with_agents")
      .select("id, channel_id, agent_id, request_message, status, requested_at, full_name, phone_number")
      .eq("channel_id", channelId)
      .order("requested_at", { ascending: false })

    if (status !== "all") query = query.eq("status", status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let requests = ((data || []) as Row[]).map((r) => ({
      id: String(r.id),
      agent_id: String(r.agent_id),
      agent_name: r.full_name ?? String(r.agent_id),
      agent_contact: r.phone_number ?? "",
      request_message: r.request_message ?? "",
      status: r.status ?? "pending",
      created_at: r.requested_at ?? null,
    }))

    if (search) {
      requests = requests.filter(
        (r) =>
          r.agent_name.toLowerCase().includes(search) ||
          r.agent_contact.toLowerCase().includes(search),
      )
    }

    return NextResponse.json({ success: true, requests, total: requests.length })
  } catch (error) {
    return serverError("requests GET", error)
  }
}

/** Approve or reject a join request. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const body = await readJson(request)
    const requestId = str(body.request_id || body.requestId)
    const action = str(body.action)
    const notes = str(body.notes) || null

    if (!requestId) return badRequest("request_id is required")
    if (action !== "approve" && action !== "reject") {
      return badRequest("action must be approve or reject")
    }

    // The request row must live in this channel.
    const { data: joinRequest } = await db
      .from("channel_join_requests")
      .select("*")
      .eq("id", requestId)
      .eq("channel_id", channelId)
      .maybeSingle()

    if (!joinRequest) {
      return NextResponse.json({ error: "That join request is not for this channel." }, { status: 404 })
    }

    const now = new Date()

    if (action === "reject") {
      const { error } = await db
        .from("channel_join_requests")
        .update({ status: "rejected", responded_at: now.toISOString() })
        .eq("id", requestId)
        .eq("channel_id", channelId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: "Request rejected" })
    }

    const { data: settings } = await db
      .from("channel_subscription_settings")
      .select("is_enabled, monthly_fee")
      .eq("channel_id", channelId)
      .maybeSingle()

    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (settings?.is_enabled) {
      const amount = num(body.amount_verified) ?? num(settings.monthly_fee) ?? 0
      const { error: subError } = await db.from("member_subscription_status").upsert(
        {
          channel_id: channelId,
          agent_id: joinRequest.agent_id,
          join_request_id: requestId,
          subscription_starts_at: now.toISOString(),
          subscription_expires_at: expiryDate.toISOString(),
          payment_verified_at: now.toISOString(),
          payment_amount: amount,
          payment_notes: notes,
          is_active: true,
          updated_at: now.toISOString(),
        },
        { onConflict: "channel_id,agent_id" },
      )
      if (subError) return NextResponse.json({ error: subError.message }, { status: 500 })
    }

    const memberResult = await ensureChannelMemberActive(
      db,
      channelId,
      String(joinRequest.agent_id),
      "member",
    )
    if (!memberResult.ok) {
      return NextResponse.json(
        { error: memberResult.error || "Failed to activate member" },
        { status: 500 },
      )
    }

    await db
      .from("channel_join_requests")
      .update({ status: "approved", responded_at: now.toISOString() })
      .eq("id", requestId)
      .eq("channel_id", channelId)

    return NextResponse.json({
      success: true,
      message: settings?.is_enabled
        ? "Payment verified and member activated for 30 days"
        : "Join request approved",
      expires_at: settings?.is_enabled ? expiryDate.toISOString() : null,
    })
  } catch (error) {
    return serverError("requests POST", error)
  }
}

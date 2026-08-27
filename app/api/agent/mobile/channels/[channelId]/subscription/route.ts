import { type NextRequest, NextResponse } from "next/server"
import { badRequest, num, readJson, requireChannelHost, serverError, str } from "../host-guard"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ channelId: string }> }
type Row = Record<string, any>

/** Paid-access settings plus a roll-up of paying members. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const [{ data: settings }, { data: subscribers }] = await Promise.all([
      db.from("channel_subscription_settings").select("*").eq("channel_id", channelId).maybeSingle(),
      db
        .from("member_subscription_status")
        .select("agent_id, is_active, subscription_expires_at, payment_amount, payment_verified_at")
        .eq("channel_id", channelId)
        .order("subscription_expires_at", { ascending: false })
        .limit(200),
    ])

    const rows = (subscribers || []) as Row[]
    const now = Date.now()
    const active = rows.filter(
      (r) => r.is_active === true && new Date(String(r.subscription_expires_at)).getTime() > now,
    )

    return NextResponse.json({
      success: true,
      settings: settings ?? null,
      subscribers: rows,
      summary: {
        total: rows.length,
        active: active.length,
        expired: rows.length - active.length,
        monthly_revenue: active.reduce((sum, r) => sum + (Number(r.payment_amount) || 0), 0),
      },
    })
  } catch (error) {
    return serverError("subscription GET", error)
  }
}

/** Create or update the channel's subscription settings. */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const body = await readJson(request)
    const isEnabled = body.is_enabled === true
    const monthlyFee = num(body.monthly_fee) ?? 0
    const instructions = str(body.payment_instructions)

    if (isEnabled && monthlyFee <= 0) return badRequest("Enter a monthly fee greater than zero")
    if (isEnabled && !instructions) return badRequest("Payment instructions are required")

    const payload = {
      is_enabled: isEnabled,
      monthly_fee: monthlyFee,
      payment_contact_name: str(body.payment_contact_name),
      payment_contact_number: str(body.payment_contact_number),
      payment_instructions: instructions,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await db
      .from("channel_subscription_settings")
      .select("id")
      .eq("channel_id", channelId)
      .maybeSingle()

    if (existing) {
      const { data, error } = await db
        .from("channel_subscription_settings")
        .update(payload)
        .eq("id", String((existing as Row).id))
        .eq("channel_id", channelId)
        .select("*")
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, settings: data })
    }

    const { data, error } = await db
      .from("channel_subscription_settings")
      .insert({ channel_id: channelId, ...payload })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    return serverError("subscription PUT", error)
  }
}

/** Extend or revoke one member's paid access for 30 days. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const body = await readJson(request)
    const targetAgentId = str(body.agent_id)
    const action = str(body.action)
    if (!targetAgentId) return badRequest("agent_id is required")
    if (action !== "extend" && action !== "revoke") return badRequest("action must be extend or revoke")

    const { data: member } = await db
      .from("channel_members")
      .select("id")
      .eq("channel_id", channelId)
      .eq("agent_id", targetAgentId)
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: "That agent is not a member of this channel." }, { status: 404 })
    }

    const now = new Date()

    if (action === "revoke") {
      const { error } = await db
        .from("member_subscription_status")
        .update({ is_active: false, updated_at: now.toISOString() })
        .eq("channel_id", channelId)
        .eq("agent_id", targetAgentId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, active: false })
    }

    const { data: settings } = await db
      .from("channel_subscription_settings")
      .select("monthly_fee")
      .eq("channel_id", channelId)
      .maybeSingle()

    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const { error } = await db.from("member_subscription_status").upsert(
      {
        channel_id: channelId,
        agent_id: targetAgentId,
        subscription_starts_at: now.toISOString(),
        subscription_expires_at: expires.toISOString(),
        payment_verified_at: now.toISOString(),
        payment_amount: num(body.amount) ?? num(settings?.monthly_fee) ?? 0,
        payment_notes: str(body.notes) || null,
        is_active: true,
        updated_at: now.toISOString(),
      },
      { onConflict: "channel_id,agent_id" },
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, active: true, expires_at: expires.toISOString() })
  } catch (error) {
    return serverError("subscription POST", error)
  }
}

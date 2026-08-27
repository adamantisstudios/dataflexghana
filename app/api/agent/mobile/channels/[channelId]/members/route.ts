import { type NextRequest, NextResponse } from "next/server"
import { ensureChannelMemberActive } from "@/lib/ensure-channel-member-active"
import { badRequest, readJson, requireChannelHost, serverError, str } from "../host-guard"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ channelId: string }> }
type Row = Record<string, any>

type ChannelRole = "member" | "teacher" | "admin"

const ROLES = new Set<ChannelRole>(["member", "teacher", "admin"])
const isRole = (value: string): value is ChannelRole => ROLES.has(value as ChannelRole)
const STATUSES = new Set(["active", "suspended", "left"])

/** List members of the channel (host only). */
export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const status = str(request.nextUrl.searchParams.get("status")) || "active"
    const search = str(request.nextUrl.searchParams.get("search")).toLowerCase()

    let query = db
      .from("channel_members_with_agents")
      .select("id, agent_id, role, status, joined_at, full_name, phone_number")
      .eq("channel_id", channelId)
      .order("joined_at", { ascending: false })

    if (status !== "all") query = query.eq("status", status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let members = ((data || []) as Row[]).map((m) => ({
      id: String(m.id),
      agent_id: String(m.agent_id),
      agent_name: m.full_name ?? String(m.agent_id),
      agent_contact: m.phone_number ?? "",
      role: m.role ?? "member",
      status: m.status ?? "active",
      joined_at: m.joined_at ?? null,
    }))

    if (search) {
      members = members.filter(
        (m) =>
          m.agent_name.toLowerCase().includes(search) ||
          m.agent_contact.toLowerCase().includes(search),
      )
    }

    return NextResponse.json({ success: true, members, total: members.length })
  } catch (error) {
    return serverError("members GET", error)
  }
}

/** Add an agent to the channel directly, by phone number or name. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const body = await readJson(request)
    const query = str(body.query || body.agent_id)
    const role = str(body.role) || "member"

    if (!query) return badRequest("Provide an agent name or phone number")
    if (!isRole(role)) return badRequest("role must be member, teacher or admin")

    let agent: Row | null = null

    const { data: byPhone } = await db
      .from("agents")
      .select("id, full_name, phone_number")
      .eq("phone_number", query)
      .maybeSingle()

    if (byPhone) {
      agent = byPhone as Row
    } else {
      const { data: byName } = await db
        .from("agents")
        .select("id, full_name, phone_number")
        .ilike("full_name", `%${query}%`)
        .limit(1)
      agent = ((byName || []) as Row[])[0] ?? null
    }

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found. Check the name or phone number." },
        { status: 404 },
      )
    }

    const result = await ensureChannelMemberActive(db, channelId, String(agent.id), role)
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to add member" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${agent.full_name ?? "Agent"} added as ${role}`,
      agent: { id: String(agent.id), full_name: agent.full_name, phone_number: agent.phone_number },
    })
  } catch (error) {
    return serverError("members POST", error)
  }
}

/** Change a member's role or status. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db, agentId } = guard.ctx

  try {
    const body = await readJson(request)
    const memberId = str(body.member_id)
    if (!memberId) return badRequest("member_id is required")

    const patch: Record<string, any> = {}
    if (body.role !== undefined) {
      const role = str(body.role)
      if (!isRole(role)) return badRequest("role must be member, teacher or admin")
      patch.role = role
    }
    if (body.status !== undefined) {
      const status = str(body.status)
      if (!STATUSES.has(status)) return badRequest("status must be active, suspended or left")
      patch.status = status
    }
    if (Object.keys(patch).length === 0) return badRequest("Nothing to update")

    // Scope the update to this channel so a host cannot touch another
    // channel's membership row by id.
    const { data: target } = await db
      .from("channel_members")
      .select("id, agent_id")
      .eq("id", memberId)
      .eq("channel_id", channelId)
      .maybeSingle()

    if (!target) {
      return NextResponse.json({ error: "That member is not in this channel." }, { status: 404 })
    }
    if (String(target.agent_id) === agentId) {
      return badRequest("You cannot change your own role or status")
    }

    const { error } = await db
      .from("channel_members")
      .update(patch)
      .eq("id", memberId)
      .eq("channel_id", channelId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError("members PATCH", error)
  }
}

/** Remove a member from the channel. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db, agentId } = guard.ctx

  try {
    const memberId = str(request.nextUrl.searchParams.get("memberId"))
    if (!memberId) return badRequest("memberId query param is required")

    const { data: target } = await db
      .from("channel_members")
      .select("id, agent_id")
      .eq("id", memberId)
      .eq("channel_id", channelId)
      .maybeSingle()

    if (!target) {
      return NextResponse.json({ error: "That member is not in this channel." }, { status: 404 })
    }
    if (String(target.agent_id) === agentId) {
      return badRequest("You cannot remove yourself from your own channel")
    }

    const { error } = await db
      .from("channel_members")
      .delete()
      .eq("id", memberId)
      .eq("channel_id", channelId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await db
      .from("member_subscription_status")
      .update({ is_active: false })
      .eq("channel_id", channelId)
      .eq("agent_id", String(target.agent_id))

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError("members DELETE", error)
  }
}

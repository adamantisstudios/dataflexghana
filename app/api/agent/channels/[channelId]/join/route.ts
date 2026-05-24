import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { channelId } = await params
    const db = getAdminClient()

    const { data: channel, error: channelError } = await db
      .from("teaching_channels")
      .select("id, name, description, image_url, created_by")
      .eq("id", channelId)
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const { data: subscription } = await db
      .from("channel_subscription_settings")
      .select("*")
      .eq("channel_id", channelId)
      .maybeSingle()

    const { data: joinRequest } = await db
      .from("channel_join_requests")
      .select("id, status, created_at, request_message")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      channel,
      subscription: subscription || null,
      joinRequest: joinRequest || null,
    })
  } catch (error) {
    console.error("[agent channel join GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { channelId } = await params
    const body = await request.json()
    const requestMessage = typeof body.request_message === "string" ? body.request_message.trim() : ""

    const db = getAdminClient()

    const { data: subscription } = await db
      .from("channel_subscription_settings")
      .select("is_enabled, monthly_fee")
      .eq("channel_id", channelId)
      .maybeSingle()

    if (subscription?.is_enabled && !requestMessage) {
      return NextResponse.json(
        { error: "Please include a message with your join request for this paid channel" },
        { status: 400 },
      )
    }

    const { data: existing } = await db
      .from("channel_join_requests")
      .select("id, status")
      .eq("channel_id", channelId)
      .eq("agent_id", agentId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "You have already requested to join this channel" }, { status: 409 })
    }

    const { data: newRequest, error } = await db
      .from("channel_join_requests")
      .insert({
        channel_id: channelId,
        agent_id: agentId,
        request_message: requestMessage || null,
        status: "pending",
        requested_at: new Date().toISOString(),
      })
      .select("id, status, created_at, request_message")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      joinRequest: newRequest,
      requiresPayment: Boolean(subscription?.is_enabled),
    })
  } catch (error) {
    console.error("[agent channel join POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

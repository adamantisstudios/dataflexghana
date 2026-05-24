import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = getAdminClient()
    const now = new Date()

    const { data, error } = await db
      .from("member_subscription_status")
      .select(`
        id,
        channel_id,
        subscription_starts_at,
        subscription_expires_at,
        payment_amount,
        is_active,
        teaching_channels(name)
      `)
      .eq("agent_id", agentId)
      .order("subscription_expires_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const subscriptions = (data || []).map((item: Record<string, unknown>) => {
      const expiresAt = new Date(String(item.subscription_expires_at))
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isActive = Boolean(item.is_active) && expiresAt.getTime() > now.getTime()
      const channels = item.teaching_channels as { name?: string } | null

      return {
        id: item.id,
        channel_id: item.channel_id,
        channel_name: channels?.name || "Channel",
        subscription_starts_at: item.subscription_starts_at,
        subscription_expires_at: item.subscription_expires_at,
        payment_amount: Number(item.payment_amount) || 0,
        is_active: isActive,
        days_remaining: daysRemaining,
      }
    })

    return NextResponse.json({ success: true, subscriptions })
  } catch (error) {
    console.error("[agent subscriptions GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error!)

  const agentId = getAuthAgentId(auth)
  if (!agentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { subscriptionId, channelId, amount } = await request.json()

    if (!subscriptionId || !channelId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid renewal request" }, { status: 400 })
    }

    const db = getAdminClient()
    const renewalEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const { error } = await db.from("subscription_renewal_requests").insert({
      member_subscription_id: subscriptionId,
      channel_id: channelId,
      agent_id: agentId,
      renewal_start_date: new Date().toISOString(),
      renewal_end_date: renewalEnd.toISOString(),
      renewal_amount: amount,
      payment_status: "pending",
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[agent subscriptions POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

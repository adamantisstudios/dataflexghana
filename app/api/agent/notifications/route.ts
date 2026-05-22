import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { withUnifiedAuth } from "@/lib/auth-middleware"

export const dynamic = "force-dynamic"

export const GET = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const agentId = user.role === "agent" ? user.id : new URL(request.url).searchParams.get("agentId") || user.id

    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const db = getAdminClient()
    const nowIso = new Date().toISOString()

    let { data: notifications, error } = await db
      .from("agent_notifications")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", nowIso)
      .gte("end_date", nowIso)
      .or(`target_agent_id.is.null,target_agent_id.eq.${agentId}`)
      .order("created_at", { ascending: false })

    if (error?.message?.includes("target_agent_id")) {
      const fallback = await db
        .from("agent_notifications")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", nowIso)
        .gte("end_date", nowIso)
        .order("created_at", { ascending: false })
      notifications = fallback.data
      error = fallback.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: dismissals } = await db
      .from("agent_notification_dismissals")
      .select("notification_id, dismissed_at")
      .eq("agent_id", agentId)

    return NextResponse.json({
      notifications: notifications || [],
      dismissals: dismissals || [],
    })
  } catch (error) {
    console.error("GET agent notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

export const POST = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json()
    const { notification_id, agentId } = body
    const targetAgentId = agentId || user.id

    if (user.role === "agent" && targetAgentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (!notification_id) {
      return NextResponse.json({ error: "notification_id is required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { error } = await db.from("agent_notification_dismissals").upsert(
      {
        agent_id: targetAgentId,
        notification_id,
        dismissed_at: new Date().toISOString(),
      },
      { onConflict: "agent_id,notification_id" },
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST dismiss notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

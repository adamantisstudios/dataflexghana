import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  const db = getAdminClient()
  const nowIso = new Date().toISOString()

  let { data: notifications, error } = await db
    .from("agent_notifications")
    .select("*")
    .eq("is_active", true)
    .lte("start_date", nowIso)
    .gte("end_date", nowIso)
    .or(`target_agent_id.is.null,target_agent_id.eq.${agent.id}`)
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
    console.error("[mobile/notifications]", error.message)
    return NextResponse.json({ success: true, notifications: [], dismissals: [] })
  }

  const { data: dismissals } = await db
    .from("agent_notification_dismissals")
    .select("notification_id, dismissed_at")
    .eq("agent_id", agent.id)

  const dismissed = new Set((dismissals || []).map((d) => d.notification_id))
  const visible = (notifications || []).filter((n) => !dismissed.has(n.id))

  return NextResponse.json({
    success: true,
    notifications: visible,
    dismissals: dismissals || [],
  })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agent = auth.user as { id: string }
  let body: { notification_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.notification_id) {
    return NextResponse.json({ error: "notification_id is required" }, { status: 400 })
  }

  const db = getAdminClient()
  const { error } = await db.from("agent_notification_dismissals").upsert(
    {
      agent_id: agent.id,
      notification_id: body.notification_id,
      dismissed_at: new Date().toISOString(),
    },
    { onConflict: "agent_id,notification_id" },
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

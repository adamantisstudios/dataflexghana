import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { requireAdminSession } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

/** Unified subscription expiry cron — operates on member_subscription_status only. */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCron) {
    const session = await requireAdminSession(request)
    if (!session.ok) return session.response
  }

  try {
    const db = getAdminClient()
    const nowIso = new Date().toISOString()

    const { data: expiredSubscriptions, error: queryError } = await db
      .from("member_subscription_status")
      .select("*")
      .eq("is_active", true)
      .lte("subscription_expires_at", nowIso)

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    for (const sub of expiredSubscriptions || []) {
      await db.from("member_subscription_status").update({ is_active: false }).eq("id", sub.id)
      await db
        .from("channel_members")
        .update({ status: "expired" })
        .eq("channel_id", sub.channel_id)
        .eq("agent_id", sub.agent_id)
    }

    const reminderDate = new Date()
    reminderDate.setDate(reminderDate.getDate() + 3)

    const { data: reminderSubscriptions, error: reminderError } = await db
      .from("member_subscription_status")
      .select("*")
      .eq("is_active", true)
      .gte("subscription_expires_at", nowIso)
      .lte("subscription_expires_at", reminderDate.toISOString())
      .is("renewal_reminder_sent_at", null)

    if (reminderError) {
      return NextResponse.json({ error: reminderError.message }, { status: 500 })
    }

    for (const sub of reminderSubscriptions || []) {
      await db
        .from("member_subscription_status")
        .update({ renewal_reminder_sent_at: new Date().toISOString() })
        .eq("id", sub.id)
    }

    return NextResponse.json({
      success: true,
      expired: expiredSubscriptions?.length || 0,
      reminders: reminderSubscriptions?.length || 0,
    })
  } catch (error: unknown) {
    console.error("check-expiration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

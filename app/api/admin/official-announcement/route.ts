import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { logAuditFromRequest } from "@/lib/audit-logger"
import { getAdminClient } from "@/lib/supabase-base"
import { getAnnouncementsChannel } from "@/lib/announcements-channel"

export const dynamic = "force-dynamic"

/** Log official announcement when platform admin posts to Announcements channel. */
export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const body = await request.json()
    const channelId = String(body.channel_id ?? "").trim()
    const postId = String(body.post_id ?? "").trim()
    const title = String(body.title ?? "").trim()

    if (!channelId || !postId) {
      return NextResponse.json({ error: "channel_id and post_id are required" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: channel } = await db
      .from("teaching_channels")
      .select("id, name, is_official")
      .eq("id", channelId)
      .maybeSingle()

    if (!channel?.is_official) {
      return NextResponse.json({ skipped: true, reason: "not_official_channel" })
    }

    const announcements = await getAnnouncementsChannel(db)
    if (announcements && announcements.id !== channelId) {
      return NextResponse.json({ skipped: true, reason: "not_announcements_channel" })
    }

    await logAuditFromRequest(request, {
      actorId: session.admin.id,
      actorType: "admin",
      action: "official_announcement",
      severity: "info",
      targetTable: "channel_posts",
      targetId: postId,
      newData: {
        channel_id: channelId,
        channel_name: channel.name,
        title,
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[official-announcement]", e)
    return NextResponse.json({ error: "Failed to log announcement" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { ensureAnnouncementsChannelExists } from "@/lib/announcements-channel"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session.ok) return session.response

  try {
    const db = getAdminClient()
    const result = await ensureAnnouncementsChannelExists(db)
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to create channel" }, { status: 500 })
    }
    return NextResponse.json({ success: true, channel_id: result.channelId })
  } catch (e) {
    console.error("[ensure-announcements-channel]", e)
    return NextResponse.json({ error: "Failed to ensure announcements channel" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

/** Agent-facing list of active embed videos for a channel */
export async function GET(request: NextRequest) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const channelId = request.nextUrl.searchParams.get("channelId")
  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 })
  }

  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("channel_embed_videos")
      .select("id, channel_id, title, embed_code, platform, created_at")
      .eq("channel_id", channelId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, videos: data || [] })
  } catch (error) {
    console.error("channel embed-videos GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

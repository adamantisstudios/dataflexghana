import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { detectPlatformFromEmbed, sanitizeTutorialEmbed } from "@/lib/tutorial-embed"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  const channelId = request.nextUrl.searchParams.get("channelId")
  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 })
  }

  try {
    const db = getAdminClient()
    const { data, error } = await db
      .from("channel_embed_videos")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, videos: data || [] })
  } catch (error) {
    console.error("channel-embed-videos GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { channelId, title, embedCode } = await request.json()

    if (!channelId || !title?.trim() || !embedCode?.trim()) {
      return NextResponse.json({ error: "channelId, title, and embedCode are required" }, { status: 400 })
    }

    const sanitized = sanitizeTutorialEmbed(embedCode)
    if (!sanitized) {
      return NextResponse.json(
        { error: "Invalid embed code. Only Vimeo or YouTube iframe embeds are allowed." },
        { status: 400 },
      )
    }

    const platform = detectPlatformFromEmbed(sanitized) || "vimeo"
    const db = getAdminClient()

    const { data, error } = await db
      .from("channel_embed_videos")
      .insert({
        channel_id: channelId,
        title: title.trim(),
        embed_code: sanitized,
        platform,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, video: data })
  } catch (error) {
    console.error("channel-embed-videos POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

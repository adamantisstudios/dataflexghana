import { type NextRequest, NextResponse } from "next/server"
import {
  badRequest,
  notInChannel,
  readJson,
  requireChannelHost,
  rowBelongsToChannel,
  serverError,
  str,
} from "../host-guard"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ channelId: string }> }

/** Table backing each `source` the mobile host UI can post or remove. */
const SOURCE_TABLES: Record<string, string> = {
  youtube: "youtube_videos",
  upload: "videos",
  embed: "channel_embed_videos",
}

function extractYouTubeId(raw: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = raw.match(pattern)
    if (match) return match[1]
  }
  return null
}

/** Every video surface for the channel, grouped by source. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const [{ data: uploads }, { data: youtube }, { data: embeds }] = await Promise.all([
      db.from("videos").select("*").eq("channel_id", channelId).order("created_at", { ascending: false }).limit(100),
      db
        .from("youtube_videos")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("channel_embed_videos")
        .select("id, channel_id, title, embed_code, platform, is_active, created_at")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(100),
    ])

    return NextResponse.json({
      success: true,
      uploads: uploads || [],
      youtube_videos: youtube || [],
      embed_videos: embeds || [],
    })
  } catch (error) {
    return serverError("videos GET", error)
  }
}

/**
 * Post a YouTube video (`source: "youtube"`) or an embed snippet
 * (`source: "embed"`). Binary uploads stay on the website's multipart
 * `/api/upload/video` pipeline.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db, agentId, agentName } = guard.ctx

  try {
    const body = await readJson(request)
    const source = str(body.source) || "youtube"
    const title = str(body.title)
    if (!title) return badRequest("Title is required")

    if (source === "youtube") {
      const videoId = extractYouTubeId(str(body.youtube_url))
      if (!videoId) return badRequest("Enter a valid YouTube link or 11-character video ID")

      const { data, error } = await db
        .from("youtube_videos")
        .insert({
          channel_id: channelId,
          author_id: agentId,
          author_name: agentName,
          title,
          description: str(body.description),
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          youtube_video_id: videoId,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        })
        .select("*")
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, video: data, source })
    }

    if (source === "embed") {
      const embedCode = str(body.embed_code)
      if (!embedCode) return badRequest("embed_code is required")

      const { data, error } = await db
        .from("channel_embed_videos")
        .insert({
          channel_id: channelId,
          title,
          embed_code: embedCode,
          platform: str(body.platform) || "other",
          is_active: true,
        })
        .select("*")
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, video: data, source })
    }

    return badRequest("source must be youtube or embed")
  } catch (error) {
    return serverError("videos POST", error)
  }
}

/**
 * Remove a video. `source` picks the table; `?mode=permanent` hard-deletes an
 * upload, otherwise the row is hidden from members.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const videoId = str(request.nextUrl.searchParams.get("videoId"))
    const source = str(request.nextUrl.searchParams.get("source")) || "youtube"
    const mode = str(request.nextUrl.searchParams.get("mode")) || "soft"

    if (!videoId) return badRequest("videoId query param is required")
    const table = SOURCE_TABLES[source]
    if (!table) return badRequest("source must be youtube, upload or embed")
    if (!(await rowBelongsToChannel(db, table, videoId, channelId))) return notInChannel()

    if (mode === "permanent") {
      const { error } = await db.from(table).delete().eq("id", videoId).eq("channel_id", channelId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, permanent: true })
    }

    const patch =
      source === "youtube"
        ? { is_archived: true }
        : source === "embed"
          ? { is_active: false }
          : { is_deleted: true, deleted_at: new Date().toISOString() }

    const { error } = await db.from(table).update(patch).eq("id", videoId).eq("channel_id", channelId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, permanent: false })
  } catch (error) {
    return serverError("videos DELETE", error)
  }
}

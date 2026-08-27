import { type NextRequest, NextResponse } from "next/server"
import { getActiveChannelLiveSession } from "@/lib/channel-live-server"
import { getAudioStreamPath, repairChannelAudioPublicUrl } from "@/lib/channel-audio-playback"
import { badRequest, num, readJson, requireChannelHost, serverError, str } from "../host-guard"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ channelId: string }> }
type Row = Record<string, any>

const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0)

/**
 * Host dashboard snapshot — mirrors what TeacherChannelDashboard.tsx reads
 * straight out of Supabase on the website, which mobile cannot do.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db, agentId, role, channel } = guard.ctx

  try {
    const [
      { count: memberCount },
      { count: pendingCount },
      { data: subscription },
      { data: postsData },
      { data: messagesData },
      { data: qaData },
      { data: videosData },
      { data: youtubeData },
      { data: embedData },
      { data: audioData },
      { data: notesData },
    ] = await Promise.all([
      db
        .from("channel_members")
        .select("id", { count: "exact", head: true })
        .eq("channel_id", channelId)
        .eq("status", "active"),
      db
        .from("channel_join_requests")
        .select("id", { count: "exact", head: true })
        .eq("channel_id", channelId)
        .eq("status", "pending"),
      db.from("channel_subscription_settings").select("*").eq("channel_id", channelId).maybeSingle(),
      db
        .from("channel_posts")
        .select("*")
        .eq("channel_id", channelId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("channel_messages")
        .select(
          `id, channel_id, agent_id, content, message_type, created_at,
           message_media ( id, media_type, media_url, file_name, duration )`,
        )
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("qa_posts")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(100),
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
      db
        .from("channel_audio_lectures")
        .select("id, channel_id, title, description, audio_url, duration, attachments, created_at")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("lesson_notes")
        .select("*")
        .eq("channel_id", channelId)
        .order("updated_at", { ascending: false })
        .limit(100),
    ])

    let liveSession: Row | null = null
    try {
      liveSession = (await getActiveChannelLiveSession(channelId)) as Row | null
    } catch {
      liveSession = null
    }

    const audio = ((audioData || []) as Row[]).map((a) => ({
      id: String(a.id),
      title: a.title ?? "",
      description: a.description ?? null,
      audio_url: a.audio_url ? repairChannelAudioPublicUrl(String(a.audio_url)) : null,
      stream_url: getAudioStreamPath(String(a.id), agentId),
      duration: a.duration != null ? toNum(a.duration) : null,
      created_at: a.created_at ?? null,
    }))

    return NextResponse.json({
      success: true,
      host: { agent_id: agentId, role },
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        category: channel.category,
        image_url: channel.image_url ?? null,
        is_active: channel.is_active !== false,
        is_public: channel.is_public !== false,
        is_official: channel.is_official === true,
        max_members: channel.max_members ?? null,
        created_at: channel.created_at ?? null,
      },
      stats: {
        member_count: memberCount ?? 0,
        pending_requests: pendingCount ?? 0,
        max_members: channel.max_members ?? null,
        post_count: (postsData || []).length,
        message_count: (messagesData || []).length,
        quiz_count: (qaData || []).length,
        video_count: (videosData || []).length + (youtubeData || []).length + (embedData || []).length,
        audio_count: audio.length,
        note_count: (notesData || []).length,
      },
      subscription: subscription ?? null,
      live_session: liveSession,
      posts: postsData || [],
      messages: messagesData || [],
      qa: qaData || [],
      videos: videosData || [],
      youtube_videos: youtubeData || [],
      embed_videos: embedData || [],
      audio,
      notes: notesData || [],
    })
  } catch (error) {
    return serverError("manage GET", error)
  }
}

/** Update channel settings (name, description, category, visibility, capacity). */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const body = await readJson(request)
    const patch: Record<string, any> = {}

    if (body.name !== undefined) {
      const name = str(body.name)
      if (!name) return badRequest("Channel name cannot be empty")
      patch.name = name
    }
    if (body.description !== undefined) patch.description = str(body.description)
    if (body.category !== undefined) patch.category = str(body.category) || "General"
    if (body.is_active !== undefined) patch.is_active = body.is_active === true
    if (body.is_public !== undefined) patch.is_public = body.is_public === true
    if (body.max_members !== undefined) {
      const max = num(body.max_members)
      if (max == null || max < 1) return badRequest("max_members must be a positive number")
      patch.max_members = Math.round(max)
    }

    if (Object.keys(patch).length === 0) return badRequest("No settings supplied")

    const { data, error } = await db
      .from("teaching_channels")
      .update(patch)
      .eq("id", channelId)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, channel: data })
  } catch (error) {
    return serverError("manage PATCH", error)
  }
}

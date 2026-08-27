import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { hasActiveChannelSubscription } from "@/lib/ensure-channel-member-active"
import { computeMembershipUiStatus } from "@/lib/channel-membership-lifecycle"
import { assertChannelAdmin } from "@/lib/channel-audio-auth"
import { getAudioStreamPath, repairChannelAudioPublicUrl } from "@/lib/channel-audio-playback"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ channelId: string }> }

type Row = Record<string, any>

type FeedItem = {
  id: string
  type: "post" | "message" | "qa" | "youtube" | "video" | "embed"
  title: string
  body: string
  post_type: string | null
  author_name: string | null
  created_at: string | null
  is_pinned: boolean
  media: { id: string; media_type: string; media_url: string; file_name: string | null; duration: number | null }[]
  video_url: string | null
  thumbnail_url: string | null
  youtube_video_id: string | null
  embed_code: string | null
  platform: string | null
  duration: number | null
  view_count: number
  comment_count: number
  like_count: number
  liked_by_me: boolean
  saved_by_me: boolean
  qa: Row | null
}

const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0)
const ts = (v: unknown) => {
  const t = new Date(String(v ?? "")).getTime()
  return Number.isFinite(t) ? t : 0
}

function messageTitle(messageType: string): string {
  switch (messageType) {
    case "image":
      return "Image update"
    case "audio":
      return "Audio update"
    case "video":
      return "Video update"
    case "document":
      return "Document update"
    default:
      return "Announcement"
  }
}

function baseItem(partial: Partial<FeedItem> & { id: string; type: FeedItem["type"] }): FeedItem {
  return {
    title: "",
    body: "",
    post_type: null,
    author_name: null,
    created_at: null,
    is_pinned: false,
    media: [],
    video_url: null,
    thumbnail_url: null,
    youtube_video_id: null,
    embed_code: null,
    platform: null,
    duration: null,
    view_count: 0,
    comment_count: 0,
    like_count: 0,
    liked_by_me: false,
    saved_by_me: false,
    qa: null,
    ...partial,
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(request, undefined, { allowUnverifiedPhoto: true })
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const agentId = String(auth.user.id)

  try {
    const { channelId } = await context.params
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 50)

    const db = getAdminClient()

    const { data: channel, error: channelError } = await db
      .from("teaching_channels")
      .select("*")
      .eq("id", channelId)
      .maybeSingle()

    if (channelError || !channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const [{ data: subscription }, { data: member }, { data: joinRequest }, { data: subRow }] = await Promise.all([
      db.from("channel_subscription_settings").select("*").eq("channel_id", channelId).maybeSingle(),
      db.from("channel_members").select("id, role, status, joined_at").eq("channel_id", channelId).eq("agent_id", agentId).maybeSingle(),
      db
        .from("channel_join_requests")
        .select("id, status, requested_at, created_at, request_message")
        .eq("channel_id", channelId)
        .eq("agent_id", agentId)
        .maybeSingle(),
      db
        .from("member_subscription_status")
        .select("is_active, subscription_expires_at")
        .eq("channel_id", channelId)
        .eq("agent_id", agentId)
        .maybeSingle(),
    ])

    const subscriptionEnabled = Boolean(subscription?.is_enabled)
    let daysUntilExpiry: number | undefined
    let subscriptionActive = false
    if (subRow) {
      const expiresAt = new Date(subRow.subscription_expires_at)
      daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      subscriptionActive = Boolean(subRow.is_active) && daysUntilExpiry > 0
    }

    const membershipStatus = computeMembershipUiStatus({
      joinRequestStatus: joinRequest?.status,
      subscriptionEnabled,
      subscriptionActive,
      daysUntilExpiry,
      isChannelMember: Boolean(member),
      memberRowStatus: member?.status,
    })

    const hasPaidAccess = subscriptionEnabled ? await hasActiveChannelSubscription(db, channelId, agentId) : true
    const isActiveMember = member?.status === "active" && hasPaidAccess

    const { count: memberCount } = await db
      .from("channel_members")
      .select("id", { count: "exact", head: true })
      .eq("channel_id", channelId)
      .eq("status", "active")

    // Delegated to the same check the host endpoints use, so the app's host
    // affordances can never disagree with what the API will authorise. This
    // also covers an owner or platform admin with no channel_members row.
    const hostAccess = await assertChannelAdmin(db, channelId, agentId, auth.user)

    const membership = {
      status: membershipStatus,
      is_member: Boolean(member),
      is_active_member: Boolean(isActiveMember),
      is_host: hostAccess.ok,
      host_role: hostAccess.ok ? hostAccess.role : null,
      role: member?.role ?? null,
      joined_at: member?.joined_at ?? null,
      join_request_status: joinRequest?.status ?? null,
      subscription_enabled: subscriptionEnabled,
      subscription_active: subscriptionActive,
      subscription_fee: subscription?.monthly_fee ?? null,
      subscription_expires_at: subRow?.subscription_expires_at ?? null,
      days_until_expiry: daysUntilExpiry ?? null,
      member_count: memberCount ?? 0,
    }

    const channelSummary = {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      category: channel.category,
      image_url: channel.image_url,
      is_active: channel.is_active,
      is_official: channel.is_official ?? false,
      created_at: channel.created_at,
      member_count: memberCount ?? 0,
    }

    if (!isActiveMember) {
      return NextResponse.json(
        {
          error: subscriptionEnabled && member
            ? "Your subscription for this channel has expired. Renew to keep reading the feed."
            : "You must be an active member of this channel to read its content.",
          requires_join: true,
          channel: channelSummary,
          membership,
        },
        { status: 403 },
      )
    }

    const [
      { data: postsData },
      { data: messagesData },
      { data: qaData },
      { data: youtubeData },
      { data: videosData },
      { data: embedData },
      { data: audioData },
    ] = await Promise.all([
      db
        .from("channel_posts")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false }),
      db
        .from("channel_messages")
        .select(
          `id,
          channel_id,
          agent_id,
          content,
          message_type,
          created_at,
          message_media (
            id,
            media_type,
            media_url,
            file_name,
            width,
            height,
            duration
          )`,
        )
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false }),
      db
        .from("qa_posts")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false }),
      db
        .from("youtube_videos")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false }),
      db.from("videos").select("*").eq("channel_id", channelId).order("created_at", { ascending: false }),
      db
        .from("channel_embed_videos")
        .select("id, channel_id, title, embed_code, platform, created_at")
        .eq("channel_id", channelId)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      db
        .from("channel_audio_lectures")
        .select("id, channel_id, title, description, audio_url, duration, attachments, created_at")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false }),
    ])

    const posts = (postsData || []) as Row[]
    const messages = (messagesData || []) as Row[]
    const qaPosts = (qaData || []) as Row[]
    const youtubeVideos = (youtubeData || []) as Row[]
    const uploadedVideos = ((videosData || []) as Row[]).filter(
      (v) => v.is_published !== false && v.is_deleted !== true,
    )
    const embedVideos = (embedData || []) as Row[]
    const audioLectures = (audioData || []) as Row[]

    const likeableIds = [
      ...posts.map((p) => String(p.id)),
      ...qaPosts.map((q) => String(q.id)),
      ...youtubeVideos.map((v) => String(v.id)),
      ...uploadedVideos.map((v) => String(v.id)),
    ]

    const likeCounts = new Map<string, number>()
    const likedByMe = new Set<string>()
    if (likeableIds.length > 0) {
      const { data: likeRows } = await db.from("post_likes").select("post_id, user_id").in("post_id", likeableIds)
      for (const row of (likeRows || []) as Row[]) {
        const pid = String(row.post_id)
        likeCounts.set(pid, (likeCounts.get(pid) || 0) + 1)
        if (String(row.user_id) === agentId) likedByMe.add(pid)
      }
    }

    const savedByMe = new Set<string>()
    const { data: savedRows } = await db
      .from("saved_posts")
      .select("post_id, qa_post_id")
      .eq("user_id", agentId)
      .eq("channel_id", channelId)
    for (const row of (savedRows || []) as Row[]) {
      const pid = row.post_id ?? row.qa_post_id
      if (pid) savedByMe.add(String(pid))
    }

    const decorate = (item: FeedItem): FeedItem => ({
      ...item,
      like_count: likeCounts.get(item.id) ?? item.like_count,
      liked_by_me: likedByMe.has(item.id),
      saved_by_me: savedByMe.has(item.id),
    })

    const postItems = posts.map((p) =>
      decorate(
        baseItem({
          id: String(p.id),
          type: "post",
          title: p.title ?? "",
          body: p.content ?? "",
          post_type: p.post_type ?? null,
          author_name: p.author_name ?? null,
          created_at: p.created_at ?? null,
          is_pinned: p.is_pinned === true,
          view_count: toNum(p.view_count),
          comment_count: toNum(p.comment_count),
        }),
      ),
    )

    const messageItems = messages.map((m) =>
      decorate(
        baseItem({
          id: String(m.id),
          type: "message",
          title: messageTitle(String(m.message_type ?? "")),
          body: m.content ?? "",
          post_type: m.message_type ?? null,
          created_at: m.created_at ?? null,
          media: (Array.isArray(m.message_media) ? (m.message_media as Row[]) : []).map((media) => ({
            id: String(media.id),
            media_type: String(media.media_type ?? "document"),
            media_url: String(media.media_url ?? ""),
            file_name: media.file_name ?? null,
            duration: media.duration != null ? toNum(media.duration) : null,
          })),
        }),
      ),
    )

    const qaItems = qaPosts.map((q) =>
      decorate(
        baseItem({
          id: String(q.id),
          type: "qa",
          title: "Quiz",
          body: q.question ?? "",
          post_type: "qa",
          author_name: q.author_name ?? null,
          created_at: q.created_at ?? null,
          view_count: toNum(q.view_count),
          qa: {
            question: q.question ?? null,
            option_a: q.option_a ?? null,
            option_b: q.option_b ?? null,
            option_c: q.option_c ?? null,
            option_d: q.option_d ?? null,
            option_e: q.option_e ?? null,
            correct_answer: q.correct_answer ?? null,
            explanation: q.explanation ?? null,
            is_revealed: q.is_revealed === true,
          },
        }),
      ),
    )

    const youtubeItems = youtubeVideos.map((v) =>
      decorate(
        baseItem({
          id: String(v.id),
          type: "youtube",
          title: v.title ?? "",
          body: v.description ?? "",
          post_type: "youtube",
          author_name: v.author_name ?? null,
          created_at: v.created_at ?? null,
          youtube_video_id: v.youtube_video_id ?? null,
          video_url: v.youtube_video_id ? `https://www.youtube.com/watch?v=${v.youtube_video_id}` : null,
          view_count: toNum(v.view_count),
          comment_count: toNum(v.comment_count),
          like_count: toNum(v.like_count),
        }),
      ),
    )

    const uploadedItems = uploadedVideos.map((v) =>
      decorate(
        baseItem({
          id: String(v.id),
          type: "video",
          title: v.title ?? "",
          body: v.description ?? "",
          post_type: "video",
          author_name: v.created_by_name ?? "Teacher",
          created_at: v.created_at ?? null,
          video_url: v.video_url ?? null,
          thumbnail_url: v.thumbnail_url ?? null,
          duration: v.duration != null ? toNum(v.duration) : null,
          view_count: toNum(v.view_count),
          comment_count: toNum(v.comment_count),
          like_count: toNum(v.like_count),
        }),
      ),
    )

    const embedItems = embedVideos.map((v) =>
      decorate(
        baseItem({
          id: String(v.id),
          type: "embed",
          title: v.title ?? "",
          post_type: "embed",
          created_at: v.created_at ?? null,
          embed_code: v.embed_code ?? null,
          platform: v.platform ?? null,
        }),
      ),
    )

    const feed = [
      ...youtubeItems,
      ...postItems,
      ...messageItems,
      ...uploadedItems,
      ...embedItems,
      ...qaItems,
    ].sort((a, b) => ts(b.created_at) - ts(a.created_at))

    const offset = (page - 1) * limit
    const pageItems = feed.slice(offset, offset + limit)

    const audio = audioLectures.map((a) => ({
      id: String(a.id),
      title: a.title ?? "",
      description: a.description ?? null,
      audio_url: a.audio_url ? repairChannelAudioPublicUrl(String(a.audio_url)) : null,
      stream_url: getAudioStreamPath(String(a.id), agentId),
      duration: a.duration != null ? toNum(a.duration) : null,
      created_at: a.created_at ?? null,
    }))

    let blogs: Row[] = []
    if (channel.is_official) {
      const { data: blogRows } = await db
        .from("blogs")
        .select("id, title, slug, excerpt, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3)
      blogs = (blogRows || []) as Row[]
    }

    return NextResponse.json({
      success: true,
      channel: channelSummary,
      membership,
      posts: pageItems,
      qa: qaItems,
      videos: [...youtubeItems, ...uploadedItems, ...embedItems].sort(
        (a, b) => ts(b.created_at) - ts(a.created_at),
      ),
      audio,
      pinned: postItems.filter((p) => p.is_pinned),
      blogs,
      pagination: {
        page,
        limit,
        total: feed.length,
        totalPages: Math.max(Math.ceil(feed.length / limit), 1),
        hasMore: offset + limit < feed.length,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load channel feed"
    console.error("[agent mobile channel feed GET]", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

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

const POST_TYPES = new Set(["lesson", "announcement", "resource", "discussion"])

/** Host list of posts including archived / soft-deleted ones. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const { data, error } = await db
      .from("channel_posts")
      .select("*")
      .eq("channel_id", channelId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, posts: data || [] })
  } catch (error) {
    return serverError("posts GET", error)
  }
}

/** Create a lesson / announcement / resource / discussion post. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db, agentId, agentName, channel, role } = guard.ctx

  try {
    const body = await readJson(request)
    const title = str(body.title)
    const content = str(body.content)
    const postType = str(body.post_type) || "lesson"

    if (!title) return badRequest("Title is required")
    if (!content) return badRequest("Content is required")
    if (!POST_TYPES.has(postType)) {
      return badRequest("post_type must be lesson, announcement, resource or discussion")
    }

    // Official channels are the platform's own announcement surface — the
    // website restricts posting there to the platform administrator.
    if (channel.is_official === true && role !== "platform_admin") {
      return NextResponse.json(
        { error: "Only the platform administrator can post in the official channel." },
        { status: 403 },
      )
    }

    const { data, error } = await db
      .from("channel_posts")
      .insert({
        channel_id: channelId,
        author_id: agentId,
        author_name: agentName,
        title,
        content,
        post_type: postType,
        is_pinned: body.is_pinned === true,
        is_archived: false,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, post: data })
  } catch (error) {
    return serverError("posts POST", error)
  }
}

/** Edit, pin/unpin or archive/unarchive a post. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const body = await readJson(request)
    const postId = str(body.post_id)
    if (!postId) return badRequest("post_id is required")
    if (!(await rowBelongsToChannel(db, "channel_posts", postId, channelId))) return notInChannel()

    const patch: Record<string, any> = {}
    if (body.title !== undefined) {
      const title = str(body.title)
      if (!title) return badRequest("Title cannot be empty")
      patch.title = title
    }
    if (body.content !== undefined) {
      const content = str(body.content)
      if (!content) return badRequest("Content cannot be empty")
      patch.content = content
    }
    if (body.post_type !== undefined) {
      const postType = str(body.post_type)
      if (!POST_TYPES.has(postType)) return badRequest("Invalid post_type")
      patch.post_type = postType
    }
    if (body.is_pinned !== undefined) patch.is_pinned = body.is_pinned === true
    if (body.is_archived !== undefined) patch.is_archived = body.is_archived === true

    if (Object.keys(patch).length === 0) return badRequest("Nothing to update")

    const { data, error } = await db
      .from("channel_posts")
      .update(patch)
      .eq("id", postId)
      .eq("channel_id", channelId)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, post: data })
  } catch (error) {
    return serverError("posts PATCH", error)
  }
}

/**
 * `?mode=soft` (default) hides the post from members and keeps it recoverable;
 * `?mode=permanent` removes the row for good.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db, agentId } = guard.ctx

  try {
    const postId = str(request.nextUrl.searchParams.get("postId"))
    const mode = str(request.nextUrl.searchParams.get("mode")) || "soft"
    if (!postId) return badRequest("postId query param is required")
    if (!(await rowBelongsToChannel(db, "channel_posts", postId, channelId))) return notInChannel()

    if (mode === "permanent") {
      const { error } = await db
        .from("channel_posts")
        .delete()
        .eq("id", postId)
        .eq("channel_id", channelId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, permanent: true })
    }

    const { error } = await db
      .from("channel_posts")
      .update({
        is_deleted: true,
        is_archived: true,
        deleted_at: new Date().toISOString(),
        deleted_by: agentId,
      })
      .eq("id", postId)
      .eq("channel_id", channelId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, permanent: false })
  } catch (error) {
    return serverError("posts DELETE", error)
  }
}
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
type Row = Record<string, any>

const ACTIONS = new Set([
  "post_message",
  "delete_message",
  "purge_message",
  "delete_media",
  "clear_chat",
])

/** Channel broadcast messages plus their attached media. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const { data, error } = await db
      .from("channel_messages")
      .select(
        `id, channel_id, agent_id, content, message_type, created_at,
         message_media ( id, media_type, media_url, file_name, duration )`,
      )
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, messages: data || [] })
  } catch (error) {
    return serverError("moderate GET", error)
  }
}

/**
 * Content moderation and text broadcasts. `action` is one of
 * `post_message`, `delete_message`, `purge_message`, `delete_media`,
 * `clear_chat`.
 *
 * Image / audio / document uploads are not accepted here — those need the
 * website's multipart blob pipeline.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db, agentId } = guard.ctx

  try {
    const body = await readJson(request)
    const action = str(body.action)
    if (!ACTIONS.has(action)) {
      return badRequest(
        "action must be post_message, delete_message, purge_message, delete_media or clear_chat",
      )
    }

    if (action === "post_message") {
      const content = str(body.content)
      if (!content) return badRequest("content is required")

      const links = Array.isArray(body.links) ? (body.links as Row[]) : []
      const linkText = links
        .map((l) => {
          const url = str(l.url)
          if (!url) return ""
          return `[${str(l.title) || url}](${url})`
        })
        .filter(Boolean)
        .join("\n")

      const { data, error } = await db
        .from("channel_messages")
        .insert({
          channel_id: channelId,
          agent_id: agentId,
          content: linkText ? `${content}\n\n${linkText}` : content,
          message_type: linkText ? "link" : "text",
        })
        .select("*")
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: data })
    }

    if (action === "clear_chat") {
      const { data: ids } = await db.from("channel_messages").select("id").eq("channel_id", channelId)
      const messageIds = ((ids || []) as Row[]).map((r) => String(r.id))

      if (messageIds.length > 0) {
        const { error: mediaError } = await db
          .from("message_media")
          .delete()
          .in("message_id", messageIds)
        if (mediaError) return NextResponse.json({ error: mediaError.message }, { status: 500 })
      }

      const { error } = await db.from("channel_messages").delete().eq("channel_id", channelId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, cleared: messageIds.length })
    }

    if (action === "delete_media") {
      const mediaId = str(body.media_id)
      if (!mediaId) return badRequest("media_id is required")

      // message_media has no channel_id, so walk up to the parent message and
      // confirm that message belongs to this channel before deleting.
      const { data: media } = await db
        .from("message_media")
        .select("id, message_id")
        .eq("id", mediaId)
        .maybeSingle()

      if (!media) return notInChannel()
      const parentOk = await rowBelongsToChannel(
        db,
        "channel_messages",
        String((media as Row).message_id),
        channelId,
      )
      if (!parentOk) return notInChannel()

      const { error } = await db.from("message_media").delete().eq("id", mediaId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    const messageId = str(body.message_id)
    if (!messageId) return badRequest("message_id is required")
    if (!(await rowBelongsToChannel(db, "channel_messages", messageId, channelId))) {
      return notInChannel()
    }

    const { error: mediaError } = await db.from("message_media").delete().eq("message_id", messageId)
    if (mediaError) return NextResponse.json({ error: mediaError.message }, { status: 500 })

    if (action === "purge_message") {
      const { error } = await db
        .from("channel_messages")
        .delete()
        .eq("id", messageId)
        .eq("channel_id", channelId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, permanent: true })
    }

    const { error } = await db
      .from("channel_messages")
      .update({
        content: "[This message was deleted]",
        message_type: "deleted",
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .eq("channel_id", channelId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, permanent: false })
  } catch (error) {
    return serverError("moderate POST", error)
  }
}

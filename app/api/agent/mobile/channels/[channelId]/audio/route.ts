import { type NextRequest, NextResponse } from "next/server"
import { getAudioStreamPath, repairChannelAudioPublicUrl } from "@/lib/channel-audio-playback"
import { parseAttachments } from "@/lib/channel-audio-types"
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

/** Audio lectures with host-visible metadata and a signed stream path. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db, agentId } = guard.ctx

  try {
    const { data, error } = await db
      .from("channel_audio_lectures")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const lectures = ((data || []) as Row[]).map((row) => ({
      id: String(row.id),
      title: row.title ?? "",
      description: row.description ?? null,
      audio_url: row.audio_url ? repairChannelAudioPublicUrl(String(row.audio_url)) : null,
      stream_url: getAudioStreamPath(String(row.id), agentId),
      duration: row.duration != null ? Number(row.duration) || 0 : null,
      attachments: parseAttachments(row.attachments),
      created_at: row.created_at ?? null,
    }))

    return NextResponse.json({ success: true, lectures })
  } catch (error) {
    return serverError("audio GET", error)
  }
}

/** Rename a lecture or edit its description. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const body = await readJson(request)
    const lectureId = str(body.lecture_id)
    if (!lectureId) return badRequest("lecture_id is required")
    if (!(await rowBelongsToChannel(db, "channel_audio_lectures", lectureId, channelId))) {
      return notInChannel()
    }

    const patch: Record<string, any> = {}
    if (body.title !== undefined) {
      const title = str(body.title)
      if (!title) return badRequest("Title cannot be empty")
      patch.title = title
    }
    if (body.description !== undefined) patch.description = str(body.description) || null
    if (Object.keys(patch).length === 0) return badRequest("Nothing to update")

    const { error } = await db
      .from("channel_audio_lectures")
      .update(patch)
      .eq("id", lectureId)
      .eq("channel_id", channelId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError("audio PATCH", error)
  }
}

/** Delete a lecture. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const lectureId = str(request.nextUrl.searchParams.get("lectureId"))
    if (!lectureId) return badRequest("lectureId query param is required")
    if (!(await rowBelongsToChannel(db, "channel_audio_lectures", lectureId, channelId))) {
      return notInChannel()
    }

    const { error } = await db
      .from("channel_audio_lectures")
      .delete()
      .eq("id", lectureId)
      .eq("channel_id", channelId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError("audio DELETE", error)
  }
}

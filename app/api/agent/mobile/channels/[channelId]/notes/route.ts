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

/** Lesson notes for the channel. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const { data, error } = await db
      .from("lesson_notes")
      .select("*")
      .eq("channel_id", channelId)
      .order("updated_at", { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, notes: data || [] })
  } catch (error) {
    return serverError("notes GET", error)
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db, agentId, agentName } = guard.ctx

  try {
    const body = await readJson(request)
    const title = str(body.title)
    const content = str(body.content)
    if (!title) return badRequest("Title is required")
    if (!content) return badRequest("Content is required")

    const { data, error } = await db
      .from("lesson_notes")
      .insert({
        channel_id: channelId,
        author_id: agentId,
        author_name: agentName,
        title,
        content,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, note: data })
  } catch (error) {
    return serverError("notes POST", error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const body = await readJson(request)
    const noteId = str(body.note_id)
    if (!noteId) return badRequest("note_id is required")
    if (!(await rowBelongsToChannel(db, "lesson_notes", noteId, channelId))) return notInChannel()

    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
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

    const { data, error } = await db
      .from("lesson_notes")
      .update(patch)
      .eq("id", noteId)
      .eq("channel_id", channelId)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, note: data })
  } catch (error) {
    return serverError("notes PATCH", error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params
  const guard = await requireChannelHost(request, channelId)
  if (!guard.ok) return guard.response
  const { db } = guard.ctx

  try {
    const noteId = str(request.nextUrl.searchParams.get("noteId"))
    if (!noteId) return badRequest("noteId query param is required")
    if (!(await rowBelongsToChannel(db, "lesson_notes", noteId, channelId))) return notInChannel()

    const { error } = await db
      .from("lesson_notes")
      .delete()
      .eq("id", noteId)
      .eq("channel_id", channelId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError("notes DELETE", error)
  }
}

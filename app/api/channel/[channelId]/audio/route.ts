import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { assertChannelAdmin, assertChannelMember } from "@/lib/channel-audio-auth"
import { compressAudioBuffer } from "@/lib/compress-audio"
import { uploadBufferToR2 } from "@/lib/r2-client"
import { parseAttachments, type AudioLecture } from "@/lib/channel-audio-types"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"
export const maxDuration = 300

type RouteContext = { params: Promise<{ channelId: string }> }

function mapLecture(row: Record<string, unknown>): AudioLecture {
  return {
    id: String(row.id),
    channel_id: String(row.channel_id),
    title: String(row.title),
    description: row.description != null ? String(row.description) : null,
    audio_url: String(row.audio_url),
    duration: row.duration != null ? Number(row.duration) : null,
    attachments: parseAttachments(row.attachments),
    created_at: String(row.created_at),
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const { channelId } = await context.params
  const db = getAdminClient()
  const access = await assertChannelMember(db, channelId, authResult.user.id)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { data, error } = await db
    .from("channel_audio_lectures")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    lectures: (data || []).map((row) => mapLecture(row as Record<string, unknown>)),
  })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const { channelId } = await context.params
  const db = getAdminClient()
  const access = await assertChannelAdmin(db, channelId, authResult.user.id)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio")
    const title = String(formData.get("title") || "").trim()
    const description = String(formData.get("description") || "").trim() || null
    const attachmentsRaw = formData.get("attachments")

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    let attachments: ReturnType<typeof parseAttachments> = []
    if (attachmentsRaw) {
      try {
        attachments = parseAttachments(JSON.parse(String(attachmentsRaw)))
      } catch {
        attachments = []
      }
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)
    const originalName = audioFile.name || "audio.mp3"
    const ext = originalName.includes(".") ? originalName.split(".").pop() || "mp3" : "mp3"

    const { buffer, duration, contentType } = await compressAudioBuffer(inputBuffer, ext)

    const objectKey = `channels/${channelId}/audio/${randomUUID()}.mp3`
    const audioUrl = await uploadBufferToR2(buffer, objectKey, contentType)

    const { data: lecture, error: insertError } = await db
      .from("channel_audio_lectures")
      .insert({
        channel_id: channelId,
        title,
        description,
        audio_url: audioUrl,
        duration: duration || null,
        attachments,
      })
      .select("*")
      .single()

    if (insertError || !lecture) {
      return NextResponse.json({ error: insertError?.message || "Failed to save lecture" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lecture: mapLecture(lecture as Record<string, unknown>),
    })
  } catch (error) {
    console.error("channel audio POST:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const { channelId } = await context.params
  const lectureId = request.nextUrl.searchParams.get("lectureId")
  if (!lectureId) {
    return NextResponse.json({ error: "lectureId query param required" }, { status: 400 })
  }

  const db = getAdminClient()
  const access = await assertChannelAdmin(db, channelId, authResult.user.id)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { error } = await db
    .from("channel_audio_lectures")
    .delete()
    .eq("id", lectureId)
    .eq("channel_id", channelId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { assertChannelMember, getLectureChannelId } from "@/lib/channel-audio-auth"
import {
  nestAudioComments,
  parseAttachments,
  type AudioCommentRow,
  type AudioLecture,
} from "@/lib/channel-audio-types"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ lectureId: string }> }

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

  const { lectureId } = await context.params
  const db = getAdminClient()

  const { data: lectureRow, error: lectureError } = await db
    .from("channel_audio_lectures")
    .select("*")
    .eq("id", lectureId)
    .maybeSingle()

  if (lectureError || !lectureRow) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 })
  }

  const channelId = String(lectureRow.channel_id)
  const access = await assertChannelMember(db, channelId, authResult.user.id)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { data: commentRows, error: commentsError } = await db
    .from("channel_audio_comments")
    .select("id, lecture_id, author_id, content, timestamp, parent_id, created_at")
    .eq("lecture_id", lectureId)
    .order("created_at", { ascending: true })

  if (commentsError) {
    return NextResponse.json({ error: commentsError.message }, { status: 500 })
  }

  const rows = (commentRows || []) as AudioCommentRow[]
  const agentIds = [...new Set(rows.map((c) => c.author_id))]
  const nameMap = new Map<string, string>()

  if (agentIds.length > 0) {
    const { data: agents } = await db.from("agents").select("id, full_name").in("id", agentIds)
    agents?.forEach((a) => nameMap.set(String(a.id), a.full_name || "Member"))
  }

  return NextResponse.json({
    success: true,
    lecture: mapLecture(lectureRow as Record<string, unknown>),
    comments: nestAudioComments(rows, nameMap),
  })
}

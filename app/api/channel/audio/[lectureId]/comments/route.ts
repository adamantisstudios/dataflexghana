import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { assertChannelMember, getLectureChannelId } from "@/lib/channel-audio-auth"
import { sanitizeCommentContent } from "@/lib/comment-sanitize"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ lectureId: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const agent = authResult.user
  const { lectureId } = await context.params
  const db = getAdminClient()

  const channelId = await getLectureChannelId(db, lectureId)
  if (!channelId) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 })
  }

  const access = await assertChannelMember(db, channelId, agent.id)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    const body = await request.json()
    const content = sanitizeCommentContent(String(body.content || ""))
    if (!content) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    const timestamp =
      body.timestamp != null && body.timestamp !== ""
        ? Math.max(0, Math.floor(Number(body.timestamp)))
        : null

    const parentId = body.parent_id ? String(body.parent_id) : null

    if (parentId) {
      const { data: parent } = await db
        .from("channel_audio_comments")
        .select("id, parent_id, lecture_id")
        .eq("id", parentId)
        .maybeSingle()

      if (!parent || parent.lecture_id !== lectureId) {
        return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 })
      }
      if (parent.parent_id) {
        return NextResponse.json({ error: "Only one level of replies is allowed" }, { status: 400 })
      }
    }

    const { data: comment, error: insertError } = await db
      .from("channel_audio_comments")
      .insert({
        lecture_id: lectureId,
        author_id: agent.id,
        content,
        timestamp,
        parent_id: parentId,
      })
      .select("id, lecture_id, author_id, content, timestamp, parent_id, created_at")
      .single()

    if (insertError || !comment) {
      return NextResponse.json({ error: insertError?.message || "Failed to post comment" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        author_name: agent.full_name || "Member",
        replies: [],
      },
    })
  } catch (error) {
    console.error("audio comment POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { assertChannelAdmin, assertChannelMember, getLectureChannelId } from "@/lib/channel-audio-auth"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ commentId: string }> }

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const agent = authResult.user
  const { commentId } = await context.params
  const db = getAdminClient()

  const { data: comment, error: fetchError } = await db
    .from("channel_audio_comments")
    .select("id, author_id, lecture_id")
    .eq("id", commentId)
    .maybeSingle()

  if (fetchError || !comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 })
  }

  const channelId = await getLectureChannelId(db, comment.lecture_id)
  if (!channelId) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 })
  }

  const isAuthor = String(comment.author_id) === String(agent.id)
  if (!isAuthor) {
    const adminCheck = await assertChannelAdmin(db, channelId, agent.id)
    if (!adminCheck.ok) {
      const memberCheck = await assertChannelMember(db, channelId, agent.id)
      if (!memberCheck.ok) {
        return NextResponse.json({ error: memberCheck.error }, { status: memberCheck.status })
      }
      return NextResponse.json({ error: "You can only delete your own comments" }, { status: 403 })
    }
  }

  const { error: deleteError } = await db.from("channel_audio_comments").delete().eq("id", commentId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

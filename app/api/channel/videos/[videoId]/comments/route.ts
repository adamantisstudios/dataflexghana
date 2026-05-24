import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { sanitizeCommentContent } from "@/lib/comment-sanitize"

export const dynamic = "force-dynamic"

type CommentSource = "upload" | "embed"

function parseSource(value: string | null): CommentSource {
  return value === "embed" ? "embed" : "upload"
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const { videoId } = await params
  const source = parseSource(request.nextUrl.searchParams.get("source"))

  try {
    const db = getAdminClient()
    let query = db
      .from("video_comments")
      .select("id, video_id, embed_video_id, agent_id, content, created_at")
      .order("created_at", { ascending: false })

    if (source === "embed") {
      query = query.eq("embed_video_id", videoId)
    } else {
      query = query.eq("video_id", videoId)
    }

    const { data: comments, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const agentIds = [...new Set((comments || []).map((c) => c.agent_id).filter(Boolean))]
    const nameMap = new Map<string, string>()

    if (agentIds.length > 0) {
      const { data: agents } = await db.from("agents").select("id, full_name").in("id", agentIds)
      agents?.forEach((a) => nameMap.set(String(a.id), a.full_name || "Agent"))
    }

    const formatted = (comments || []).map((c) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      agent_name: nameMap.get(String(c.agent_id)) || "Agent",
    }))

    return NextResponse.json({ success: true, comments: formatted })
  } catch (error) {
    console.error("channel video comments GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const agent = authResult.user
  const { videoId } = await params

  try {
    const body = await request.json()
    const source = parseSource(body.source ?? null)
    const { content, commentId, action } = body

    if (commentId || action === "edit" || action === "delete") {
      return NextResponse.json({ error: "Comments cannot be edited or deleted by agents" }, { status: 403 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    const sanitized = sanitizeCommentContent(content)
    if (!sanitized) {
      return NextResponse.json({ error: "Comment content is empty after sanitization" }, { status: 400 })
    }

    const db = getAdminClient()

    if (source === "embed") {
      const { data: embedVideo, error: embedError } = await db
        .from("channel_embed_videos")
        .select("id, channel_id, is_active")
        .eq("id", videoId)
        .eq("is_active", true)
        .maybeSingle()

      if (embedError || !embedVideo) {
        return NextResponse.json({ error: "Embed video not found" }, { status: 404 })
      }
    } else {
      const { data: video, error: videoError } = await db
        .from("videos")
        .select("id")
        .eq("id", videoId)
        .maybeSingle()

      if (videoError || !video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 })
      }
    }

    const insertPayload =
      source === "embed"
        ? { embed_video_id: videoId, agent_id: agent.id, content: sanitized }
        : { video_id: videoId, agent_id: agent.id, content: sanitized }

    const { data: comment, error: insertError } = await db
      .from("video_comments")
      .insert(insertPayload)
      .select("id, content, created_at, agent_id")
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    if (source === "upload") {
      const { data: videoRow } = await db.from("videos").select("comment_count").eq("id", videoId).single()
      await db
        .from("videos")
        .update({ comment_count: (videoRow?.comment_count || 0) + 1 })
        .eq("id", videoId)
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        agent_name: agent.full_name || "Agent",
      },
    })
  } catch (error) {
    console.error("channel video comments POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

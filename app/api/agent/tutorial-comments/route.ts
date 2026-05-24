import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

function sanitizeCommentContent(content: string): string {
  let sanitized = content.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[removed]")
  sanitized = sanitized.replace(/\d{7,}/g, "[removed]")
  return sanitized.trim()
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const videoId = request.nextUrl.searchParams.get("videoId")
  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 })
  }

  try {
    const db = getAdminClient()
    const { data: comments, error } = await db
      .from("tutorial_comments")
      .select("id, tutorial_video_id, agent_id, content, created_at, agents(full_name)")
      .eq("tutorial_video_id", videoId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formatted = (comments || []).map((c: Record<string, unknown>) => ({
      id: c.id,
      tutorial_video_id: c.tutorial_video_id,
      agent_id: c.agent_id,
      content: c.content,
      created_at: c.created_at,
      agent_name: (c.agents as { full_name?: string } | null)?.full_name || "Agent",
    }))

    return NextResponse.json({ success: true, comments: formatted })
  } catch (error) {
    console.error("tutorial-comments GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const agent = authResult.user

  try {
    const body = await request.json()
    const { videoId, content, commentId, action } = body

    if (commentId || action === "edit" || action === "delete") {
      return NextResponse.json({ error: "Comments cannot be edited or deleted by agents" }, { status: 403 })
    }

    if (!videoId || !content?.trim()) {
      return NextResponse.json({ error: "videoId and content are required" }, { status: 400 })
    }

    const sanitized = sanitizeCommentContent(content)
    if (!sanitized) {
      return NextResponse.json({ error: "Comment content is empty after sanitization" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: video, error: videoError } = await db
      .from("tutorial_videos")
      .select("id")
      .eq("id", videoId)
      .eq("is_active", true)
      .maybeSingle()

    if (videoError || !video) {
      return NextResponse.json({ error: "Tutorial video not found" }, { status: 404 })
    }

    const { data: comment, error: insertError } = await db
      .from("tutorial_comments")
      .insert({
        tutorial_video_id: videoId,
        agent_id: agent.id,
        content: sanitized,
      })
      .select("id, tutorial_video_id, agent_id, content, created_at")
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        agent_name: agent.full_name || "Agent",
      },
    })
  } catch (error) {
    console.error("tutorial-comments POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

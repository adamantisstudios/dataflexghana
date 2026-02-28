import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const channelId = request.headers.get("x-channel-id")

    if (!userId || !channelId) {
      return NextResponse.json({ error: "Unauthorized: Missing authentication headers" }, { status: 401 })
    }

    const body = await request.json()
    const { action, postId, qaPostId, postType } = body

    if (!action || !postType) {
      return NextResponse.json({ error: "Missing required fields: action, postType" }, { status: 400 })
    }

    if (!postId && !qaPostId) {
      return NextResponse.json({ error: "Either postId or qaPostId must be provided" }, { status: 400 })
    }

    if (action === "save") {
      const { data, error } = await supabaseAdmin
        .from("saved_posts")
        .insert({
          user_id: userId,
          post_id: postType === "regular" ? postId : null,
          qa_post_id: postType === "qa" ? qaPostId : null,
          post_type: postType,
          channel_id: channelId,
        })
        .select()

      if (error) {
        console.error("[v0] Supabase save post error:", error.message, error.details)
        return NextResponse.json({ error: `Failed to save post: ${error.message}` }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    } else if (action === "unsave") {
      const query = supabaseAdmin.from("saved_posts").delete().eq("user_id", userId).eq("channel_id", channelId)

      if (postType === "regular" && postId) {
        query.eq("post_id", postId)
      } else if (postType === "qa" && qaPostId) {
        query.eq("qa_post_id", qaPostId)
      }

      const { error } = await query

      if (error) {
        console.error("[v0] Supabase unsave post error:", error.message, error.details)
        return NextResponse.json({ error: `Failed to unsave post: ${error.message}` }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Invalid action. Must be 'save' or 'unsave'" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Save post API error:", error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}

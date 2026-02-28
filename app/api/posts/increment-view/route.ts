import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
    }

    // Increment view count
    const { data, error } = await supabase
      .from("channel_posts")
      .update({ view_count: supabase.rpc("increment_view_count", { post_id: postId }) })
      .eq("id", postId)
      .select()

    if (error) {
      console.error("[v0] Error incrementing view count:", error)
      return NextResponse.json({ error: "Failed to increment view count" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in increment-view route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

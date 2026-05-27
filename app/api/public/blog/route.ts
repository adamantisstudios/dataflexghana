import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { getAgentListingFeatures } from "@/lib/listing-packages-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId")?.trim()
    if (!agentId) return NextResponse.json({ error: "agentId is required" }, { status: 400 })

    const features = await getAgentListingFeatures(agentId)
    if (Number(features.blog_posts ?? 0) === 0) {
      return NextResponse.json({ success: true, posts: [] })
    }

    const db = getAdminClient()
    const { data, error } = await db
      .from("agent_blog_posts")
      .select("*")
      .eq("agent_id", agentId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, posts: data || [] })
  } catch (error) {
    console.error("[public blog GET]", error)
    return NextResponse.json({ error: "Failed to load blog posts" }, { status: 500 })
  }
}

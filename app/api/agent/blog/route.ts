import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"
import { getAgentListingFeatures } from "@/lib/listing-packages-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")

  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = getAdminClient()
  const { data, error } = await db
    .from("agent_blog_posts")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, posts: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")

  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const features = await getAgentListingFeatures(agentId)
    const limit = Number(features.blog_posts ?? 0)
    if (limit === 0) {
      return NextResponse.json({ error: "Your package does not include blog posts" }, { status: 403 })
    }

    const body = await request.json()
    const title = String(body.title ?? "").trim()
    const content = String(body.content ?? "").trim()
    const featuredImage = body.featured_image_url ? String(body.featured_image_url).trim() : null

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const db = getAdminClient()
    if (limit > 0) {
      const { count } = await db
        .from("agent_blog_posts")
        .select("id", { head: true, count: "exact" })
        .eq("agent_id", agentId)
      if ((count ?? 0) >= limit) {
        return NextResponse.json({ error: "You have reached your blog post limit" }, { status: 400 })
      }
    }

    const { data, error } = await db
      .from("agent_blog_posts")
      .insert({
        agent_id: agentId,
        title,
        content,
        featured_image_url: featuredImage,
        is_published: true,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, post: data })
  } catch (error) {
    console.error("[agent blog POST]", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

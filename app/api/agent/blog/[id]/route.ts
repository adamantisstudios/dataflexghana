import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")

  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.title != null) updates.title = String(body.title).trim()
    if (body.content != null) updates.content = String(body.content).trim()
    if (body.featured_image_url !== undefined) {
      updates.featured_image_url = body.featured_image_url
        ? String(body.featured_image_url).trim()
        : null
    }
    if (body.is_published !== undefined) updates.is_published = Boolean(body.is_published)

    const db = getAdminClient()
    const { data, error } = await db
      .from("agent_blog_posts")
      .update(updates)
      .eq("id", id)
      .eq("agent_id", agentId)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, post: data })
  } catch (error) {
    console.error("[agent blog PUT]", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")

  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const db = getAdminClient()
  const { error } = await db.from("agent_blog_posts").delete().eq("id", id).eq("agent_id", agentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

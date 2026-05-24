import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const authResult = await authenticateAgent(request)
  if (!authResult.success || !authResult.user) {
    return createAuthErrorResponse(authResult.error || "Agent authentication required")
  }

  const agent = authResult.user

  try {
    const body = await request.json()
    const { name, description, category, is_public } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: agentRow, error: agentError } = await db
      .from("agents")
      .select("id, can_teach, isapproved")
      .eq("id", agent.id)
      .single()

    if (agentError || !agentRow) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    if (!agentRow.isapproved) {
      return NextResponse.json({ error: "Only approved agents can create channels" }, { status: 403 })
    }

    if (!agentRow.can_teach) {
      return NextResponse.json(
        { error: "Only approved teachers can create channels. Contact admin for approval." },
        { status: 403 },
      )
    }

    const { data: channel, error: channelError } = await db
      .from("teaching_channels")
      .insert([
        {
          name: name.trim(),
          description: (description || "").trim(),
          category: category || "General",
          is_public: is_public !== false,
          max_members: 100,
          created_by: agent.id,
          is_active: true,
        },
      ])
      .select("id")
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: channelError?.message || "Failed to create channel" }, { status: 500 })
    }

    const { error: memberError } = await db.from("channel_members").insert({
      channel_id: channel.id,
      agent_id: agent.id,
      role: "teacher",
      status: "active",
    })

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, channelId: channel.id })
  } catch (error) {
    console.error("Channel create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

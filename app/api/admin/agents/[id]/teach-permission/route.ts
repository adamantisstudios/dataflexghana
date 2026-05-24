import { requireAdminSession } from "@/lib/api-auth"
import { NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { id: agentId } = await params
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { can_teach } = body

    if (typeof can_teach !== "boolean") {
      return NextResponse.json({ error: "can_teach must be a boolean" }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, full_name, can_teach")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const { data: updatedAgent, error: updateError } = await supabase
      .from("agents")
      .update({ can_teach })
      .eq("id", agentId)
      .select("id, full_name, can_teach, updated_at")
      .single()

    if (updateError) {
      return NextResponse.json({ error: `Failed to update permission: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Agent ${can_teach ? "granted" : "revoked"} teacher permission`,
      agent: updatedAgent,
    })
  } catch (error) {
    console.error("Error updating teach permission:", error)
    return NextResponse.json({ error: "Failed to update teacher permission" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { id: agentId } = await params
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    const supabase = getAdminClient()
    const { data: agent, error } = await supabase
      .from("agents")
      .select("id, full_name, can_teach")
      .eq("id", agentId)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, agent })
  } catch (error) {
    console.error("Error fetching teach permission:", error)
    return NextResponse.json({ error: "Failed to fetch teacher permission" }, { status: 500 })
  }
}

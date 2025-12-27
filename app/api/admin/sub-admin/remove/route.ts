import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { logSubAdminAction } from "@/lib/sub-admin-utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agent_id } = body

    if (!agent_id) {
      return NextResponse.json({ error: "agent_id is required" }, { status: 400 })
    }

    // Verify agent exists and get name
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, full_name")
      .eq("id", agent_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Check if sub-admin role exists
    const { data: role, error: roleError } = await supabase
      .from("admin_sub_roles")
      .select("assigned_tabs")
      .eq("agent_id", agent_id)
      .single()

    if (roleError || !role) {
      return NextResponse.json({ error: "Sub-admin role not found for this agent" }, { status: 404 })
    }

    // Deactivate the role instead of deleting
    const { error: updateError } = await supabase
      .from("admin_sub_roles")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("agent_id", agent_id)

    if (updateError) {
      console.error("[v0] Error removing sub-admin role:", updateError)
      return NextResponse.json({ error: "Failed to remove sub-admin role" }, { status: 500 })
    }

    const adminId = "admin" // In production, get from session/auth
    // Log action
    await logSubAdminAction("revoke", agent_id, adminId, [], "Sub-admin access revoked")

    return NextResponse.json({
      success: true,
      message: `Sub-admin access removed from ${agent.full_name}`,
      agent_name: agent.full_name,
    })
  } catch (error) {
    console.error("[v0] Error in sub-admin remove route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

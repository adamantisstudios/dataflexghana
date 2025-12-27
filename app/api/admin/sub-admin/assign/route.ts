import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { logSubAdminAction } from "@/lib/sub-admin-utils"
import { authenticateAdmin } from "@/lib/api-auth"
import type { SubAdminAssignmentPayload } from "@/lib/sub-admin-types"

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Admin authentication required" },
        { status: 401 },
      )
    }

    const admin = authResult.user
    const body: SubAdminAssignmentPayload = await request.json()
    const { agent_id, assigned_tabs, notes } = body

    // Validate required fields
    if (!agent_id || !assigned_tabs || !Array.isArray(assigned_tabs) || assigned_tabs.length === 0) {
      return NextResponse.json(
        { success: false, error: "agent_id and assigned_tabs (non-empty array) are required" },
        { status: 400 },
      )
    }

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, full_name")
      .eq("id", agent_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    // Check if sub-admin role already exists
    const { data: existingRole, error: existingError } = await supabase
      .from("admin_sub_roles")
      .select("id")
      .eq("agent_id", agent_id)
      .maybeSingle()

    const adminId = admin.id // Use authenticated admin ID instead of hardcoded "admin"

    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabase
        .from("admin_sub_roles")
        .update({
          assigned_tabs,
          is_active: true,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("agent_id", agent_id)

      if (updateError) {
        console.error("[v0] Error updating sub-admin role:", updateError)
        return NextResponse.json({ success: false, error: "Failed to update sub-admin role" }, { status: 500 })
      }

      // Log action
      await logSubAdminAction("update", agent_id, adminId, assigned_tabs, notes)
    } else {
      // Create new role
      const { error: insertError } = await supabase.from("admin_sub_roles").insert([
        {
          agent_id,
          assigned_by_admin_id: adminId,
          assigned_tabs,
          is_active: true,
          notes,
        },
      ])

      if (insertError) {
        console.error("[v0] Error creating sub-admin role:", insertError)
        return NextResponse.json({ success: false, error: "Failed to create sub-admin role" }, { status: 500 })
      }

      // Log action
      await logSubAdminAction("assign", agent_id, adminId, assigned_tabs, notes)
    }

    return NextResponse.json({
      success: true,
      message: `Sub-admin role assigned to ${agent.full_name}`,
      agent_name: agent.full_name,
      assigned_tabs,
    })
  } catch (error) {
    console.error("[v0] Error in sub-admin assign route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { withAdminAuth } from "@/lib/api-auth" // added admin auth

export const GET = withAdminAuth(async (request: NextRequest, admin: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agent_id")

    let query = supabase
      .from("admin_sub_roles")
      .select(
        `
        *,
        agents!inner (
          id,
          full_name,
          phone_number,
          email
        )
      `,
      )
      .eq("is_active", true)

    // If specific agent_id provided, filter by it
    if (agentId) {
      query = query.eq("agent_id", agentId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching sub-admin assignments:", error)
      return NextResponse.json({ error: "Failed to fetch sub-admin assignments" }, { status: 500 })
    }

    // Format response with agent info
    const formattedData = data.map((role: any) => ({
      id: role.id,
      agent_id: role.agent_id,
      agent_name: role.agents?.full_name || "Unknown",
      agent_phone: role.agents?.phone_number || "N/A",
      agent_email: role.agents?.email || "N/A",
      assigned_tabs: role.assigned_tabs,
      assigned_by_admin_id: role.assigned_by_admin_id,
      is_active: role.is_active,
      notes: role.notes,
      created_at: role.created_at,
      updated_at: role.updated_at,
    }))

    return NextResponse.json({
      success: true,
      count: formattedData.length,
      data: formattedData,
    })
  } catch (error) {
    console.error("[v0] Error in sub-admin list route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

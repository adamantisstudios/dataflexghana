import { getAdminClient } from "@/lib/supabase-base"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Properly await params in Next.js 16
    const { id } = await params
    const agentId = id

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { can_update_properties } = body

    if (typeof can_update_properties !== "boolean") {
      return NextResponse.json(
        { error: "can_update_properties must be a boolean" },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Update the agent's update property permission
    const { data, error } = await supabase
      .from("agents")
      .update({ can_update_properties })
      .eq("id", agentId)
      .select("id, full_name, can_update_properties, updated_at")
      .single()

    if (error) {
      console.error("Error updating agent property edit permission:", error)
      return NextResponse.json(
        { error: "Failed to update agent permission" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: can_update_properties
        ? "Agent granted property editing permission"
        : "Agent revoked property editing permission",
      agent: data,
    })
  } catch (error) {
    console.error("Error in update-property-permission route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

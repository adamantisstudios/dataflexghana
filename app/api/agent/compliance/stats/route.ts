import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 })
    }

    // Get submission counts by status
    const { data: submissions, error } = await supabase
      .from("form_submissions")
      .select("status")
      .eq("agent_id", agentId)

    if (error) {
      console.error("Error fetching compliance stats:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
    }

    const stats = {
      total: submissions?.length || 0,
      pending: submissions?.filter((s) => s.status === "pending").length || 0,
      processing: submissions?.filter((s) => s.status === "processing").length || 0,
      completed: submissions?.filter((s) => s.status === "completed").length || 0,
      delivered: submissions?.filter((s) => s.status === "delivered").length || 0,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Error in compliance stats API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

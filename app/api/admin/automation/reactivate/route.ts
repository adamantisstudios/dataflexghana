import { requireAdminSession } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const body = await request.json()
    const agentId = body.agent_id as string | undefined
    const adminNotes =
      (body.admin_notes as string) ||
      `Manually reactivated by admin on ${new Date().toISOString()}`

    if (!agentId) {
      return NextResponse.json({ success: false, error: "agent_id is required" }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { data, error } = await supabase.rpc("reactivate_agent", {
      p_agent_id: agentId,
      p_admin_notes: adminNotes,
    })

    if (error) {
      console.error("[automation/reactivate]", error)
      if (error.code === "PGRST202") {
        return NextResponse.json(
          { success: false, error: "Reactivation function not found in database." },
          { status: 404 },
        )
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data, message: "Agent reactivated successfully" })
  } catch (error) {
    console.error("[automation/reactivate]", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reactivate agent",
      },
      { status: 500 },
    )
  }
}

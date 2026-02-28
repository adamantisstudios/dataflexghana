import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not set")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin()
    const { status } = await request.json()
    const agentId = params.id

    if (!status || !["active", "inactive", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Valid status is required (active, inactive, suspended)" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("agents")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)
      .select("id, agent_id, name, status, updated_at")
      .single()

    if (error) {
      console.error("❌ Failed to update agent status:", error)

      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 })
      }

      return NextResponse.json({ error: "Failed to update agent status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      agent: data,
      message: `Agent status updated to ${status}`,
    })
  } catch (error) {
    console.error("❌ Failed to update agent status:", error)

    if (error instanceof Error) {
      if (error.message.includes("Supabase")) {
        return NextResponse.json(
          { error: "Database configuration error. Please check environment variables." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to update agent status" }, { status: 500 })
  }
}

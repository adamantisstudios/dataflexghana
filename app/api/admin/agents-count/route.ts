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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    console.log("[v0] Fetching agent counts...")

    // Use eq() for exact count of total agents
    const { count: totalCount, error: totalError } = await supabase
      .from("agents")
      .select("*", { count: "exact", head: true })

    if (totalError) {
      console.error("[v0] Error counting total agents:", totalError)
      return NextResponse.json({ error: "Failed to count agents" }, { status: 500 })
    }

    // Count approved agents
    const { count: approvedCount, error: approvedError } = await supabase
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("isapproved", true)

    if (approvedError) {
      console.error("[v0] Error counting approved agents:", approvedError)
      return NextResponse.json({ error: "Failed to count approved agents" }, { status: 500 })
    }

    // Count pending agents
    const { count: pendingCount, error: pendingError } = await supabase
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("isapproved", false)

    if (pendingError) {
      console.error("[v0] Error counting pending agents:", pendingError)
      return NextResponse.json({ error: "Failed to count pending agents" }, { status: 500 })
    }

    const counts = {
      totalAgents: totalCount ?? 0,
      approvedAgents: approvedCount ?? 0,
      pendingAgents: pendingCount ?? 0,
    }

    console.log("[v0] Agent counts:", counts)

    return NextResponse.json(counts)
  } catch (error: any) {
    console.error("[v0] Agent count API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

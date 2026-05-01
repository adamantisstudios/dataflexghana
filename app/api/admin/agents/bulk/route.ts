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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    console.log("[v0] Fetching bulk agents data...")

    const { data, error, count } = await supabase
      .from("agents")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[v0] Error fetching agents:", error)
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
    }

    return NextResponse.json({
      agents: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error("[v0] Bulk agents API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    console.log("[v0] Processing bulk agent operation...")

    // Handle bulk operations like status updates, deletions, etc.
    const { operation, agentIds, updates } = body

    if (!operation || !agentIds || !Array.isArray(agentIds)) {
      return NextResponse.json(
        { error: "Invalid request: operation and agentIds are required" },
        { status: 400 }
      )
    }

    let result
    switch (operation) {
      case "update":
        if (!updates) {
          return NextResponse.json({ error: "Updates are required for update operation" }, { status: 400 })
        }
        const { error: updateError } = await supabase
          .from("agents")
          .update(updates)
          .in("id", agentIds)

        if (updateError) {
          console.error("[v0] Error updating agents:", updateError)
          return NextResponse.json({ error: "Failed to update agents" }, { status: 500 })
        }
        result = { message: `Successfully updated ${agentIds.length} agents` }
        break

      case "delete":
        const { error: deleteError } = await supabase
          .from("agents")
          .delete()
          .in("id", agentIds)

        if (deleteError) {
          console.error("[v0] Error deleting agents:", deleteError)
          return NextResponse.json({ error: "Failed to delete agents" }, { status: 500 })
        }
        result = { message: `Successfully deleted ${agentIds.length} agents` }
        break

      default:
        return NextResponse.json({ error: "Unknown operation" }, { status: 400 })
    }

    console.log("[v0] Bulk operation result:", result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Bulk operation API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchTerm } = await request.json()

    if (!searchTerm || typeof searchTerm !== "string") {
      return NextResponse.json({ error: "Search term is required" }, { status: 400 })
    }

    console.log("[v0] Searching agents with term:", searchTerm)

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .or(`full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] ❌ Agent search error:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)

      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    // Add computed status field for backward compatibility
    const agents = (data || []).map((agent: any) => ({
      ...agent,
      status: agent.status || (agent.isapproved ? "active" : "pending"),
    }))

    console.log("[v0] ✅ Search results found:", agents.length)

    return NextResponse.json({
      success: true,
      agents,
      count: agents.length,
    })
  } catch (error) {
    console.error("[v0] ❌ Agent search catch error:", error)

    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)

      if (error.message.includes("Supabase")) {
        return NextResponse.json(
          { error: "Database configuration error. Please check environment variables." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to search agents - Internal server error" }, { status: 500 })
  }
}

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

    const searchPattern = `%${searchTerm}%`

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .or(`full_name.ilike.${searchPattern},phone_number.ilike.${searchPattern},id.ilike.${searchPattern}`)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("❌ Agent search error:", error)
      return NextResponse.json({ error: "Failed to search agents" }, { status: 500 })
    }

    // Add computed status field for backward compatibility
    const agents = (data || []).map((agent: any) => ({
      ...agent,
      status: agent.status || (agent.isapproved ? "active" : "pending"),
    }))

    return NextResponse.json({
      success: true,
      agents,
      count: agents.length,
    })
  } catch (error) {
    console.error("❌ Agent search error:", error)

    if (error instanceof Error) {
      if (error.message.includes("Supabase")) {
        return NextResponse.json(
          { error: "Database configuration error. Please check environment variables." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to search agents" }, { status: 500 })
  }
}

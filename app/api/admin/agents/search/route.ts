import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ---------------------------------------------
   Supabase Admin Client
--------------------------------------------- */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not set")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}

/* ---------------------------------------------
   UUID Validator (CRITICAL FIX)
--------------------------------------------- */
function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  )
}

/* ---------------------------------------------
   POST: Search Agents
--------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const searchTerm = String(body?.searchTerm ?? "").trim()

    if (!searchTerm) {
      return NextResponse.json(
        { success: true, agents: [], count: 0 },
        { status: 200 }
      )
    }

    console.log("[v0] 🔍 Searching agents:", searchTerm)

    const searchPattern = `%${searchTerm}%`

    /* ---------------------------------------------
       SAFE FILTER BUILD (NO UUID CRASH)
    --------------------------------------------- */
    const filters: string[] = [
      `full_name.ilike.${searchPattern}`,
      `phone_number.ilike.${searchPattern}`,
    ]

    // Only include ID search if valid UUID
    if (isValidUUID(searchTerm)) {
      filters.push(`id.eq.${searchTerm}`)
    }

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .or(filters.join(","))
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] ❌ Supabase error:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Search failed: ${error.message}`,
        },
        { status: 500 }
      )
    }

    const agents = (data ?? []).map((agent: any) => ({
      ...agent,
      status: agent.status ?? (agent.isapproved ? "active" : "pending"),
    }))

    console.log("[v0] ✅ Agents found:", agents.length)

    return NextResponse.json({
      success: true,
      agents,
      count: agents.length,
    })
  } catch (err) {
    console.error(
      "[v0] ❌ Unhandled error:",
      err instanceof Error ? err.message : err
    )

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search agents",
      },
      { status: 500 }
    )
  }
}

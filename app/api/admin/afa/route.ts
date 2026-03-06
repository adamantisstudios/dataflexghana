import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function GET(request: NextRequest) {
  try {
    const statusFilter = request.nextUrl.searchParams.get("status") || "all"

    let afaQuery = supabase.from("mtnafa_registrations").select("*").order("created_at", { ascending: false })

    if (statusFilter !== "all") {
      afaQuery = afaQuery.eq("status", statusFilter)
    }

    const { data: afaData, error: afaError } = await afaQuery

    if (afaError) {
      console.error("Error fetching AFA data:", afaError)
      return NextResponse.json(
        { error: "Failed to fetch AFA registrations", details: afaError.message },
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }

    // Enrich with agent data
    const afaIds = (afaData || []).map((a: any) => a.agent_id)
    let agents: any[] = []
    if (afaIds.length > 0) {
      const { data: agentsData } = await supabase.from("agents").select("id, full_name, phone_number").in("id", afaIds)
      agents = agentsData || []
    }

    const agentMap = new Map(agents.map((a: any) => [a.id, a]))
    const enrichedAfa = (afaData || []).map((item: any) => ({
      ...item,
      agents: agentMap.get(item.agent_id),
    }))

    return NextResponse.json({ data: enrichedAfa }, { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    console.error("Unexpected error in AFA admin API:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

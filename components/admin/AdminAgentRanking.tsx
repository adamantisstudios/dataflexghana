import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase-query"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 300 // ISR: cache API response for 5 minutes to reduce Supabase calls

// Timeout for the entire request
const REQUEST_TIMEOUT = 25000 // 25 seconds (Vercel max is 30s)

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout: ${label} exceeded ${ms}ms`)), ms),
  )
  return Promise.race([promise, timeoutPromise])
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "30d"
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    console.log("[v0] Starting ranking calculation", { timeframe, limit })

    // Validate timeframe
    if (!["7d", "30d"].includes(timeframe)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid timeframe. Use "7d" or "30d"',
        },
        { status: 400 },
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    if (timeframe === "7d") {
      startDate.setDate(endDate.getDate() - 7)
    } else {
      startDate.setDate(endDate.getDate() - 30)
    }

    console.log("[v0] Date range:", {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      timeframe,
    })

    const supabase = createSupabaseAdmin()

    console.log("[v0] Fetching approved agents...")
    const { data: agents, error: agentsError } = await withTimeout(
      supabase.from("agents").select("id, full_name, phone_number").eq("isapproved", true).limit(500),
      5000,
      "Fetching agents",
    )

    if (agentsError) {
      console.error("[v0] Error fetching agents:", agentsError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch agents",
          details: agentsError.message,
        },
        { status: 500 },
      )
    }

    if (!agents || agents.length === 0) {
      console.log("[v0] No approved agents found")
      return NextResponse.json({
        success: true,
        data: {
          agents: [],
          timeframe: timeframe,
          total_count: 0,
          last_updated: new Date().toISOString(),
        },
      })
    }

    console.log("[v0] Found agents:", agents.length)
    const agentIds = agents.map((a) => a.id)

    console.log("[v0] Starting parallel queries for activities...")
    const queries = [
      withTimeout(
        supabase
          .from("referrals")
          .select("agent_id", { count: "exact", head: false })
          .in("agent_id", agentIds)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        8000,
        "Referrals query",
      ),
      withTimeout(
        supabase
          .from("data_orders")
          .select("agent_id", { count: "exact", head: false })
          .in("agent_id", agentIds)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        8000,
        "Data orders query",
      ),
      withTimeout(
        supabase
          .from("wholesale_orders")
          .select("agent_id", { count: "exact", head: false })
          .in("agent_id", agentIds)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        8000,
        "Wholesale orders query",
      ),
      withTimeout(
        supabase
          .from("e_orders")
          .select("agent_id", { count: "exact", head: false })
          .in("agent_id", agentIds)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        8000,
        "E-commerce orders query",
      ),
    ]

    let results
    try {
      results = await Promise.allSettled(queries)
    } catch (error) {
      console.error("[v0] Promise.allSettled error:", error)
      throw error
    }

    const activityMap: Record<string, number> = {}
    agentIds.forEach((id) => {
      activityMap[id] = 0
    })

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const { data, error } = result.value
        const tableNames = ["referrals", "data_orders", "wholesale_orders", "e_orders"]

        if (error) {
          console.warn(`[v0] ${tableNames[index]} query error:`, error.message)
        } else if (data) {
          console.log(`[v0] ${tableNames[index]} records for ${timeframe}:`, data.length)
          data.forEach((item: any) => {
            activityMap[item.agent_id] = (activityMap[item.agent_id] || 0) + 1
          })
        }
      } else {
        console.error(
          `[v0] ${["referrals", "data_orders", "wholesale_orders", "e_orders"][index]} query rejected:`,
          result.reason,
        )
      }
    })

    const agentActivities = agents.map((agent) => ({
      agent_id: agent.id,
      agent_name: agent.full_name || agent.phone_number || "Unknown Agent",
      total_activity: activityMap[agent.id] || 0,
    }))

    const sortedAgents = agentActivities
      .filter((agent) => agent.total_activity > 0)
      .sort((a, b) => b.total_activity - a.total_activity)
      .slice(0, limit)
      .map((agent, index) => ({
        name: agent.agent_name,
        activity: agent.total_activity,
        rank: index + 1,
      }))

    const duration = Date.now() - startTime
    console.log(
      `[v0] Ranking calculation completed in ${duration}ms for ${sortedAgents.length} agents with timeframe ${timeframe}`,
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          agents: sortedAgents,
          timeframe: timeframe,
          total_count: sortedAgents.length,
          last_updated: new Date().toISOString(),
          calculation_time_ms: duration,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Agent ranking API error:", error instanceof Error ? error.message : error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate rankings",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 502 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be used to trigger manual ranking calculations
    // For now, it just returns success since we calculate rankings on-demand
    return NextResponse.json({
      success: true,
      message: "Rankings are calculated on-demand",
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error in ranking update:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

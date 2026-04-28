import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Test database connection first
    const { error: connectionError } = await supabase.from("agents").select("count", { count: "exact", head: true })

    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`)
    }

    // Try to get automation statistics using RPC function
    const { data: statsData, error: statsError } = await supabase.rpc("get_automation_statistics", { p_days_back: 30 })

    if (statsError) {
      console.error("Stats RPC error:", statsError)

      // Handle specific RPC errors gracefully
      if (statsError.code === "PGRST202") {
        // Function not found, return default values
        return NextResponse.json({
          success: true,
          stats: {
            total_runs: 0,
            successful_runs: 0,
            failed_runs: 0,
            total_agents_processed: 0,
            total_agents_deactivated: 0,
            avg_execution_time_ms: 0,
            last_run_at: null,
            next_recommended_run: null,
          },
          message: "Statistics function not available, using default values",
        })
      } else {
        throw statsError
      }
    }

    return NextResponse.json({
      success: true,
      stats: statsData?.[0] || {
        total_runs: 0,
        successful_runs: 0,
        failed_runs: 0,
        total_agents_processed: 0,
        total_agents_deactivated: 0,
        avg_execution_time_ms: 0,
        last_run_at: null,
        next_recommended_run: null,
      },
    })
  } catch (error) {
    console.error("Stats fetch error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown stats error"
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch automation statistics: ${errorMessage}`,
        error_code: "STATS_FETCH_FAILED",
        stats: {
          total_runs: 0,
          successful_runs: 0,
          failed_runs: 0,
          total_agents_processed: 0,
          total_agents_deactivated: 0,
          avg_execution_time_ms: 0,
          last_run_at: null,
          next_recommended_run: null,
        },
      },
      { status: 500 },
    )
  }
}

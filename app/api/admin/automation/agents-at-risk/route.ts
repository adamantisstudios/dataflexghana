import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Test database connection first
    const { error: connectionError } = await supabase.from("agents").select("count", { count: "exact", head: true })

    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`)
    }

    // Try to get agents at risk using RPC function
    const { data: atRiskData, error: atRiskError } = await supabase.rpc("get_agents_at_risk")

    if (atRiskError) {
      console.error("At-risk RPC error:", atRiskError)

      // Handle specific RPC errors gracefully
      if (atRiskError.code === "PGRST202") {
        // Function not found, return empty array with message
        return NextResponse.json({
          success: true,
          data: [],
          message: "At-risk function not available, using empty array",
        })
      } else {
        throw atRiskError
      }
    }

    return NextResponse.json({
      success: true,
      data: atRiskData || [],
    })
  } catch (error) {
    console.error("At-risk fetch error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown at-risk error"
    return NextResponse.json(
      {
        success: false,
        message: `Failed to fetch agents at risk: ${errorMessage}`,
        error_code: "AT_RISK_FETCH_FAILED",
        data: [],
      },
      { status: 500 },
    )
  }
}

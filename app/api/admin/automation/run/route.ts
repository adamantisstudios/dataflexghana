import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    const { error: connectionError } = await supabase.from("agents").select("count", { count: "exact", head: true })

    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`)
    }

    // Try to run automation using RPC function
    const { data: automationResult, error: automationError } = await supabase.rpc("run_agent_deactivation_automation", {
      p_run_type: "manual",
    })

    if (automationError) {
      console.error("Automation RPC error:", automationError)

      // Handle specific RPC errors gracefully
      if (automationError.code === "PGRST202") {
        return NextResponse.json(
          {
            success: false,
            message: "Automation function not found. Please check if the database function exists.",
            error_code: "FUNCTION_NOT_FOUND",
          },
          { status: 404 },
        )
      } else if (automationError.code === "PGRST301") {
        return NextResponse.json(
          {
            success: false,
            message: "Automation function execution failed. Please check function permissions.",
            error_code: "FUNCTION_EXECUTION_FAILED",
          },
          { status: 500 },
        )
      } else {
        throw automationError
      }
    }

    // Handle successful response
    let result = {
      success: true,
      message: "Automation completed successfully",
      data: automationResult || {},
      processed_agents: 0,
      deactivated_agents: 0,
    }

    if (automationResult && typeof automationResult === "object") {
      result = {
        ...result,
        message: automationResult.message || result.message,
        processed_agents: automationResult.processed_agents || 0,
        deactivated_agents: automationResult.deactivated_agents || 0,
        data: automationResult,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Automation execution error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown automation error"
    return NextResponse.json(
      {
        success: false,
        message: `Automation failed: ${errorMessage}`,
        error_code: "AUTOMATION_FAILED",
      },
      { status: 500 },
    )
  }
}

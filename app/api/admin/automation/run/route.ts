import { requireAdminSession } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const supabase = getAdminClient()

    const { error: connectionError } = await supabase.from("agents").select("count", { count: "exact", head: true })

    if (connectionError) {
      console.error("[v0] Database connection error:", connectionError)
      throw new Error(`Database connection failed: ${connectionError.message}`)
    }


    // Try to run automation using RPC function
    const { data: automationResult, error: automationError } = await supabase.rpc(
      "run_agent_deactivation_automation",
      {
        p_run_type: "manual",
      },
    )

    if (automationError) {
      console.error("[v0] Automation RPC error:", automationError)
      console.error("[v0] Error code:", automationError.code)
      console.error("[v0] Error message:", automationError.message)

      // Handle specific RPC errors gracefully
      if (automationError.code === "PGRST202") {
        return NextResponse.json(
          {
            success: false,
            message: "Automation function not found. Please ensure database migrations are up to date.",
            error_code: "FUNCTION_NOT_FOUND",
          },
          { status: 404 },
        )
      } else if (automationError.code === "PGRST301") {
        return NextResponse.json(
          {
            success: false,
            message: "Automation function execution failed. Check function permissions.",
            error_code: "FUNCTION_EXECUTION_FAILED",
          },
          { status: 500 },
        )
      } else {
        // For other errors, still return a response instead of throwing
        console.warn("[v0] Continuing despite RPC error, will return partial result")
      }
    }


    // Handle successful or partial response
    let result = {
      success: automationError ? false : true,
      message: automationError
        ? "Automation completed with warnings"
        : "Automation completed successfully",
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
    console.error("[v0] Automation execution error:", error)
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

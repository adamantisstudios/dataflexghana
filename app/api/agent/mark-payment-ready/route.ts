import { NextRequest, NextResponse } from "next/server"
import { setPaymentVerified } from "@/lib/payment-gate"

/**
 * Endpoint to mark manual payment as complete
 * Called by registration-payment page after manual payment dialog
 * Sets payment verification cookie for access to /agent/register
 */

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Mark payment ready endpoint called")

    const { agentId } = await request.json()

    if (!agentId || typeof agentId !== "string") {
      console.error("[v0] Missing or invalid agent ID")
      return NextResponse.json(
        { error: "Invalid agent ID", success: false },
        { status: 400 }
      )
    }

    // Set payment verification cookie
    const success = await setPaymentVerified(agentId)

    if (!success) {
      console.error("[v0] Failed to set payment verification for agent:", agentId)
      return NextResponse.json(
        { error: "Failed to mark payment", success: false },
        { status: 500 }
      )
    }

    console.log(`[v0] Successfully marked payment for agent ${agentId}`)
    return NextResponse.json({
      success: true,
      message: "Payment marked ready. Redirecting to registration form.",
    })
  } catch (error) {
    console.error("[v0] Error in mark-payment-ready endpoint:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An error occurred",
        success: false,
      },
      { status: 500 }
    )
  }
}

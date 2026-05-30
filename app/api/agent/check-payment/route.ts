import { NextRequest, NextResponse } from "next/server"
import { verifyPaymentGate } from "@/lib/payment-gate"

/**
 * Endpoint to check if user has verified payment
 * Used by /agent/register page to gate access
 * Returns {verified: true} if payment cookie exists, {verified: false} otherwise
 */

export async function GET(request: NextRequest) {
  try {

    // Check if payment was verified (cookie exists)
    const agentId = await verifyPaymentGate()

    if (agentId) {
      return NextResponse.json({
        verified: true,
        agentId,
      })
    }

    return NextResponse.json({
      verified: false,
      message: "Payment verification required. Please complete payment first.",
    })
  } catch (error) {
    console.error("[v0] Error checking payment status:", error)
    return NextResponse.json(
      {
        verified: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    )
  }
}

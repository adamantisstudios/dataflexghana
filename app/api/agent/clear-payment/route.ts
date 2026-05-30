import { NextRequest, NextResponse } from "next/server"
import { clearPaymentGate } from "@/lib/payment-gate"

/**
 * POST /api/agent/clear-payment
 * Clears the payment verification flag after successful registration
 * This endpoint is called by the client after form submission
 */
export async function POST(req: NextRequest) {
  try {
    const cleared = await clearPaymentGate()
    
    if (cleared) {
      return NextResponse.json({
        success: true,
        message: "Payment verification cleared after successful registration",
      })
    } else {
      console.warn("[v0] Failed to clear payment gate")
      return NextResponse.json(
        {
          success: false,
          message: "Failed to clear payment verification",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[v0] Error in clear-payment endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}

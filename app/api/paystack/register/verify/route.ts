import { NextRequest, NextResponse } from "next/server"
import { setPaymentVerified } from "@/lib/payment-gate"

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    reference: string
    amount: number
    status: string
    metadata: {
      agent_id: string
      agent_name: string
      registration_type: string
    }
  }
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""

export async function POST(request: NextRequest) {
  try {

    if (!PAYSTACK_SECRET_KEY) {
      console.error("[v0] PAYSTACK_SECRET_KEY is not configured")
      return NextResponse.json(
        { error: "Payment gateway is not configured", success: false },
        { status: 500 }
      )
    }

    const { reference } = await request.json()

    if (!reference) {
      console.error("[v0] Missing reference for verification")
      return NextResponse.json(
        { error: "Missing verification information", success: false },
        { status: 400 }
      )
    }


    // Verify with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    if (!paystackResponse.ok) {
      const errorText = await paystackResponse.text()
      console.error("[v0] Paystack verification error:", errorText)
      return NextResponse.json(
        { error: "Failed to verify payment", success: false },
        { status: 500 }
      )
    }

    const paystackData: PaystackVerifyResponse = await paystackResponse.json()

    if (!paystackData.status) {
      console.error("[v0] Paystack verification unsuccessful:", paystackData.message)
      return NextResponse.json(
        { error: paystackData.message || "Payment verification failed", success: false },
        { status: 400 }
      )
    }

    // Check if payment is successful
    if (paystackData.data.status !== "success") {
      console.warn(`[v0] Payment status is ${paystackData.data.status}, not success`)
      return NextResponse.json(
        { error: `Payment status: ${paystackData.data.status}`, success: false },
        { status: 400 }
      )
    }


    // Payment verification successful - no database updates required
    // Agent will see payment-success page and can contact admin via WhatsApp
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully. Please register and contact admin via WhatsApp to complete setup.",
      data: {
        reference: paystackData.data.reference,
        amount: paystackData.data.amount,
        agent_name: paystackData.data.metadata.agent_name,
      },
    })
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred during verification", success: false },
      { status: 500 }
    )
  }
}

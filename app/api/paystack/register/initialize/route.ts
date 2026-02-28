import { NextRequest, NextResponse } from "next/server"

interface PaystackInitializeRequest {
  agent_id: string
  agent_name: string
  amount: number
  email: string
}

interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""
const CALLBACK_URL = process.env.NEXT_PUBLIC_APP_URL || "https://dataflexghana.com"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Paystack registration payment initialize request received")

    if (!PAYSTACK_SECRET_KEY) {
      console.error("[v0] PAYSTACK_SECRET_KEY is not configured")
      return NextResponse.json(
        { error: "Payment gateway is not configured. Please contact admin." },
        { status: 500 }
      )
    }

    const body: PaystackInitializeRequest = await request.json()
    const { agent_id, agent_name, amount, email } = body

    if (!agent_id || !agent_name || !amount || !email) {
      console.error("[v0] Missing required fields for payment initialization")
      return NextResponse.json(
        { error: "Missing required payment information" },
        { status: 400 }
      )
    }

    console.log(`[v0] Initializing registration payment for agent: ${agent_id}, amount: ${amount}`)

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount, // Amount in pesewas (₵50 = 5000 pesewas)
        metadata: {
          agent_id,
          agent_name,
          registration_type: "agent_registration",
          transaction_type: "registration_fee",
        },
        callback_url: `${CALLBACK_URL}/agent/registration-payment?reference=`,
      }),
    })

    if (!paystackResponse.ok) {
      const errorText = await paystackResponse.text()
      console.error("[v0] Paystack API error:", errorText)
      return NextResponse.json(
        { error: "Failed to process payment request. Please try again." },
        { status: 500 }
      )
    }

    const paystackData: PaystackInitializeResponse = await paystackResponse.json()

    if (!paystackData.status) {
      console.error("[v0] Paystack returned unsuccessful status:", paystackData.message)
      return NextResponse.json(
        { error: paystackData.message || "Payment initialization failed" },
        { status: 400 }
      )
    }

    console.log(`[v0] Payment initialized successfully. Reference: ${paystackData.data.reference}`)

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error("[v0] Payment initialization error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred during payment initialization" },
      { status: 500 }
    )
  }
}

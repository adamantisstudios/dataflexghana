import { NextRequest, NextResponse } from "next/server"

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

if (!PAYSTACK_SECRET_KEY) {
  throw new Error(
    "PAYSTACK_SECRET_KEY environment variable is not set. Set it in your .env file.",
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, phone, reference, service } = body

    if (!email || !amount || !phone || !reference || !service) {
      return NextResponse.json(
        {
          error: "Missing required fields: email, amount, phone, reference, service",
        },
        { status: 400 },
      )
    }

    // Initialize payment with Paystack
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount, // amount in kobo (smallest currency unit)
        metadata: {
          phone,
          reference,
          service,
          timestamp: new Date().toISOString(),
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/paystack/callback`,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Paystack initialization error:", data)
      return NextResponse.json(
        {
          error: data.message || "Failed to initialize payment",
        },
        { status: response.status },
      )
    }

    // Return authorization URL for client-side redirect
    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    })
  } catch (error) {
    console.error("Paystack API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process payment initialization",
      },
      { status: 500 },
    )
  }
}
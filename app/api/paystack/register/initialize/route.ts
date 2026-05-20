import { type NextRequest, NextResponse } from "next/server"
import {
  AGENT_REGISTRATION_PAYMENT_TYPE,
  getRegistrationPaystackCallbackUrl,
} from "@/lib/paystack-registration"

interface PaystackInitializeRequest {
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

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        {
          error:
            "Payment gateway is not configured. PAYSTACK_SECRET_KEY missing. Please contact admin.",
        },
        { status: 500 },
      )
    }

    const body: PaystackInitializeRequest = await request.json()
    const { agent_name, amount, email } = body

    if (!agent_name || !amount || !email) {
      return NextResponse.json(
        { error: "Missing required payment information (agent_name, amount, email)." },
        { status: 400 },
      )
    }

    const callbackUrl = getRegistrationPaystackCallbackUrl(request)

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        metadata: {
          agent_name,
          email,
          registration_type: AGENT_REGISTRATION_PAYMENT_TYPE,
          payment_type: AGENT_REGISTRATION_PAYMENT_TYPE,
          transaction_type: "registration_fee",
        },
        callback_url: callbackUrl,
      }),
    })

    if (!paystackResponse.ok) {
      const errorText = await paystackResponse.text()
      console.error("[paystack register init]", paystackResponse.status, errorText)
      return NextResponse.json(
        { error: `Paystack error (${paystackResponse.status}): ${errorText}` },
        { status: 500 },
      )
    }

    const paystackData: PaystackInitializeResponse = await paystackResponse.json()

    if (!paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || "Payment initialization failed" },
        { status: 400 },
      )
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
      callback_url: callbackUrl,
    })
  } catch (error) {
    console.error("[paystack register init]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment initialization failed" },
      { status: 500 },
    )
  }
}

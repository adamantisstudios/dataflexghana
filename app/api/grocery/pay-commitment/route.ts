import { type NextRequest, NextResponse } from "next/server"
import {
  GROCERY_COMMITMENT_AMOUNT_KOBO,
  GROCERY_COMMITMENT_SERVICE,
  generateGroceryPaymentReference,
  getGroceryPaystackCallbackUrl,
  getPaystackSecretKey,
} from "@/lib/grocery-paystack"

export const dynamic = "force-dynamic"

const PAYSTACK_BASE_URL = "https://api.paystack.co"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim()
    const full_name = String(body.full_name ?? body.name ?? "").trim()
    const phone = String(body.phone ?? "").trim()

    if (!email || !full_name || !phone) {
      return NextResponse.json(
        { success: false, error: "Name, email, and phone are required to pay the commitment fee" },
        { status: 400 },
      )
    }

    const reference = generateGroceryPaymentReference()
    const secret = getPaystackSecretKey()

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: GROCERY_COMMITMENT_AMOUNT_KOBO,
        reference,
        callback_url: getGroceryPaystackCallbackUrl(request.url),
        metadata: {
          service: GROCERY_COMMITMENT_SERVICE,
          payment_type: GROCERY_COMMITMENT_SERVICE,
          source: "foodandGroceries",
          full_name,
          phone,
          timestamp: new Date().toISOString(),
        },
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.status) {
      console.error("[api/grocery/pay-commitment]", data)
      return NextResponse.json(
        { success: false, error: data.message || "Failed to initialize payment" },
        { status: response.status || 500 },
      )
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    })
  } catch (err) {
    console.error("[api/grocery/pay-commitment]", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Payment initialization failed",
      },
      { status: 500 },
    )
  }
}

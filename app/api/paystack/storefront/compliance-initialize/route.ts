import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import {
  COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
  COMPLIANCE_FORM_SOLE_PROPRIETORSHIP_ITEM_ID,
  complianceFormAdminPrice,
} from "@/lib/storefront-catalog"

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

const STOREFRONT_ORIGIN = (
  process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN || "https://referralpowerhouse.vercel.app"
).replace(/\/$/, "")

const PAYSTACK_STOREFRONT_CALLBACK_URL = `${STOREFRONT_ORIGIN}/api/paystack/storefront/callback`

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { email, agent_id, form_type, store_name, store_segment } = body

    if (!email || !agent_id) {
      return NextResponse.json({ error: "email and agent_id are required" }, { status: 400 })
    }

    const formType = form_type || COMPLIANCE_FORM_SOLE_PROPRIETORSHIP
    if (formType !== COMPLIANCE_FORM_SOLE_PROPRIETORSHIP) {
      return NextResponse.json({ error: "Unsupported form type" }, { status: 400 })
    }

    const db = getAdminClient()
    const { data: setting } = await db
      .from("agent_store_settings")
      .select("is_visible")
      .eq("agent_id", agent_id)
      .eq("item_type", "compliance_form")
      .in("item_id", [COMPLIANCE_FORM_SOLE_PROPRIETORSHIP_ITEM_ID, COMPLIANCE_FORM_SOLE_PROPRIETORSHIP])
      .maybeSingle()

    if (!setting?.is_visible) {
      return NextResponse.json({ error: "This form is not available on this store" }, { status: 400 })
    }

    const price = complianceFormAdminPrice()
    const amountKobo = Math.round(price * 100)
    const reference = `SFC-${String(agent_id).slice(0, 8)}-${Date.now()}`

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference,
        metadata: {
          source: "storefront",
          order_type: "compliance",
          agent_id: String(agent_id),
          form_type: formType,
          store_name: String(store_name || "Store"),
          store_segment: String(store_segment || ""),
          cart_total: String(price),
        },
        callback_url: PAYSTACK_STOREFRONT_CALLBACK_URL,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Paystack init failed" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      amount: price,
    })
  } catch (error) {
    console.error("compliance-initialize:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

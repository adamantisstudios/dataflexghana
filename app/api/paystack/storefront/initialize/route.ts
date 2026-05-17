import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { email, agent_id, data_bundle_id, customer_phone } = body

    if (!email || !agent_id || !data_bundle_id || !customer_phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: bundle, error: bundleError } = await db
      .from("data_bundles")
      .select("id, name, price, is_active")
      .eq("id", data_bundle_id)
      .single()

    if (bundleError || !bundle?.is_active) {
      return NextResponse.json({ error: "Invalid bundle" }, { status: 400 })
    }

    const { data: setting } = await db
      .from("agent_store_settings")
      .select("custom_margin, is_visible")
      .eq("agent_id", agent_id)
      .eq("item_id", data_bundle_id)
      .eq("item_type", "data_bundle")
      .maybeSingle()

    if (!setting?.is_visible) {
      return NextResponse.json({ error: "Bundle not available on this store" }, { status: 400 })
    }

    const baseCost = Number(bundle.price)
    const agentMarkup = Number(setting.custom_margin ?? 0)
    const totalPaid = baseCost + agentMarkup
    const amountKobo = Math.round(totalPaid * 100)

    const reference = `SF-${agent_id.slice(0, 8)}-${Date.now()}`

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

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
          agent_id,
          data_bundle_id,
          customer_phone,
          base_cost: baseCost,
          agent_markup: agentMarkup,
          total_paid: totalPaid,
        },
        callback_url: `${appUrl}/api/paystack/storefront/callback`,
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
      total_paid: totalPaid,
    })
  } catch (error) {
    console.error("storefront initialize:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

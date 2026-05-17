import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import type { StorefrontCartItemMeta } from "@/lib/storefront-order-whatsapp"

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

type CartItemInput = {
  data_bundle_id: string
  customer_phone: string
}

function normalizeProvider(p: string): string {
  const u = p?.toUpperCase() || ""
  if (u.includes("MTN")) return "MTN"
  if (u.includes("TELECEL") || u.includes("VODAFONE")) return "Telecel"
  if (u.includes("AIRTEL") || u.includes("TIGO")) return "AirtelTigo"
  return p || "Unknown"
}

async function resolveCartItem(
  db: ReturnType<typeof getAdminClient>,
  agentId: string,
  input: CartItemInput,
): Promise<StorefrontCartItemMeta | { error: string }> {
  const phone = String(input.customer_phone || "").trim()
  if (!phone) return { error: "Each item needs a phone number" }

  const bundleId = String(input.data_bundle_id || "").trim()
  if (!bundleId) return { error: "Invalid bundle in cart" }

  const { data: bundle, error: bundleError } = await db
    .from("data_bundles")
    .select("id, name, provider, size_gb, price, is_active")
    .eq("id", bundleId)
    .single()

  if (bundleError || !bundle?.is_active) {
    return { error: "One or more bundles are no longer available" }
  }

  const { data: setting } = await db
    .from("agent_store_settings")
    .select("custom_margin, is_visible")
    .eq("agent_id", agentId)
    .eq("item_id", bundleId)
    .eq("item_type", "data_bundle")
    .maybeSingle()

  if (!setting?.is_visible) {
    return { error: "One or more bundles are not available on this store" }
  }

  const baseCost = Number(bundle.price)
  const agentMarkup = Number(setting.custom_margin ?? 0)
  const totalPaid = baseCost + agentMarkup

  return {
    data_bundle_id: bundle.id,
    customer_phone: phone,
    base_cost: baseCost,
    agent_markup: agentMarkup,
    total_paid: totalPaid,
    bundle_name: bundle.name,
    network: normalizeProvider(bundle.provider),
    size_gb: Number(bundle.size_gb ?? 0),
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { email, agent_id, items, store_name } = body

    const cartInputs: CartItemInput[] = Array.isArray(items)
      ? items
      : body.data_bundle_id && body.customer_phone
        ? [{ data_bundle_id: body.data_bundle_id, customer_phone: body.customer_phone }]
        : []

    if (!email || !agent_id || cartInputs.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: email, agent_id, and at least one cart item" },
        { status: 400 },
      )
    }

    const db = getAdminClient()
    const resolved: StorefrontCartItemMeta[] = []

    for (const input of cartInputs) {
      const result = await resolveCartItem(db, agent_id, input)
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      resolved.push(result)
    }

    const cartTotal = resolved.reduce((sum, item) => sum + item.total_paid, 0)
    const amountKobo = Math.round(cartTotal * 100)

    if (amountKobo < 1) {
      return NextResponse.json({ error: "Cart total must be greater than zero" }, { status: 400 })
    }

    const reference = `SF-${String(agent_id).slice(0, 8)}-${Date.now()}`

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    let resolvedStoreName = String(store_name || "").trim()
    if (!resolvedStoreName) {
      const { data: profile } = await db
        .from("agent_store_profiles")
        .select("store_name")
        .eq("agent_id", agent_id)
        .maybeSingle()
      resolvedStoreName = profile?.store_name || "Store"
    }

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
          order_type: "storefront_cart",
          agent_id: String(agent_id),
          store_name: resolvedStoreName,
          cart_total: String(cartTotal),
          items_json: JSON.stringify(resolved),
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
      total_paid: cartTotal,
      item_count: resolved.length,
    })
  } catch (error) {
    console.error("storefront initialize:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

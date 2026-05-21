import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import type { StorefrontCartItemMeta } from "@/lib/storefront-order-whatsapp"
import type { WholesaleCartItemMeta } from "@/lib/storefront-paystack-meta"
import type { BuyerDetails } from "@/lib/storefront-catalog"
import { getStorefrontPaystackCallbackUrl } from "@/lib/storefront-utils"

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

type CartItemInput = {
  data_bundle_id: string
  customer_phone: string
}

type WholesaleCartInput = {
  wholesale_product_id: string
  quantity: number
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

async function resolveWholesaleItem(
  db: ReturnType<typeof getAdminClient>,
  agentId: string,
  input: WholesaleCartInput,
): Promise<WholesaleCartItemMeta | { error: string }> {
  const productId = String(input.wholesale_product_id || "").trim()
  const quantity = Math.max(1, Math.min(99, Number(input.quantity) || 1))

  const { data: product, error: productError } = await db
    .from("wholesale_products")
    .select("id, name, price, is_active, quantity")
    .eq("id", productId)
    .single()

  if (productError || !product?.is_active || Number(product.quantity) < quantity) {
    return { error: "One or more products are unavailable" }
  }

  const { data: setting } = await db
    .from("agent_store_settings")
    .select("custom_margin, is_visible")
    .eq("agent_id", agentId)
    .eq("item_id", productId)
    .eq("item_type", "wholesale_product")
    .maybeSingle()

  if (!setting?.is_visible) {
    return { error: "One or more products are not on this store" }
  }

  const unitBase = Number(product.price)
  const unitMarkup = Number(setting.custom_margin ?? 0)
  const unitTotal = unitBase + unitMarkup

  return {
    wholesale_product_id: product.id,
    quantity,
    base_cost: unitBase,
    agent_markup: unitMarkup,
    total_paid: unitTotal * quantity,
    product_name: product.name,
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const body = await request.json()
    const {
      email,
      agent_id,
      items,
      store_name,
      store_slug: storeSlugInput,
      store_segment: storeSegmentInput,
      order_type,
      buyer_details,
    } = body

    const db = getAdminClient()

    if (order_type === "wholesale") {
      const wholesaleInputs: WholesaleCartInput[] = Array.isArray(items) ? items : []
      const buyer = buyer_details as BuyerDetails | undefined

      if (!email || !agent_id || wholesaleInputs.length === 0) {
        return NextResponse.json(
          { error: "email, agent_id, and wholesale cart items are required" },
          { status: 400 },
        )
      }

      if (
        !buyer?.full_name?.trim() ||
        !buyer?.location?.trim() ||
        !buyer?.address?.trim() ||
        !buyer?.contact_number?.trim()
      ) {
        return NextResponse.json({ error: "Complete buyer delivery details are required" }, { status: 400 })
      }

      const resolvedWholesale: WholesaleCartItemMeta[] = []
      for (const input of wholesaleInputs) {
        const result = await resolveWholesaleItem(db, agent_id, input)
        if ("error" in result) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        resolvedWholesale.push(result)
      }

      const cartTotal = resolvedWholesale.reduce((sum, item) => sum + item.total_paid, 0)
      const amountKobo = Math.round(cartTotal * 100)
      if (amountKobo < 1) {
        return NextResponse.json({ error: "Cart total must be greater than zero" }, { status: 400 })
      }

      const reference = `SFW-${String(agent_id).slice(0, 8)}-${Date.now()}`
      const { data: profile } = await db
        .from("agent_store_profiles")
        .select("store_name, store_slug")
        .eq("agent_id", agent_id)
        .maybeSingle()

      const storeSegment = String(storeSegmentInput || storeSlugInput || profile?.store_slug || "").trim()

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
            order_type: "wholesale",
            agent_id: String(agent_id),
            store_name: String(store_name || profile?.store_name || "Store"),
            store_segment: storeSegment,
            cart_total: String(cartTotal),
            wholesale_items_json: JSON.stringify(resolvedWholesale),
            buyer_details_json: JSON.stringify(buyer),
          },
          callback_url: getStorefrontPaystackCallbackUrl(request),
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
      })
    }

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

    const { data: profile } = await db
      .from("agent_store_profiles")
      .select("store_name, store_slug")
      .eq("agent_id", agent_id)
      .maybeSingle()

    let resolvedStoreName = String(store_name || profile?.store_name || "").trim()
    if (!resolvedStoreName) resolvedStoreName = "Store"

    const storeSegment = String(storeSegmentInput || storeSlugInput || "").trim()
    const storeSlug = storeSegment || (profile?.store_slug ? String(profile.store_slug) : "")

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
          order_type: "data_bundle",
          agent_id: String(agent_id),
          store_name: resolvedStoreName,
          store_slug: storeSlug,
          store_segment: storeSegment || storeSlug,
          cart_total: String(cartTotal),
          items_json: JSON.stringify(resolved),
        },
        callback_url: getStorefrontPaystackCallbackUrl(request),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Paystack init failed" }, { status: 500 })
    }

    console.info("[storefront initialize] data_bundle payment", {
      agent_id,
      reference: data.data.reference,
      callback_url: getStorefrontPaystackCallbackUrl(request),
      item_count: resolved.length,
    })

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

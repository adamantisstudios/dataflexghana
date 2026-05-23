import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { getStorefrontPaystackCallbackUrl } from "@/lib/storefront-utils"
import type { FarmCartLineMeta } from "@/lib/farm-capture"

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

type CartInput = { listing_id: string; quantity: number }

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const body = await request.json()
    const items: CartInput[] = Array.isArray(body.items) ? body.items : []
    const buyer_name = String(body.buyer_name ?? "").trim()
    const buyer_phone = String(body.buyer_phone ?? "").trim()
    const buyer_email = body.buyer_email ? String(body.buyer_email).trim() : ""
    const delivery_address = String(body.delivery_address ?? "").trim()
    const delivery_fee = Number(body.delivery_fee ?? 0)
    const store_segment = body.store_segment ? String(body.store_segment).trim() : ""
    const filter_agent_id = body.agent_id ? String(body.agent_id).trim() : ""

    if (!buyer_name || !buyer_phone || !delivery_address || items.length === 0) {
      return NextResponse.json(
        { error: "buyer_name, buyer_phone, delivery_address, and cart items are required" },
        { status: 400 },
      )
    }

    const db = getAdminClient()
    const resolved: FarmCartLineMeta[] = []
    let primaryAgentId = filter_agent_id

    for (const input of items) {
      const listingId = String(input.listing_id || "").trim()
      const quantity = Number(input.quantity)
      if (!listingId || !Number.isFinite(quantity) || quantity <= 0) {
        return NextResponse.json({ error: "Invalid cart item" }, { status: 400 })
      }

      const { data: listing, error } = await db
        .from("farm_listings")
        .select("*")
        .eq("id", listingId)
        .eq("is_published", true)
        .maybeSingle()

      if (error || !listing) {
        return NextResponse.json({ error: "One or more items are unavailable" }, { status: 400 })
      }

      if (filter_agent_id && String(listing.agent_id) !== filter_agent_id) {
        return NextResponse.json({ error: "Item not available on this store" }, { status: 400 })
      }

      const available = Number(listing.quantity_available)
      if (quantity > available) {
        return NextResponse.json(
          { error: `Only ${available} ${listing.unit} available for ${listing.produce_name}` },
          { status: 400 },
        )
      }

      const unitPrice = Number(listing.retail_price)
      if (unitPrice <= 0) {
        return NextResponse.json({ error: "Item not priced yet" }, { status: 400 })
      }

      if (!primaryAgentId) primaryAgentId = String(listing.agent_id)

      resolved.push({
        listing_id: listingId,
        quantity,
        unit_price: unitPrice,
        line_total: Number((unitPrice * quantity).toFixed(2)),
        produce_name: String(listing.produce_name),
        agent_id: String(listing.agent_id),
        admin_markup_per_unit: Number(listing.admin_markup ?? 0),
      })
    }

    const subtotal = resolved.reduce((s, i) => s + i.line_total, 0)
    const cartTotal = Number((subtotal + Math.max(0, delivery_fee)).toFixed(2))
    const amountKobo = Math.round(cartTotal * 100)

    if (amountKobo < 1) {
      return NextResponse.json({ error: "Cart total must be greater than zero" }, { status: 400 })
    }

    const email =
      buyer_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer_email)
        ? buyer_email
        : `farm+${buyer_phone.replace(/\D/g, "").slice(-8)}@dataflexghana.com`

    const metadata = {
      order_type: "farm_produce",
      agent_id: primaryAgentId,
      store_segment: store_segment || primaryAgentId,
      cart_total: cartTotal,
      delivery_fee: delivery_fee,
      buyer_name,
      buyer_phone,
      buyer_email: buyer_email || null,
      delivery_address,
      farm_items_json: JSON.stringify(resolved),
    }

    const paystackRes = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: "GHS",
        callback_url: getStorefrontPaystackCallbackUrl(request),
        metadata,
      }),
    })

    const paystackData = await paystackRes.json()
    if (!paystackRes.ok || !paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || "Failed to initialize payment" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      amount: cartTotal,
    })
  } catch (err) {
    console.error("[paystack farmers initialize]", err)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

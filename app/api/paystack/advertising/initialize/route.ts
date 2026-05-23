import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { getStorefrontPaystackCallbackUrl } from "@/lib/storefront-utils"

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const body = await request.json()
    const agent_id = String(body.agent_id ?? "").trim()
    const package_id = String(body.package_id ?? "").trim()
    const customer_name = String(body.customer_name ?? "").trim()
    const customer_phone = String(body.customer_phone ?? "").trim()
    const customer_email = body.customer_email ? String(body.customer_email).trim() : ""
    const customer_business = body.customer_business ? String(body.customer_business).trim() : ""
    const ad_message = body.ad_message ? String(body.ad_message).trim() : ""
    const store_segment = body.store_segment ? String(body.store_segment).trim() : ""

    if (!agent_id || !package_id || !customer_name || !customer_phone) {
      return NextResponse.json(
        { error: "agent_id, package_id, customer_name, and customer_phone are required" },
        { status: 400 },
      )
    }

    const db = getAdminClient()

    const { data: setting } = await db
      .from("agent_store_settings")
      .select("is_visible")
      .eq("agent_id", agent_id)
      .eq("item_id", package_id)
      .eq("item_type", "ad_package")
      .maybeSingle()

    if (!setting?.is_visible) {
      return NextResponse.json({ error: "This advertising package is not available on this store" }, { status: 400 })
    }

    const { data: pkg, error: pkgError } = await db
      .from("ad_packages")
      .select("*")
      .eq("id", package_id)
      .eq("is_active", true)
      .maybeSingle()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: "Package not found or inactive" }, { status: 404 })
    }

    const priceGhs = Number(pkg.price)
    const amountKobo = Math.round(priceGhs * 100)
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
      return NextResponse.json({ error: "Invalid package price" }, { status: 400 })
    }

    const email =
      customer_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)
        ? customer_email
        : `ads+${agent_id.slice(0, 8)}@dataflexghana.com`

    const metadata = {
      agent_id,
      order_type: "ad_package",
      package_id,
      station_name: pkg.station_name,
      package_name: pkg.package_name,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      customer_business: customer_business || null,
      ad_message: ad_message || null,
      cart_total: priceGhs,
      amount: priceGhs,
      store_segment: store_segment || agent_id,
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
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
      amount: priceGhs,
    })
  } catch (err) {
    console.error("[paystack advertising initialize]", err)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

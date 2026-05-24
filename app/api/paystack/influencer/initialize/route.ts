import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { getStorefrontPaystackCallbackUrl } from "@/lib/storefront-utils"
import { calculateInfluencerFees } from "@/lib/influencer-types"

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
    const client_name = String(body.client_name ?? "").trim()
    const client_phone = String(body.client_phone ?? "").trim()
    const client_email = body.client_email ? String(body.client_email).trim() : ""
    const requirements = String(body.requirements ?? "").trim()
    const store_segment = body.store_segment ? String(body.store_segment).trim() : ""

    if (!agent_id || !package_id || !client_name || !client_phone || !requirements) {
      return NextResponse.json(
        { error: "agent_id, package_id, client_name, client_phone, and requirements are required" },
        { status: 400 },
      )
    }

    const db = getAdminClient()

    const { data: profile } = await db
      .from("influencer_profiles")
      .select("id, approved")
      .eq("agent_id", agent_id)
      .eq("approved", true)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: "Influencer profile not available on this store" }, { status: 400 })
    }

    const { data: pkg, error: pkgError } = await db
      .from("influencer_packages")
      .select("*")
      .eq("id", package_id)
      .eq("profile_id", profile.id)
      .eq("is_active", true)
      .maybeSingle()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: "Package not found or inactive" }, { status: 404 })
    }

    const packagePrice = Number(pkg.price)
    const fees = calculateInfluencerFees(packagePrice)
    const amountKobo = Math.round(fees.total_price * 100)
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
      return NextResponse.json({ error: "Invalid package price" }, { status: 400 })
    }

    const email =
      client_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)
        ? client_email
        : `influencer+${agent_id.slice(0, 8)}@dataflexghana.com`

    const metadata = {
      agent_id,
      order_type: "influencer_order",
      package_id,
      package_title: pkg.title,
      package_price: fees.package_price,
      client_name,
      client_phone,
      client_email: client_email || null,
      requirements,
      platform_fee_client: fees.platform_fee_client,
      platform_fee_influencer: fees.platform_fee_influencer,
      influencer_payout: fees.influencer_payout,
      cart_total: fees.total_price,
      amount: fees.total_price,
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
      amount: fees.total_price,
      fees,
    })
  } catch (err) {
    console.error("[paystack influencer initialize]", err)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

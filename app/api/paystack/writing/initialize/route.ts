import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { getStorefrontPaystackCallbackUrl } from "@/lib/storefront-utils"
import { buildCvFieldsPayload } from "@/lib/writing-server"
import type { CvFields } from "@/lib/writing-types"

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
    const service_id = String(body.service_id ?? "").trim()
    const customer_name = String(body.customer_name ?? "").trim()
    const customer_phone = String(body.customer_phone ?? "").trim()
    const customer_email = body.customer_email ? String(body.customer_email).trim() : ""
    const instructions = body.instructions ? String(body.instructions).trim() : ""
    const attached_file_url = body.attached_file_url ? String(body.attached_file_url).trim() : ""
    const store_segment = body.store_segment ? String(body.store_segment).trim() : ""
    const cv_fields: CvFields = body.cv_fields && typeof body.cv_fields === "object" ? body.cv_fields : {}

    if (!agent_id || !service_id || !customer_name || !customer_phone) {
      return NextResponse.json(
        { error: "agent_id, service_id, customer_name, and customer_phone are required" },
        { status: 400 },
      )
    }

    const db = getAdminClient()

    const { data: setting } = await db
      .from("agent_store_settings")
      .select("is_visible")
      .eq("agent_id", agent_id)
      .eq("item_id", service_id)
      .eq("item_type", "writing_service")
      .maybeSingle()

    if (!setting?.is_visible) {
      return NextResponse.json({ error: "This writing service is not available on this store" }, { status: 400 })
    }

    const { data: svc, error: svcError } = await db
      .from("writing_services")
      .select("*")
      .eq("id", service_id)
      .eq("is_active", true)
      .maybeSingle()

    if (svcError || !svc) {
      return NextResponse.json({ error: "Service not found or inactive" }, { status: 404 })
    }

    const priceGhs = Number(svc.price)
    const amountKobo = Math.round(priceGhs * 100)
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
      return NextResponse.json({ error: "Invalid service price" }, { status: 400 })
    }

    const email =
      customer_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)
        ? customer_email
        : `writing+${agent_id.slice(0, 8)}@dataflexghana.com`

    const cvPayload = buildCvFieldsPayload(cv_fields)

    const metadata = {
      agent_id,
      order_type: "writing_service",
      service_id,
      service_name: svc.service_name,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      instructions: instructions || null,
      cv_fields_json: JSON.stringify(cvPayload),
      attached_file_url: attached_file_url || null,
      agent_commission: Number(svc.agent_commission ?? 0),
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
    console.error("[paystack writing initialize]", err)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

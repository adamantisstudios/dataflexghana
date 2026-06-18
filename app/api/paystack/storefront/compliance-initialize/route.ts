import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import {
  COMPLIANCE_FORM_SOLE_PROPRIETORSHIP,
  COMPLIANCE_SOLE_PROPRIETORSHIP_AMOUNT_KOBO,
  complianceFormAdminPrice,
} from "@/lib/storefront-catalog"
import {
  getStorefrontPaystackCallbackUrl,
  getStorefrontServerOrigin,
} from "@/lib/storefront-utils"

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export const dynamic = "force-dynamic"

function isValidStorefrontEmail(email: string): boolean {
  const t = email.trim()
  if (t.length < 5 || t.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

/** Digits-only length 9–15 (local or international). */
function isValidStorefrontPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 9 && digits.length <= 15
}

function isAllowedCallbackUrl(callbackUrl: string, request: NextRequest): boolean {
  try {
    const parsed = new URL(callbackUrl)
    if (parsed.pathname !== "/api/paystack/storefront/callback") return false
    const allowedOrigins = new Set<string>()
    allowedOrigins.add(new URL(getStorefrontServerOrigin(request)).origin)
    const requestOrigin = request.headers.get("origin") || request.nextUrl.origin
    if (requestOrigin) allowedOrigins.add(new URL(requestOrigin).origin)
    return allowedOrigins.has(parsed.origin)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const body = await request.json()
    const {
      email: emailRaw,
      phone: phoneRaw,
      agent_id,
      form_type,
      store_name,
      store_segment,
      callback_url: callbackFromClient,
    } = body

    const email = typeof emailRaw === "string" ? emailRaw.trim() : ""
    const phone = typeof phoneRaw === "string" ? phoneRaw.trim() : ""

    if (!email || !phone || !agent_id) {
      return NextResponse.json(
        { error: "email, phone, and agent_id are required" },
        { status: 400 },
      )
    }

    if (!isValidStorefrontEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    if (!isValidStorefrontPhone(phone)) {
      return NextResponse.json(
        { error: "Enter a valid phone number (9–15 digits)" },
        { status: 400 },
      )
    }

    const formType = form_type || COMPLIANCE_FORM_SOLE_PROPRIETORSHIP
    if (formType !== COMPLIANCE_FORM_SOLE_PROPRIETORSHIP) {
      return NextResponse.json({ error: "Unsupported form type" }, { status: 400 })
    }

    const priceGhs = complianceFormAdminPrice()
    const expectedKobo = COMPLIANCE_SOLE_PROPRIETORSHIP_AMOUNT_KOBO
    const amountKobo = expectedKobo

    const db = getAdminClient()
    const { data: complianceSettings, error: settingsError } = await db
      .from("agent_store_settings")
      .select("is_visible")
      .eq("agent_id", agent_id)
      .eq("item_type", "compliance_form")

    if (settingsError) {
      console.error("compliance-initialize settings:", settingsError)
      return NextResponse.json({ error: settingsError.message }, { status: 500 })
    }

    const isAvailable = (complianceSettings ?? []).some((s) => s.is_visible === true)
    if (!isAvailable) {
      return NextResponse.json(
        { error: "This form is not available on this store. Enable it in Referral Hub → Marketplace → Compliance." },
        { status: 400 },
      )
    }

    let callbackUrl = getStorefrontPaystackCallbackUrl(request)
    if (typeof callbackFromClient === "string" && callbackFromClient.trim()) {
      const trimmed = callbackFromClient.trim()
      if (!isAllowedCallbackUrl(trimmed, request)) {
        return NextResponse.json({ error: "Invalid callback_url" }, { status: 400 })
      }
      callbackUrl = trimmed
    }

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
          item_id: "c0ffee00-0001-4001-8001-000000000001",
          form_type: formType,
          store_name: String(store_name || "Store"),
          store_segment: String(store_segment || ""),
          cart_total: String(priceGhs),
          amount_kobo: String(amountKobo),
          customer_email: email,
          customer_phone: phone.replace(/\D/g, ""),
        },
        callback_url: callbackUrl,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Paystack init failed" },
        { status: response.status >= 400 && response.status < 600 ? response.status : 500 },
      )
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      amount: priceGhs,
      amountKobo,
    })
  } catch (error) {
    console.error("compliance-initialize:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

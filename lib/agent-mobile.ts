import { getAdminClient } from "@/lib/supabase-base"
import { generateUniquePaymentReferenceCode } from "@/lib/reference-code-generator"
import { logNewOrderAudit } from "@/lib/audit-logger"

export const AGENT_MOMO = {
  number: "0557943392",
  name: "Adamantis Solutions",
  alt_contact: "0246827049",
}

export function sanitizeAgentForMobile(agent: Record<string, unknown>) {
  const {
    password_hash: _p,
    two_factor_secret: _s,
    two_factor_backup_codes: _b,
    ...rest
  } = agent
  return rest
}

export const COMPLIANCE_FORMS = [
  {
    id: "birth-certificate",
    form_type: "birth-certificate",
    form_name: "Birth Certificate",
    form_description: "Apply for a birth certificate",
  },
  {
    id: "passport",
    form_type: "passport",
    form_name: "Passport",
    form_description: "Passport application support",
  },
  {
    id: "sole-proprietorship",
    form_type: "sole-proprietorship",
    form_name: "Sole Proprietorship",
    form_description: "One man business registration",
  },
  {
    id: "tin-registration",
    form_type: "tin-registration",
    form_name: "TIN Registration",
    form_description: "Tax Identification Number",
  },
  {
    id: "partnership",
    form_type: "partnership",
    form_name: "Partnership Registration",
    form_description: "Partnership business registration",
  },
  {
    id: "bank-account",
    form_type: "bank-account",
    form_name: "Bank Account",
    form_description: "Business bank account setup",
  },
  {
    id: "association",
    form_type: "association",
    form_name: "Association Registration",
    form_description: "Association / NGO registration",
  },
  {
    id: "company-shares",
    form_type: "company-shares",
    form_name: "Company Limited By Shares",
    form_description: "Limited company registration",
  },
] as const

export async function listActiveDataBundles() {
  const db = getAdminClient()
  const { data, error } = await db
    .from("data_bundles")
    .select("id, name, provider, size_gb, price, validity_months, image_url, is_active, commission_rate")
    .eq("is_active", true)
    .order("provider", { ascending: true })
    .order("size_gb", { ascending: true })

  if (error) throw new Error(error.message)
  const bundles = data || []
  const byProvider: Record<string, typeof bundles> = {}
  for (const b of bundles) {
    const key = String(b.provider || "Other")
    if (!byProvider[key]) byProvider[key] = []
    byProvider[key].push(b)
  }
  return { bundles, byProvider }
}

export async function createManualDataOrder(params: {
  agentId: string
  agentName?: string | null
  bundleId: string
  recipientPhone: string
}) {
  const db = getAdminClient()
  const phone = params.recipientPhone.replace(/\D/g, "")
  if (phone.length !== 10) {
    return { ok: false as const, error: "recipient_phone must be 10 digits", status: 400 }
  }

  const { data: bundle, error: bundleError } = await db
    .from("data_bundles")
    .select("id, name, provider, size_gb, price, commission_rate, is_active")
    .eq("id", params.bundleId)
    .eq("is_active", true)
    .maybeSingle()

  if (bundleError || !bundle) {
    return { ok: false as const, error: "Bundle not found", status: 404 }
  }

  const price = Number(bundle.price) || 0
  const rate = Number(bundle.commission_rate) || 0
  const commission = Math.round(price * rate * 100) / 100
  const paymentReference = await generateUniquePaymentReferenceCode()

  const { data: order, error: insertError } = await db
    .from("data_orders")
    .insert({
      agent_id: params.agentId,
      bundle_id: bundle.id,
      recipient_phone: phone,
      payment_reference: paymentReference,
      commission_amount: commission,
      payment_method: "manual",
      status: "pending",
    })
    .select("id, status, payment_reference, recipient_phone, created_at")
    .single()

  if (insertError || !order) {
    return { ok: false as const, error: insertError?.message || "Failed to create order", status: 500 }
  }

  await logNewOrderAudit({
    orderId: order.id,
    orderType: "data_order",
    amount: price,
    actorId: params.agentId,
    actorType: "agent",
    targetTable: "data_orders",
    details: {
      agent_name: params.agentName,
      payment_reference: paymentReference,
      recipient_phone: phone,
      bundle_name: bundle.name,
      href_tab: "orders",
    },
  })

  return {
    ok: true as const,
    order,
    bundle: {
      id: bundle.id,
      name: bundle.name,
      provider: bundle.provider,
      size_gb: bundle.size_gb,
      price,
    },
    payment: {
      method: "manual" as const,
      amount: price,
      reference: paymentReference,
      momo: AGENT_MOMO,
      instructions: `Send GHS ${price.toFixed(2)} to ${AGENT_MOMO.number} (${AGENT_MOMO.name}). Use reference ${paymentReference}.`,
    },
  }
}

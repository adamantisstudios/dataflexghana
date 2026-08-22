import { getAdminClient } from "@/lib/supabase-base"
import { generateUniquePaymentReferenceCode } from "@/lib/reference-code-generator"
import { logNewOrderAudit } from "@/lib/audit-logger"
import { calculateWalletBalance } from "@/lib/earnings-calculator"
import { computeAgentCommissionSummary } from "@/lib/commission-summary-server"
import { buildWalletTransactionInsertRow } from "@/lib/wallet-transaction-types"
import { getCalculatedCommission } from "@/lib/commission-calculation"

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

export async function getAgentWalletSnapshot(agentId: string) {
  const db = getAdminClient()
  const [wallet_balance, summary, txs] = await Promise.all([
    calculateWalletBalance(agentId),
    computeAgentCommissionSummary(db, agentId),
    db
      .from("wallet_transactions")
      .select("id, transaction_type, amount, description, reference_code, status, created_at")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(40),
  ])

  return {
    wallet_balance,
    commission_balance: summary.availableForWithdrawal,
    available_balance: summary.availableForWithdrawal,
    total_commission_earned: summary.totalEarned,
    total_paid_out: summary.totalWithdrawn,
    pending_payout: summary.pendingWithdrawal,
    transactions: txs.data || [],
    momo: AGENT_MOMO,
    topup_min_manual: 100,
  }
}

export async function listAgentDataOrders(params: {
  agentId: string
  status?: string | null
  provider?: string | null
  search?: string | null
  limit?: number
}) {
  const db = getAdminClient()
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 100)

  let query = db
    .from("data_orders")
    .select(
      `
      id, status, recipient_phone, payment_reference, payment_method,
      commission_amount, admin_message, created_at, bundle_id,
      data_bundles!fk_data_orders_bundle_id ( id, name, provider, size_gb, price )
    `,
    )
    .eq("agent_id", params.agentId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  let rows = data || []
  if (params.provider && params.provider !== "all") {
    rows = rows.filter((r) => {
      const bundle = Array.isArray(r.data_bundles) ? r.data_bundles[0] : r.data_bundles
      return bundle && String((bundle as { provider?: string }).provider) === params.provider
    })
  }
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase()
    rows = rows.filter((r) => {
      const bundle = Array.isArray(r.data_bundles) ? r.data_bundles[0] : r.data_bundles
      const b = (bundle || {}) as { name?: string; provider?: string }
      return (
        String(r.recipient_phone || "").includes(q) ||
        String(r.payment_reference || "").toLowerCase().includes(q) ||
        String(b.name || "").toLowerCase().includes(q) ||
        String(b.provider || "").toLowerCase().includes(q)
      )
    })
  }

  return rows
}

export async function createAgentDataOrder(params: {
  agentId: string
  agentName?: string | null
  bundleId: string
  recipientPhone: string
  paymentMethod?: "manual" | "wallet"
}) {
  const db = getAdminClient()
  const phone = params.recipientPhone.replace(/\D/g, "")
  if (phone.length !== 10) {
    return { ok: false as const, error: "recipient_phone must be 10 digits", status: 400 }
  }

  const paymentMethod = params.paymentMethod === "wallet" ? "wallet" : "manual"

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
  const commission = getCalculatedCommission(price, Number(bundle.commission_rate ?? 0))
  const paymentReference = await generateUniquePaymentReferenceCode()

  if (paymentMethod === "wallet") {
    const balance = await calculateWalletBalance(params.agentId)
    if (balance < price) {
      return {
        ok: false as const,
        error: `Insufficient wallet balance. Need GHS ${price.toFixed(2)}, have GHS ${balance.toFixed(2)}.`,
        status: 402,
        code: "INSUFFICIENT_BALANCE",
        required: price,
        available: balance,
      }
    }

    const { error: walletError } = await db.from("wallet_transactions").insert(
      buildWalletTransactionInsertRow({
        agent_id: params.agentId,
        transaction_type: "deduction",
        amount: price,
        description: `Data bundle: ${bundle.name} → ${phone}`,
        reference_code: `WB-${paymentReference}`,
        status: "approved",
      }),
    )

    if (walletError) {
      return { ok: false as const, error: "Failed to deduct wallet. Try again.", status: 500 }
    }
  }

  const status = paymentMethod === "wallet" ? "processing" : "pending"

  const { data: order, error: insertError } = await db
    .from("data_orders")
    .insert({
      agent_id: params.agentId,
      bundle_id: bundle.id,
      recipient_phone: phone,
      payment_reference: paymentReference,
      commission_amount: commission,
      payment_method: paymentMethod,
      status,
    })
    .select("id, status, payment_reference, recipient_phone, payment_method, created_at")
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
      payment_method: paymentMethod,
      href_tab: "orders",
    },
  })

  const remaining =
    paymentMethod === "wallet" ? (await calculateWalletBalance(params.agentId)) : undefined

  return {
    ok: true as const,
    order,
    bundle: {
      id: bundle.id,
      name: bundle.name,
      provider: bundle.provider,
      size_gb: bundle.size_gb,
      price,
      commission,
    },
    payment: {
      method: paymentMethod,
      amount: price,
      reference: paymentReference,
      momo: AGENT_MOMO,
      remaining_wallet: remaining,
      instructions:
        paymentMethod === "manual"
          ? `Send GHS ${price.toFixed(2)} to ${AGENT_MOMO.number} (${AGENT_MOMO.name}). Use reference ${paymentReference}. Delivery usually 10–45 minutes after confirmation.`
          : `Paid from wallet. Order is processing. Delivery usually 10–45 minutes.`,
    },
  }
}

/** @deprecated use createAgentDataOrder */
export async function createManualDataOrder(params: {
  agentId: string
  agentName?: string | null
  bundleId: string
  recipientPhone: string
}) {
  return createAgentDataOrder({ ...params, paymentMethod: "manual" })
}

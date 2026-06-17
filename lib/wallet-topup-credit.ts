import { calculateWalletBalance } from "@/lib/earnings-calculator"
import { isWalletTopupPaystackMetadata, walletTopupPaystackReference } from "@/lib/paystack-wallet-topup"
import { getAdminClient } from "@/lib/supabase-base"

export interface PaystackWalletTopupCreditOptions {
  paystackFeeGhs?: number
  totalPaidGhs?: number
}

function flattenMetadata(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {}
  return { ...(raw as Record<string, unknown>) }
}

function resolveWalletCreditGhs(metadata: Record<string, unknown>, paidAmountKobo: number): number {
  const fromMeta =
    Number(metadata.wallet_credit_ghs) ||
    Number(metadata.amount_ghs) ||
    0
  if (Number.isFinite(fromMeta) && fromMeta > 0) {
    return Math.round(fromMeta * 100) / 100
  }
  return Math.round(paidAmountKobo) / 100
}

function resolveFeeMetadata(metadata: Record<string, unknown>) {
  const paystackFeeGhs = Number(metadata.paystack_fee_ghs) || 0
  const totalPaidGhs = Number(metadata.total_payable_ghs) || 0
  return {
    paystackFeeGhs: paystackFeeGhs > 0 ? paystackFeeGhs : undefined,
    totalPaidGhs: totalPaidGhs > 0 ? totalPaidGhs : undefined,
  }
}

/** Reject credits when Paystack paid amount does not match what we initialized. */
export function validateWalletTopupPaidAmount(
  metadata: Record<string, unknown>,
  paidAmountKobo: number,
): { ok: true } | { ok: false; error: string } {
  const expectedTotalGhs = Number(metadata.total_payable_ghs)
  const walletCreditGhs =
    Number(metadata.wallet_credit_ghs) || Number(metadata.amount_ghs) || 0

  if (Number.isFinite(expectedTotalGhs) && expectedTotalGhs > 0) {
    const expectedKobo = Math.round(expectedTotalGhs * 100)
    if (paidAmountKobo !== expectedKobo) {
      return {
        ok: false,
        error: `Paid amount mismatch (expected GH₵${expectedTotalGhs.toFixed(2)}, got GH₵${(paidAmountKobo / 100).toFixed(2)})`,
      }
    }
    return { ok: true }
  }

  if (walletCreditGhs > 0) {
    const paidGhs = paidAmountKobo / 100
    if (paidGhs + 0.01 < walletCreditGhs) {
      return {
        ok: false,
        error: `Paid amount GH₵${paidGhs.toFixed(2)} is less than wallet credit GH₵${walletCreditGhs.toFixed(2)}`,
      }
    }
  }

  return { ok: true }
}

export async function processWalletTopupPaystackSuccess(params: {
  reference: string
  metadata: Record<string, unknown>
  amountKobo: number
}): Promise<{ ok: boolean; alreadyCredited?: boolean; walletCreditGhs?: number; error?: string }> {
  const metadata = flattenMetadata(params.metadata)

  if (!isWalletTopupPaystackMetadata(metadata)) {
    return { ok: false, error: "Invalid payment type" }
  }

  const amountCheck = validateWalletTopupPaidAmount(metadata, params.amountKobo)
  if (!amountCheck.ok) {
    return { ok: false, error: amountCheck.error }
  }

  const agentId = String(metadata.agent_id ?? "").trim()
  if (!agentId) {
    return { ok: false, error: "Agent not found in payment" }
  }

  const walletCreditGhs = resolveWalletCreditGhs(metadata, params.amountKobo)
  if (!Number.isFinite(walletCreditGhs) || walletCreditGhs <= 0) {
    return { ok: false, error: "Invalid wallet credit amount" }
  }

  const feeMeta = resolveFeeMetadata(metadata)
  const result = await creditAgentWalletFromPaystackTopup(
    agentId,
    walletCreditGhs,
    params.reference,
    feeMeta,
  )

  if (!result.ok) {
    return { ok: false, error: "Could not credit wallet" }
  }

  return { ok: true, alreadyCredited: result.alreadyCredited, walletCreditGhs }
}

/**
 * Idempotent Paystack wallet top-up credit.
 * Ledger insert uses a stable reference; duplicate Paystack refs never double-credit.
 */
export async function creditAgentWalletFromPaystackTopup(
  agentId: string,
  walletCreditGhs: number,
  paystackRef: string,
  options?: PaystackWalletTopupCreditOptions,
): Promise<{ ok: boolean; alreadyCredited?: boolean }> {
  const db = getAdminClient()
  const referenceCode = walletTopupPaystackReference(paystackRef)
  const credit = Math.round(walletCreditGhs * 100) / 100

  const { data: existingCredit } = await db
    .from("paystack_wallet_topup_credits")
    .select("paystack_reference, wallet_transaction_id")
    .eq("paystack_reference", paystackRef)
    .maybeSingle()

  if (existingCredit?.wallet_transaction_id) {
    return { ok: true, alreadyCredited: true }
  }

  const { data: existingTx } = await db
    .from("wallet_transactions")
    .select("id")
    .eq("reference_code", referenceCode)
    .maybeSingle()

  if (existingTx?.id) {
    await db.from("paystack_wallet_topup_credits").upsert({
      paystack_reference: paystackRef,
      agent_id: agentId,
      amount: credit,
      wallet_transaction_id: existingTx.id,
    })
    return { ok: true, alreadyCredited: true }
  }

  const feeNote =
    options?.paystackFeeGhs != null && options.paystackFeeGhs > 0
      ? ` (customer paid GH₵${(options.totalPaidGhs ?? credit + options.paystackFeeGhs).toFixed(2)} incl. GH₵${options.paystackFeeGhs.toFixed(2)} Paystack fee)`
      : ""

  const { data: inserted, error: insertError } = await db
    .from("wallet_transactions")
    .insert({
      agent_id: agentId,
      transaction_type: "topup",
      amount: credit,
      description: `Paystack wallet top-up — GH₵${credit.toFixed(2)}${feeNote}`,
      reference_code: referenceCode,
      status: "approved",
      payment_method: "auto",
      admin_notes: `Paystack ref: ${paystackRef}`,
    })
    .select("id")
    .single()

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: racedTx } = await db
        .from("wallet_transactions")
        .select("id")
        .eq("reference_code", referenceCode)
        .maybeSingle()
      if (racedTx?.id) {
        await db.from("paystack_wallet_topup_credits").upsert({
          paystack_reference: paystackRef,
          agent_id: agentId,
          amount: credit,
          wallet_transaction_id: racedTx.id,
        })
      }
      return { ok: true, alreadyCredited: true }
    }
    console.error("[wallet-topup credit] insert tx:", insertError)
    return { ok: false }
  }

  const { error: creditRowError } = await db.from("paystack_wallet_topup_credits").insert({
    paystack_reference: paystackRef,
    agent_id: agentId,
    amount: credit,
    wallet_transaction_id: inserted?.id ?? null,
  })

  if (creditRowError && creditRowError.code !== "23505") {
    console.error("[wallet-topup credit] idempotency row:", creditRowError)
    return { ok: false }
  }

  const balance = await calculateWalletBalance(agentId)
  const { error: balanceError } = await db
    .from("agents")
    .update({ wallet_balance: balance, updated_at: new Date().toISOString() })
    .eq("id", agentId)

  if (balanceError) {
    console.error("[wallet-topup credit] balance sync:", balanceError)
  }

  return { ok: true }
}

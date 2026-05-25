import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { calculateWalletBalance } from "@/lib/earnings-calculator"
import {
  isWalletTopupPaystackMetadata,
  walletTopupPaystackReference,
} from "@/lib/paystack-wallet-topup"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""

function flattenMetadata(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {}
  return { ...(raw as Record<string, unknown>) }
}

async function creditWalletTopup(
  agentId: string,
  amountGhs: number,
  paystackRef: string,
): Promise<{ ok: boolean; alreadyCredited?: boolean }> {
  const db = getAdminClient()
  const referenceCode = walletTopupPaystackReference(paystackRef)

  const { data: existingCredit } = await db
    .from("paystack_wallet_topup_credits")
    .select("paystack_reference")
    .eq("paystack_reference", paystackRef)
    .maybeSingle()

  if (existingCredit) {
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
      amount: amountGhs,
      wallet_transaction_id: existingTx.id,
    })
    return { ok: true, alreadyCredited: true }
  }

  const { data: inserted, error: insertError } = await db
    .from("wallet_transactions")
    .insert({
      agent_id: agentId,
      transaction_type: "topup",
      amount: amountGhs,
      description: `Paystack wallet top-up — GH₵${amountGhs.toFixed(2)}`,
      reference_code: referenceCode,
      status: "approved",
      admin_notes: `Paystack ref: ${paystackRef}`,
    })
    .select("id")
    .single()

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: true, alreadyCredited: true }
    }
    console.error("[wallet-topup callback] insert tx:", insertError)
    return { ok: false }
  }

  await db.from("paystack_wallet_topup_credits").insert({
    paystack_reference: paystackRef,
    agent_id: agentId,
    amount: amountGhs,
    wallet_transaction_id: inserted?.id ?? null,
  })

  const balance = await calculateWalletBalance(agentId)
  await db
    .from("agents")
    .update({ wallet_balance: balance, updated_at: new Date().toISOString() })
    .eq("id", agentId)

  return { ok: true }
}

export async function GET(request: NextRequest) {
  const base = new URL(request.url).origin
  const walletUrl = `${base}/agent/wallet`

  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.redirect(
        `${walletUrl}?topup=failed&message=${encodeURIComponent("Paystack not configured")}`,
      )
    }

    const reference = request.nextUrl.searchParams.get("reference")
    if (!reference) {
      return NextResponse.redirect(
        `${walletUrl}?topup=failed&message=${encodeURIComponent("Missing payment reference")}`,
      )
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      },
    )
    const data = await verifyRes.json()

    if (!verifyRes.ok || data.data?.status !== "success") {
      return NextResponse.redirect(
        `${walletUrl}?topup=failed&message=${encodeURIComponent("Payment was not successful")}`,
      )
    }

    const metadata = flattenMetadata(data.data.metadata)
    if (!isWalletTopupPaystackMetadata(metadata)) {
      return NextResponse.redirect(
        `${walletUrl}?topup=failed&message=${encodeURIComponent("Invalid payment type")}`,
      )
    }

    const agentId = String(metadata.agent_id ?? "").trim()
    const amountGhs =
      Number(metadata.amount_ghs) || Number(data.data.amount) / 100

    if (!agentId) {
      return NextResponse.redirect(
        `${walletUrl}?topup=failed&message=${encodeURIComponent("Agent not found in payment")}`,
      )
    }

    const result = await creditWalletTopup(agentId, amountGhs, reference)
    if (!result.ok) {
      return NextResponse.redirect(
        `${walletUrl}?topup=failed&message=${encodeURIComponent("Could not credit wallet")}`,
      )
    }

    const msg = result.alreadyCredited
      ? "Payment already processed"
      : `Wallet credited with GH₵${amountGhs.toFixed(2)}`

    return NextResponse.redirect(
      `${walletUrl}?topup=success&message=${encodeURIComponent(msg)}`,
    )
  } catch (e) {
    console.error("[wallet-topup callback]", e)
    return NextResponse.redirect(
      `${walletUrl}?topup=failed&message=${encodeURIComponent("Verification error")}`,
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { notifyAdminManualWalletTopup } from "@/lib/admin-wallet-topup-notify"
import { getRequestClientMeta } from "@/lib/audit-logger"
import { getAdminClient } from "@/lib/supabase-base"
import { AGENT_MOMO } from "@/lib/agent-mobile"

export const dynamic = "force-dynamic"

const MIN_MANUAL_TOPUP_GHS = 100
const MIN_REFERENCE_LENGTH = 7

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success || !auth.user) {
    return createAuthErrorResponse(auth.error || "Unauthorized", 401)
  }

  const user = auth.user as { id: string; full_name?: string }
  let body: { amount?: number; payment_reference?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const amount = Number(body.amount)
  const paymentReference = String(body.payment_reference ?? "").trim()

  if (!Number.isFinite(amount) || amount < MIN_MANUAL_TOPUP_GHS) {
    return NextResponse.json(
      { error: `Minimum manual top-up is GH₵${MIN_MANUAL_TOPUP_GHS}` },
      { status: 400 },
    )
  }
  if (!paymentReference || paymentReference.length < MIN_REFERENCE_LENGTH) {
    return NextResponse.json(
      { error: `Payment reference must be at least ${MIN_REFERENCE_LENGTH} characters` },
      { status: 400 },
    )
  }

  const db = getAdminClient()
  const roundedAmount = Math.round(amount * 100) / 100

  const [{ data: existingTx }, { data: existingTopup }] = await Promise.all([
    db.from("wallet_transactions").select("id").eq("reference_code", paymentReference).maybeSingle(),
    db.from("wallet_topups").select("id").eq("payment_reference", paymentReference).maybeSingle(),
  ])

  if (existingTx?.id || existingTopup?.id) {
    return NextResponse.json({ error: "This payment reference has already been used" }, { status: 409 })
  }

  const { data: inserted, error: insertError } = await db
    .from("wallet_topups")
    .insert({
      agent_id: user.id,
      amount: roundedAmount,
      status: "pending",
      payment_reference: paymentReference,
      payment_method: "manual",
    })
    .select("id, amount, status, created_at, payment_reference")
    .single()

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message || "Failed to create top-up" }, { status: 500 })
  }

  const meta = getRequestClientMeta(request)
  await notifyAdminManualWalletTopup({
    topupId: inserted.id,
    agentId: user.id,
    agentName: user.full_name,
    amount: roundedAmount,
    paymentReference,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  })

  return NextResponse.json({
    success: true,
    topup: inserted,
    payment: {
      momo: AGENT_MOMO,
      amount: roundedAmount,
      reference: paymentReference,
      instructions: `Send GHS ${roundedAmount.toFixed(2)} to ${AGENT_MOMO.number}. Use MoMo reference ${paymentReference}. Admin will credit your wallet after verification.`,
    },
  })
}

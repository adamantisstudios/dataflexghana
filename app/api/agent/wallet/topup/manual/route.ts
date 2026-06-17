import { type NextRequest, NextResponse } from "next/server"
import { notifyAdminManualWalletTopup } from "@/lib/admin-wallet-topup-notify"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getRequestClientMeta } from "@/lib/audit-logger"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

const MIN_MANUAL_TOPUP_GHS = 100
const MIN_REFERENCE_LENGTH = 7

export const POST = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    if (user.role !== "agent") {
      return NextResponse.json({ error: "Agents only" }, { status: 403 })
    }

    const body = await request.json()
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
      db
        .from("wallet_transactions")
        .select("id")
        .eq("reference_code", paymentReference)
        .maybeSingle(),
      db
        .from("wallet_topups")
        .select("id")
        .eq("payment_reference", paymentReference)
        .maybeSingle(),
    ])

    if (existingTx?.id || existingTopup?.id) {
      return NextResponse.json(
        { error: "This payment reference has already been used" },
        { status: 409 },
      )
    }

    const insertRow: Record<string, unknown> = {
      agent_id: user.id,
      amount: roundedAmount,
      status: "pending",
      payment_reference: paymentReference,
      payment_method: "manual",
    }

    let topupId: string
    let paymentRefStored = paymentReference

    const { data: inserted, error: insertError } = await db
      .from("wallet_topups")
      .insert(insertRow)
      .select("id, amount, status, created_at, payment_reference")
      .single()

    if (insertError) {
      if (insertError.code === "42703") {
        const { payment_reference: _ref, payment_method: _method, ...fallbackRow } = insertRow
        const { data: fallbackInsert, error: fallbackError } = await db
          .from("wallet_topups")
          .insert(fallbackRow)
          .select("id, amount, status, created_at")
          .single()

        if (fallbackError) {
          console.error("[manual wallet topup]", fallbackError)
          return NextResponse.json({ error: fallbackError.message }, { status: 500 })
        }

        topupId = fallbackInsert.id
        paymentRefStored = paymentReference
      } else if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This payment reference has already been used" },
          { status: 409 },
        )
      } else {
        console.error("[manual wallet topup]", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    } else {
      topupId = inserted!.id
      paymentRefStored = String(inserted?.payment_reference ?? paymentReference)
    }

    const { data: agentRow } = await db
      .from("agents")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()

    const clientMeta = getRequestClientMeta(request)
    await notifyAdminManualWalletTopup({
      topupId,
      agentId: user.id,
      agentName: agentRow?.full_name || user.full_name,
      amount: roundedAmount,
      paymentReference: paymentRefStored,
      ipAddress: clientMeta.ipAddress,
      userAgent: clientMeta.userAgent,
    })

    return NextResponse.json({
      success: true,
      data: inserted ?? { id: topupId, amount: roundedAmount, status: "pending" },
      message: "Top-up submitted! Admin will credit your wallet after verification.",
    })
  } catch (e) {
    console.error("[manual wallet topup]", e)
    return NextResponse.json({ error: "Failed to submit top-up request" }, { status: 500 })
  }
})

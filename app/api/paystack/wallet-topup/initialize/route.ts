import { type NextRequest, NextResponse } from "next/server"
import { withAgentAuth } from "@/lib/auth-middleware"
import { calculateWalletTopupPaystackFees } from "@/lib/paystack-wallet-fees"
import { getAdminClient } from "@/lib/supabase-base"
import {
  WALLET_TOPUP_PAYSTACK_MIN_GHS,
  WALLET_TOPUP_PAYMENT_TYPE,
  getWalletTopupCallbackUrl,
} from "@/lib/paystack-wallet-topup"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""

export const dynamic = "force-dynamic"

export const POST = withAgentAuth(async (request: NextRequest, user) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: "Paystack not configured" }, { status: 500 })
    }

    const body = await request.json()
    const walletCreditGhs = Number(body.amount)
    let email = String(body.email ?? "").trim()

    if (!email) {
      const db = getAdminClient()
      const { data: agentRow } = await db
        .from("agents")
        .select("email")
        .eq("id", user.id)
        .maybeSingle()
      email = String(agentRow?.email ?? "").trim()
    }

    if (!email) {
      return NextResponse.json(
        { error: "Add your email in Agent Settings before using Paystack top-up" },
        { status: 400 },
      )
    }

    if (!Number.isFinite(walletCreditGhs) || walletCreditGhs < WALLET_TOPUP_PAYSTACK_MIN_GHS) {
      return NextResponse.json(
        { error: `Minimum Paystack top-up is GH₵${WALLET_TOPUP_PAYSTACK_MIN_GHS}` },
        { status: 400 },
      )
    }

    const fees = calculateWalletTopupPaystackFees(walletCreditGhs)
    const amountKobo = Math.round(fees.total_payable_ghs * 100)
    const callbackUrl = getWalletTopupCallbackUrl(request)

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: "GHS",
        metadata: {
          agent_id: user.id,
          payment_type: WALLET_TOPUP_PAYMENT_TYPE,
          transaction_type: WALLET_TOPUP_PAYMENT_TYPE,
          amount_ghs: fees.wallet_credit_ghs,
          wallet_credit_ghs: fees.wallet_credit_ghs,
          paystack_fee_ghs: fees.paystack_fee_ghs,
          total_payable_ghs: fees.total_payable_ghs,
        },
        callback_url: callbackUrl,
      }),
    })

    const paystackData = await paystackResponse.json()
    if (!paystackResponse.ok || !paystackData.status) {
      return NextResponse.json(
        { error: paystackData.message || "Paystack initialization failed" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
      fees,
    })
  } catch (e) {
    console.error("[wallet-topup initialize]", e)
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
})

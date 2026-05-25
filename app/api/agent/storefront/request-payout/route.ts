import { type NextRequest, NextResponse } from "next/server"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAdminClient } from "@/lib/supabase-base"
import {
  STOREFRONT_MIN_PAYOUT_GHS,
  STOREFRONT_PAYOUT_NOTE,
  fetchStorefrontCommissionBalance,
  deductStorefrontCommissionBalance,
  restoreStorefrontCommissionBalance,
  storefrontPayoutMinimumMessage,
} from "@/lib/storefront-payout"

export const dynamic = "force-dynamic"

export const POST = withUnifiedAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json().catch(() => ({}))
    const agentId = (body.agentId as string) || user.id
    const requestedRaw = body.amount

    if (user.role === "agent" && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const balance = await fetchStorefrontCommissionBalance(agentId)

    if (balance <= 0) {
      return NextResponse.json(
        {
          error: "No storefront commission balance available to withdraw",
          available_balance: 0,
        },
        { status: 400 },
      )
    }

    if (balance < STOREFRONT_MIN_PAYOUT_GHS) {
      return NextResponse.json(
        {
          error: storefrontPayoutMinimumMessage(balance),
          available_balance: balance,
        },
        { status: 400 },
      )
    }

    const payoutAmount =
      requestedRaw !== undefined && requestedRaw !== null
        ? Number(requestedRaw)
        : balance

    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 })
    }

    if (payoutAmount < STOREFRONT_MIN_PAYOUT_GHS) {
      return NextResponse.json(
        {
          error: storefrontPayoutMinimumMessage(balance),
          available_balance: balance,
        },
        { status: 400 },
      )
    }

    if (payoutAmount > balance + 0.001) {
      return NextResponse.json(
        {
          error: `Insufficient storefront commission balance. Available: ${balance.toFixed(2)}`,
          available_balance: balance,
        },
        { status: 400 },
      )
    }

    const db = getAdminClient()

    const { data: agentRow, error: agentError } = await db
      .from("agents")
      .select("id, momo_number, phone_number")
      .eq("id", agentId)
      .single()

    if (agentError || !agentRow) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const momo = String(agentRow.momo_number || agentRow.phone_number || "").trim()
    if (!momo) {
      return NextResponse.json(
        { error: "Add your MoMo number in agent settings before requesting payout" },
        { status: 400 },
      )
    }

    const { data: pending } = await db
      .from("withdrawals")
      .select("id")
      .eq("agent_id", agentId)
      .eq("status", "requested")
      .ilike("admin_notes", `%${STOREFRONT_PAYOUT_NOTE}%`)

    if (pending?.length) {
      return NextResponse.json(
        { error: "You already have a pending storefront payout request" },
        { status: 400 },
      )
    }

    const deduct = await deductStorefrontCommissionBalance(agentId, payoutAmount)
    if (deduct.error) {
      console.error("[storefront request-payout] balance deduct:", deduct.error)
      return NextResponse.json({ error: deduct.error }, { status: 500 })
    }

    const payoutNote = `Storefront commission payout request (₵${payoutAmount.toFixed(2)})`
    const insertPayload: Record<string, unknown> = {
      agent_id: agentId,
      amount: payoutAmount,
      momo_number: momo,
      status: "requested",
      requested_at: new Date().toISOString(),
      admin_notes: `${STOREFRONT_PAYOUT_NOTE} | ${payoutNote}`,
      source: "storefront",
    }

    let { data: withdrawal, error: withdrawalError } = await db
      .from("withdrawals")
      .insert(insertPayload)
      .select("id, amount, status")
      .single()

    if (withdrawalError?.message?.includes("source")) {
      const { source: _s, ...withoutSource } = insertPayload
      const retry = await db
        .from("withdrawals")
        .insert(withoutSource)
        .select("id, amount, status")
        .single()
      withdrawal = retry.data
      withdrawalError = retry.error
    }

    if (withdrawalError) {
      console.error("[storefront request-payout] withdrawal insert:", withdrawalError)
      try {
        await restoreStorefrontCommissionBalance(agentId, payoutAmount)
      } catch (rollbackErr) {
        console.error("[storefront request-payout] rollback failed:", rollbackErr)
      }
      return NextResponse.json({ error: withdrawalError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        withdrawal_id: withdrawal?.id,
        amount: payoutAmount,
        available_balance: deduct.newBalance,
        message: `Payout request for ₵${payoutAmount.toFixed(2)} submitted. Admin will pay via MoMo.`,
      },
    })
  } catch (error) {
    console.error("storefront request-payout:", error)
    const message = error instanceof Error ? error.message : "Failed to submit payout request"
    return NextResponse.json({ error: message }, { status: 500 })
  }
})

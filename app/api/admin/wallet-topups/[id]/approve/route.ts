import { requireAdminSession } from "@/lib/api-auth"
import { calculateWalletBalance } from "@/lib/earnings-calculator"
import { getAdminClient } from "@/lib/supabase-base"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** Stable reference for idempotent top-up approval (one wallet credit per top-up request). */
export function topupApprovalReferenceCode(topupId: string): string {
  return `TOPUP-${topupId}`
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { id: topupId } = await params
    if (!topupId?.trim()) {
      return NextResponse.json({ success: false, error: "Top-up ID is required" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const adminId = typeof body.admin_id === "string" ? body.admin_id.trim() : undefined

    const db = getAdminClient()
    const referenceCode = topupApprovalReferenceCode(topupId)

    const { data: topup, error: topupError } = await db
      .from("wallet_topups")
      .select("id, agent_id, amount, status")
      .eq("id", topupId)
      .single()

    if (topupError || !topup) {
      return NextResponse.json({ success: false, error: "Top-up request not found" }, { status: 404 })
    }

    if (topup.status === "rejected") {
      return NextResponse.json({ success: false, error: "Cannot approve a rejected top-up" }, { status: 400 })
    }

    if (topup.status === "pending") {
      const { error: updateError } = await db
        .from("wallet_topups")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: adminId || null,
        })
        .eq("id", topupId)

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
      }
    }

    // Re-check after status flip (or concurrent approve) so we never double-credit the same request.
    const { data: creditBeforeInsert } = await db
      .from("wallet_transactions")
      .select("id")
      .eq("reference_code", referenceCode)
      .maybeSingle()

    const hadCreditAlready = Boolean(creditBeforeInsert?.id)
    let walletTransactionCreated = false

    if (!hadCreditAlready) {
      const { data: insertedRow, error: insertError } = await db
        .from("wallet_transactions")
        .insert({
          agent_id: topup.agent_id,
          transaction_type: "topup",
          amount: topup.amount,
          description: `Admin wallet top-up - GH₵${Number(topup.amount).toFixed(2)}`,
          status: "approved",
          reference_code: referenceCode,
          admin_notes: adminId ? `Approved by admin ${adminId}` : "Approved by admin",
          admin_id: adminId || null,
        })
        .select("id")
        .maybeSingle()

      if (insertError && insertError.code !== "23505") {
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }
      walletTransactionCreated = Boolean(insertedRow?.id)
    }

    const balance = await calculateWalletBalance(topup.agent_id)

    const { error: balanceError } = await db
      .from("agents")
      .update({
        wallet_balance: balance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topup.agent_id)

    if (balanceError) {
      return NextResponse.json({ success: false, error: balanceError.message }, { status: 500 })
    }

    const { data: creditAfter } = await db
      .from("wallet_transactions")
      .select("id")
      .eq("reference_code", referenceCode)
      .maybeSingle()

    const creditExists = Boolean(creditAfter?.id)
    const idempotentReplay = hadCreditAlready || (creditExists && !walletTransactionCreated)

    return NextResponse.json({
      success: true,
      data: {
        topup_id: topupId,
        agent_id: topup.agent_id,
        balance,
        reference_code: referenceCode,
        idempotent: idempotentReplay,
        wallet_transaction_created: walletTransactionCreated,
        message: idempotentReplay
          ? "Top-up was already credited (idempotent)"
          : `Wallet top-up approved. New balance: GH₵${balance.toFixed(2)}`,
      },
    })
  } catch (error) {
    console.error("Error approving wallet top-up:", error)
    const message = error instanceof Error ? error.message : "Failed to approve wallet top-up"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

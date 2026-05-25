import { type NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/api-auth"
import { createAdminReversal, calculateWalletBalance } from "@/lib/earnings-calculator"
import { getAdminClient } from "@/lib/supabase-base"

export const dynamic = "force-dynamic"

async function findExistingReversal(db: ReturnType<typeof getAdminClient>, transactionId: string) {
  const { data: bySource, error: sourceError } = await db
    .from("wallet_transactions")
    .select("id")
    .eq("source_id", transactionId)
    .limit(1)
    .maybeSingle()

  if (!sourceError && bySource?.id) {
    return bySource.id
  }

  const { data: byReference } = await db
    .from("wallet_transactions")
    .select("id")
    .like("reference_code", `REV-${transactionId}%`)
    .limit(1)
    .maybeSingle()

  return byReference?.id ?? null
}

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const body = await request.json().catch(() => ({}))
    const transactionId = String(body.transaction_id ?? "").trim()
    const agentId = String(body.agent_id ?? "").trim()
    const reason = String(body.reason ?? "").trim()

    if (!transactionId || !agentId || !reason) {
      return NextResponse.json(
        { success: false, error: "transaction_id, agent_id, and reason are required" },
        { status: 400 },
      )
    }

    const adminId = String(adminSession.admin.id ?? "")
    if (!adminId) {
      return NextResponse.json({ success: false, error: "Admin session invalid" }, { status: 401 })
    }

    const db = getAdminClient()

    const { data: original, error: fetchError } = await db
      .from("wallet_transactions")
      .select("id, agent_id, transaction_type, status, amount")
      .eq("id", transactionId)
      .single()

    if (fetchError || !original) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
    }

    if (original.agent_id !== agentId) {
      return NextResponse.json(
        { success: false, error: "Agent does not match this transaction" },
        { status: 400 },
      )
    }

    if (original.transaction_type !== "topup") {
      return NextResponse.json(
        { success: false, error: "Only wallet top-up transactions can be reversed" },
        { status: 400 },
      )
    }

    if (original.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Only approved top-up transactions can be reversed" },
        { status: 400 },
      )
    }

    const existingReversalId = await findExistingReversal(db, transactionId)
    if (existingReversalId) {
      return NextResponse.json(
        { success: false, error: "This top-up has already been reversed" },
        { status: 400 },
      )
    }

    const reversalId = await createAdminReversal(agentId, transactionId, adminId, reason)
    if (!reversalId) {
      return NextResponse.json(
        { success: false, error: "Failed to create reversal transaction" },
        { status: 500 },
      )
    }

    const balance = await calculateWalletBalance(agentId)
    await db
      .from("agents")
      .update({
        wallet_balance: balance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)

    return NextResponse.json({
      success: true,
      data: {
        reversal_transaction_id: reversalId,
        agent_id: agentId,
        balance,
        message: "Top-up reversed successfully",
      },
    })
  } catch (error) {
    console.error("[wallet/reverse]", error)
    const message = error instanceof Error ? error.message : "Failed to reverse transaction"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

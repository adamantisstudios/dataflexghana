import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAgentCommissionSummary, processWithdrawalRequest } from "@/lib/commission-earnings"
import { logAuditFromRequest } from "@/lib/audit-logger"

const PASSWORD_CHANGE_COOLDOWN_MS = 48 * 60 * 60 * 1000

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MIN_WITHDRAWAL_AMOUNT = 10

export const POST = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json()
    const { agent_id, amount, momo_number } = body

    if (user.role === "agent" && agent_id && agent_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const targetAgentId = agent_id || user.id

    if (!targetAgentId || amount == null || !momo_number) {
      return NextResponse.json(
        { error: "All fields are required: amount, momo_number" },
        { status: 400 },
      )
    }

    const withdrawalAmount = Number(amount)
    if (withdrawalAmount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is GH₵${MIN_WITHDRAWAL_AMOUNT}` },
        { status: 400 },
      )
    }

    if (withdrawalAmount <= 0) {
      return NextResponse.json({ error: "Withdrawal amount must be positive" }, { status: 400 })
    }

    const commissionSummary = await getAgentCommissionSummary(targetAgentId)
    const available = commissionSummary.availableForWithdrawal

    if (withdrawalAmount > available) {
      return NextResponse.json(
        {
          error: `Insufficient commission balance. Available: GH₵${available.toFixed(2)}, Requested: GH₵${withdrawalAmount.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    const db = getAdminClient()

    const { data: agentSecurity, error: securityError } = await db
      .from("agents")
      .select("password_changed_at")
      .eq("id", targetAgentId)
      .maybeSingle()

    if (securityError) {
      console.error("Error checking password change cooldown:", securityError)
      return NextResponse.json({ error: "Failed to validate withdrawal request" }, { status: 500 })
    }

    if (agentSecurity?.password_changed_at) {
      const changedAt = new Date(agentSecurity.password_changed_at).getTime()
      const unblockAt = changedAt + PASSWORD_CHANGE_COOLDOWN_MS
      if (Date.now() < unblockAt) {
        const hoursLeft = Math.ceil((unblockAt - Date.now()) / (60 * 60 * 1000))
        await logAuditFromRequest(request, {
          actorId: targetAgentId,
          actorType: "agent",
          action: "withdrawal_blocked_cooldown",
          severity: "warning",
          targetTable: "agents",
          targetId: targetAgentId,
          newData: {
            hours_left: hoursLeft,
            unblock_at: new Date(unblockAt).toISOString(),
            requested_amount: withdrawalAmount,
          },
        })
        return NextResponse.json(
          {
            error: `Withdrawals are paused for 48 hours after a password change (security). You can request again in about ${hoursLeft} hour(s).`,
            code: "password_change_cooldown",
            unblock_at: new Date(unblockAt).toISOString(),
          },
          { status: 403 },
        )
      }
    }

    const { data: existingRequests, error: requestError } = await db
      .from("withdrawals")
      .select("id, status, amount")
      .eq("agent_id", targetAgentId)
      .in("status", ["requested", "processing"])

    if (requestError) {
      console.error("Error checking existing requests:", requestError)
      return NextResponse.json({ error: "Failed to process withdrawal request" }, { status: 500 })
    }

    if (existingRequests && existingRequests.length > 0) {
      return NextResponse.json(
        {
          error: "You already have a pending withdrawal request. Please wait for it to be processed.",
        },
        { status: 400 },
      )
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentRequests, error: recentError } = await db
      .from("withdrawals")
      .select("id, amount, requested_at")
      .eq("agent_id", targetAgentId)
      .eq("amount", withdrawalAmount)
      .gte("requested_at", twentyFourHoursAgo)

    if (recentError) {
      console.error("Error checking recent requests:", recentError)
      return NextResponse.json({ error: "Failed to validate withdrawal request" }, { status: 500 })
    }

    if (recentRequests && recentRequests.length > 0) {
      return NextResponse.json(
        {
          error: `You recently requested this same amount (GH₵${withdrawalAmount}). Please wait 24 hours or choose a different amount.`,
        },
        { status: 400 },
      )
    }

    const { data: withdrawalRequest, error: withdrawalError } = await db
      .from("withdrawals")
      .insert({
        agent_id: targetAgentId,
        amount: withdrawalAmount,
        momo_number: momo_number,
        status: "requested",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error("Error creating withdrawal request:", withdrawalError)
      if (withdrawalError.code === "23505") {
        return NextResponse.json(
          { error: "A withdrawal request is already active. Please wait for it to be processed." },
          { status: 400 },
        )
      }
      return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 })
    }

    const lockResult = await processWithdrawalRequest(
      targetAgentId,
      withdrawalRequest.id,
      withdrawalAmount,
    )

    if (!lockResult.success) {
      await db.from("withdrawals").delete().eq("id", withdrawalRequest.id)
      return NextResponse.json(
        { error: lockResult.message || "Failed to lock commissions for withdrawal" },
        { status: 400 },
      )
    }

    // Build commission_items snapshot for admin payout tab
    const { data: lockedCommissions } = await db
      .from("commissions")
      .select("id, source_type, source_id, amount")
      .eq("withdrawal_id", withdrawalRequest.id)
      .eq("status", "pending_withdrawal")

    const commission_items =
      lockedCommissions?.map((c) => ({
        type: c.source_type,
        id: c.source_id,
        amount: Number(c.amount) || 0,
      })) || []

    if (commission_items.length > 0) {
      await db
        .from("withdrawals")
        .update({
          commission_items,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawalRequest.id)
    }

    // Update agent legacy totals field if present
    await db
      .from("agents")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", targetAgentId)

    await logAuditFromRequest(request, {
      actorId: targetAgentId,
      actorType: user.role === "admin" ? "admin" : "agent",
      action:
        withdrawalAmount > 500 ? "large_withdrawal_requested" : "withdrawal_requested",
      severity: withdrawalAmount > 500 ? "info" : "info",
      targetTable: "withdrawals",
      targetId: withdrawalRequest.id,
      newData: {
        amount: withdrawalAmount,
        momo_number,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully. Admin will process your payout manually.",
      withdrawalRequest: {
        id: withdrawalRequest.id,
        amount: withdrawalAmount,
        status: "requested",
        requested_at: withdrawalRequest.requested_at,
        commission_items,
      },
    })
  } catch (error) {
    console.error("Error in POST /api/agent/withdraw:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

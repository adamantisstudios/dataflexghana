import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { processWithdrawalPayout, getWithdrawalWithCommissionSources } from "@/lib/wholesale"
import { completeWithdrawal, cancelWithdrawal } from "@/lib/commission-earnings"
import { authenticateAdmin } from "@/lib/api-auth"
import { logAuditFromRequest } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    if (!auth.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"

    const db = getAdminClient()

    let query = db
      .from("withdrawals")
      .select(`
        *,
        agents:agent_id (
          id,
          full_name,
          phone_number,
          momo_number
        )
      `)
      .order("requested_at", { ascending: false })

    if (status === "pending") {
      query = query.in("status", ["requested", "processing"])
    } else if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data: withdrawals, error } = await query

    if (error) {
      console.error("Error fetching withdrawals:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    const enrichedWithdrawals = await Promise.all(
      (withdrawals || []).map(async (withdrawal) => {
        try {
          const enriched = await getWithdrawalWithCommissionSources(withdrawal.id)
          return enriched || withdrawal
        } catch {
          return withdrawal
        }
      }),
    )

    return NextResponse.json({
      success: true,
      withdrawals: enrichedWithdrawals,
    })
  } catch (error: unknown) {
    console.error("Error in admin payouts GET API:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch payout data"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    if (!auth.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { withdrawal_id, admin_id, payout_reference, action, admin_notes } = body

    if (!withdrawal_id) {
      return NextResponse.json({ success: false, error: "Withdrawal ID is required" }, { status: 400 })
    }

    const adminId = admin_id || auth.user?.id
    if (!adminId) {
      return NextResponse.json({ success: false, error: "Admin ID is required" }, { status: 400 })
    }

    const db = getAdminClient()

    if (action === "approve" || action === "pay") {
      const result = await processWithdrawalPayout(withdrawal_id, adminId, payout_reference)

      if (!result) {
        return NextResponse.json({ success: false, error: "Withdrawal payout processing failed" }, { status: 500 })
      }

      const commissionResult = await completeWithdrawal(withdrawal_id)

      if (admin_notes) {
        await db
          .from("withdrawals")
          .update({ admin_notes, updated_at: new Date().toISOString() })
          .eq("id", withdrawal_id)
      }

      // Update agent totalpaidout from paid withdrawals
      const { data: withdrawal } = await db
        .from("withdrawals")
        .select("agent_id, amount")
        .eq("id", withdrawal_id)
        .single()

      if (withdrawal?.agent_id) {
        const { data: agentRow } = await db
          .from("agents")
          .select("totalpaidout, totalcommissions")
          .eq("id", withdrawal.agent_id)
          .single()

        const newPaidOut = (Number(agentRow?.totalpaidout) || 0) + Number(withdrawal.amount)
        await db
          .from("agents")
          .update({
            totalpaidout: newPaidOut,
            updated_at: new Date().toISOString(),
          })
          .eq("id", withdrawal.agent_id)
      }

      await logAuditFromRequest(request, {
        actorId: adminId,
        actorType: "admin",
        action: "payout_marked_paid",
        severity: "info",
        targetTable: "withdrawals",
        targetId: withdrawal_id,
        newData: {
          payout_reference: payout_reference ?? null,
          agent_id: withdrawal?.agent_id,
          amount: withdrawal?.amount,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Withdrawal marked as paid. Commission balance updated.",
        commission_processed: commissionResult.success,
      })
    }

    if (action === "reject") {
      const { error } = await db
        .from("withdrawals")
        .update({
          status: "rejected",
          admin_notes: admin_notes || "Withdrawal rejected by admin",
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal_id)

      if (error) {
        return NextResponse.json({ success: false, error: "Failed to reject withdrawal" }, { status: 500 })
      }

      await cancelWithdrawal(withdrawal_id)

      return NextResponse.json({
        success: true,
        message: "Withdrawal rejected. Commission balance restored.",
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 })
  } catch (error: unknown) {
    console.error("Error in admin payouts POST API:", error)
    const message = error instanceof Error ? error.message : "Failed to process payout action"
    return NextResponse.json({ success: false, error: message, details: message }, { status: 500 })
  }
}

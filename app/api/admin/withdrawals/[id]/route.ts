import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { completeWithdrawal, cancelWithdrawal } from "@/lib/commission-earnings"
import { authenticateAdmin } from "@/lib/api-auth"
import { processWithdrawalPayout } from "@/lib/wholesale"
import {
  isStorefrontWithdrawal,
  restoreStorefrontCommissionBalance,
} from "@/lib/storefront-payout"

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    const { id: withdrawalId } = await params
    const body = await request.json()
    const { status, admin_notes } = body

    if (!withdrawalId) {
      return NextResponse.json({ success: false, error: "Withdrawal ID is required" }, { status: 400 })
    }

    if (!status || !["paid", "rejected", "processing", "pending", "cancelled", "requested"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid status is required (paid, rejected, processing, pending, cancelled, requested)",
        },
        { status: 400 },
      )
    }

    const db = getAdminClient()

    const { data: withdrawal, error: fetchError } = await db
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json({ success: false, error: "Withdrawal not found" }, { status: 404 })
    }

    const storefrontPayout = isStorefrontWithdrawal(withdrawal)

    if (status === "paid") {
      const adminId = authResult.user?.id || "admin"
      const paid = await processWithdrawalPayout(withdrawalId, adminId)
      if (!paid) {
        return NextResponse.json({ success: false, error: "Failed to process payout" }, { status: 500 })
      }

      let commissionResult = { success: true }
      if (!storefrontPayout) {
        commissionResult = await completeWithdrawal(withdrawalId)

        if (admin_notes) {
          await db.from("withdrawals").update({ admin_notes }).eq("id", withdrawalId)
        }

        const newPaidOut = Number(withdrawal.amount) || 0
        const { data: agentRow } = await db
          .from("agents")
          .select("totalpaidout")
          .eq("id", withdrawal.agent_id)
          .single()

        await db
          .from("agents")
          .update({
            totalpaidout: (Number(agentRow?.totalpaidout) || 0) + newPaidOut,
            updated_at: new Date().toISOString(),
          })
          .eq("id", withdrawal.agent_id)
      } else if (admin_notes) {
        await db.from("withdrawals").update({ admin_notes }).eq("id", withdrawalId)
      }

      return NextResponse.json({
        success: true,
        message: storefrontPayout
          ? "Storefront commission payout marked paid"
          : "Withdrawal paid successfully",
        commission_processed: commissionResult.success,
      })
    }

    if (status === "rejected") {
      await db
        .from("withdrawals")
        .update({
          status: "rejected",
          admin_notes,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId)

      if (storefrontPayout) {
        await restoreStorefrontCommissionBalance(
          withdrawal.agent_id,
          Number(withdrawal.amount) || 0,
        )
        return NextResponse.json({
          success: true,
          message: "Storefront commission payout rejected; balance restored",
          commission_processed: false,
        })
      }

      const commissionResult = await cancelWithdrawal(withdrawalId)

      return NextResponse.json({
        success: true,
        message: "Withdrawal rejected",
        commission_processed: commissionResult.success,
      })
    }

    const updateData: Record<string, unknown> = {
      status,
      admin_notes,
      updated_at: new Date().toISOString(),
    }

    if (status === "processing") {
      updateData.processing_at = new Date().toISOString()
    }

    const { error: updateError } = await db.from("withdrawals").update(updateData).eq("id", withdrawalId)

    if (updateError) {
      return NextResponse.json({ success: false, error: "Failed to update withdrawal" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Withdrawal ${status} successfully` })
  } catch (error) {
    console.error("[admin/withdrawals] PATCH error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process withdrawal",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: "Admin authentication required" }, { status: 401 })
    }

    const { id: withdrawalId } = await params
    const db = getAdminClient()

    const { data: withdrawal, error } = await db
      .from("withdrawals")
      .select(`*, agents (id, full_name, phone_number, momo_number)`)
      .eq("id", withdrawalId)
      .single()

    if (error || !withdrawal) {
      return NextResponse.json({ success: false, error: "Withdrawal not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: withdrawal })
  } catch (error) {
    console.error("[admin/withdrawals] GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch withdrawal" }, { status: 500 })
  }
}

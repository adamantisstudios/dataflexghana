import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Reject a pending wallet top-up request.
 *
 * Mirrors the dashboard's `rejectWalletTopup`, which sets status + approved_by
 * directly through Supabase. The status guard is applied in the WHERE clause so
 * two admins racing on the same request cannot both "succeed", and an already
 * credited (approved) top-up can never be flipped to rejected — that has to go
 * through the reversal flow instead.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { id: topupId } = await params
    if (!topupId?.trim()) {
      return NextResponse.json({ success: false, error: "Top-up ID is required" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const adminId =
      (typeof body.admin_id === "string" && body.admin_id.trim()) || adminSession.admin?.id || null
    const reason = typeof body.reason === "string" ? body.reason.trim() : ""

    const db = getAdminClient()

    const { data: topup, error: topupError } = await db
      .from("wallet_topups")
      .select("id, agent_id, amount, status")
      .eq("id", topupId)
      .maybeSingle()

    if (topupError) {
      return NextResponse.json({ success: false, error: topupError.message }, { status: 500 })
    }
    if (!topup) {
      return NextResponse.json({ success: false, error: "Top-up request not found" }, { status: 404 })
    }
    if (topup.status === "rejected") {
      return NextResponse.json({
        success: true,
        data: { topup_id: topupId, status: "rejected", idempotent: true },
        message: "Top-up was already rejected",
      })
    }
    if (topup.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only pending top-ups can be rejected. An approved top-up has already been credited — reverse it instead.",
        },
        { status: 400 },
      )
    }

    const update: Record<string, unknown> = {
      status: "rejected",
      approved_by: adminId,
    }
    if (reason) update.admin_notes = reason

    const { data: updated, error: updateError } = await db
      .from("wallet_topups")
      .update(update)
      .eq("id", topupId)
      .eq("status", "pending")
      .select("id, status")
      .maybeSingle()

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Top-up is no longer pending — refresh and try again" },
        { status: 409 },
      )
    }

    return NextResponse.json({
      success: true,
      data: { topup_id: topupId, agent_id: topup.agent_id, status: "rejected" },
      message: "Wallet top-up rejected",
    })
  } catch (error) {
    console.error("Error rejecting wallet top-up:", error)
    const message = error instanceof Error ? error.message : "Failed to reject wallet top-up"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

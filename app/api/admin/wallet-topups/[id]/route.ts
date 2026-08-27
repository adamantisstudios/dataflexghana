import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** Single top-up request, including the agent it belongs to. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { id: topupId } = await params
    if (!topupId?.trim()) {
      return NextResponse.json({ success: false, error: "Top-up ID is required" }, { status: 400 })
    }

    const { data, error } = await getAdminClient()
      .from("wallet_topups")
      .select("*, agents!inner(id, full_name, phone_number)")
      .eq("id", topupId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ success: false, error: "Top-up request not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error loading wallet top-up:", error)
    const message = error instanceof Error ? error.message : "Failed to load wallet top-up"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/**
 * Delete a resolved top-up request.
 *
 * Pending requests are refused, matching the dashboard: deleting one would drop
 * an agent's claim without ever approving or rejecting it, so it must be
 * resolved first. Approved requests keep their `wallet_transactions` credit —
 * this only removes the request record, never the money.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { id: topupId } = await params
    if (!topupId?.trim()) {
      return NextResponse.json({ success: false, error: "Top-up ID is required" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: topup, error: topupError } = await db
      .from("wallet_topups")
      .select("id, status")
      .eq("id", topupId)
      .maybeSingle()

    if (topupError) {
      return NextResponse.json({ success: false, error: topupError.message }, { status: 500 })
    }
    if (!topup) {
      return NextResponse.json({ success: false, error: "Top-up request not found" }, { status: 404 })
    }
    if (topup.status === "pending") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete a pending top-up request. Approve or reject it first, then delete if needed.",
        },
        { status: 400 },
      )
    }

    const { error: deleteError } = await db.from("wallet_topups").delete().eq("id", topupId)

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { topup_id: topupId },
      message: "Wallet top-up request deleted",
    })
  } catch (error) {
    console.error("Error deleting wallet top-up:", error)
    const message = error instanceof Error ? error.message : "Failed to delete wallet top-up"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

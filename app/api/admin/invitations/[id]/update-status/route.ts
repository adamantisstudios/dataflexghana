import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { creditReferringAgentForReferral } from "@/lib/referral-agent-program"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, admin_id } = body

    if (!status || !admin_id) {
      return NextResponse.json(
        { success: false, error: "Status and admin_id are required" },
        { status: 400 },
      )
    }

    const db = getAdminClient()

    const { data: existingCredit, error: fetchError } = await db
      .from("referral_credits")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !existingCredit) {
      return NextResponse.json({ success: false, error: "Referral credit not found" }, { status: 404 })
    }

    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed"],
      confirmed: ["credited"],
      credited: ["paid_out"],
      paid_out: [],
    }

    const allowedNextStatuses = validTransitions[existingCredit.status as string] || []
    if (!allowedNextStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${existingCredit.status} to ${status}` },
        { status: 400 },
      )
    }

    if (status === "credited") {
      const creditResult = await creditReferringAgentForReferral(id, admin_id)
      if (!creditResult.success) {
        return NextResponse.json({ success: false, error: creditResult.message }, { status: 500 })
      }

      const { data: updated } = await db.from("referral_credits").select("*").eq("id", id).single()

      try {
        await db.from("invitation_audit_log").insert({
          admin_id,
          referral_id: id,
          action: "status_changed_to_credited",
          created_at: new Date().toISOString(),
        })
      } catch {
        /* audit optional */
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: creditResult.message,
      })
    }

    const updateData: Record<string, string> = { status }
    if (status === "confirmed") {
      updateData.confirmed_at = new Date().toISOString()
    } else if (status === "paid_out") {
      updateData.paid_out_at = new Date().toISOString()
    }

    const { data, error } = await db.from("referral_credits").update(updateData).eq("id", id).select()

    if (error) {
      throw error
    }

    try {
      await db.from("invitation_audit_log").insert({
        admin_id,
        referral_id: id,
        action: `status_changed_to_${status}`,
        created_at: new Date().toISOString(),
      })
    } catch {
      /* audit optional */
    }

    return NextResponse.json({
      success: true,
      data: data?.[0],
      message: `Invitation status updated to ${status}`,
    })
  } catch (error) {
    console.error("Error updating invitation:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update invitation" },
      { status: 500 },
    )
  }
}

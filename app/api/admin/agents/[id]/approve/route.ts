import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { createAdminAdjustment } from "@/lib/earnings-calculator"
import { ensureReferralCreditOnAgentApproval } from "@/lib/referral-agent-program"

export const dynamic = "force-dynamic"

// PATCH - Approve a new agent and credit 5 cedis welcome bonus; queue referral reward if referred
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params
    const body = await request.json()
    const { admin_id } = body

    if (!agentId || !admin_id) {
      return NextResponse.json({ success: false, error: "Agent ID and admin ID are required" }, { status: 400 })
    }

    const db = getAdminClient()

    const { data: adminData, error: adminError } = await db
      .from("admin_users")
      .select("id, full_name, is_active")
      .eq("id", admin_id)
      .single()

    if (adminError || !adminData?.is_active) {
      return NextResponse.json({ success: false, error: "Invalid or inactive admin" }, { status: 403 })
    }

    const { data: agent, error: agentError } = await db
      .from("agents")
      .select("id, full_name, isapproved, isbanned, referral_code")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    if (agent.isapproved === true) {
      return NextResponse.json({ success: false, error: "Agent is already approved" }, { status: 400 })
    }

    if (agent.isbanned === true) {
      return NextResponse.json({ success: false, error: "Cannot approve a banned agent" }, { status: 400 })
    }

    const { error: updateError } = await db
      .from("agents")
      .update({
        isapproved: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Failed to update agent status: ${updateError.message}` },
        { status: 500 },
      )
    }

    const adjustmentId = await createAdminAdjustment(
      agentId,
      5,
      admin_id,
      "Approval credit for new agent",
      true,
    )

    if (!adjustmentId) {
      return NextResponse.json({ success: false, error: "Agent approved but failed to credit wallet" }, { status: 500 })
    }

    try {
      await ensureReferralCreditOnAgentApproval(agentId)
    } catch (referralErr) {
      console.error("Referral credit setup on approval:", referralErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        agent_id: agentId,
        agent_name: agent.full_name,
        isapproved: true,
        credit_amount: 5,
        wallet_transaction_id: adjustmentId,
        had_referral: Boolean(agent.referral_code),
        message: `Agent ${agent.full_name} approved. ₵5 credited to their wallet.${
          agent.referral_code ? " Referral reward pending in Invitation Management." : ""
        }`,
      },
    })
  } catch (error: unknown) {
    console.error("Error approving agent:", error)
    const message = error instanceof Error ? error.message : "Failed to approve agent"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

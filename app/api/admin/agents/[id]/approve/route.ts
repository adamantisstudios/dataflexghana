import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"
import { createAdminAdjustment } from "@/lib/earnings-calculator"
import { ensureReferralCreditOnAgentApproval } from "@/lib/referral-agent-program"

export const dynamic = "force-dynamic"

// PATCH - Approve a new agent and credit 5 cedis welcome bonus; queue referral reward if referred
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateAdmin(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Admin authentication required. Please log in again." },
        { status: 401 },
      )
    }

    const { id: agentId } = await params
    const admin = auth.user

    if (!agentId) {
      return NextResponse.json({ success: false, error: "Agent ID is required" }, { status: 400 })
    }

    const db = getAdminClient()

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

    let adjustmentId: string | null = null
    try {
      adjustmentId = await createAdminAdjustment(
        agentId,
        5,
        admin.id,
        "Approval credit for new agent",
        true,
      )
    } catch (creditErr) {
      console.error("[approve] wallet credit failed, reverting approval:", creditErr)
      await db
        .from("agents")
        .update({
          isapproved: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentId)
      const msg = creditErr instanceof Error ? creditErr.message : "Failed to credit wallet"
      return NextResponse.json(
        { success: false, error: `Approval rolled back: ${msg}` },
        { status: 500 },
      )
    }

    if (!adjustmentId) {
      await db
        .from("agents")
        .update({
          isapproved: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentId)
      return NextResponse.json({ success: false, error: "Agent approval rolled back: wallet credit failed" }, { status: 500 })
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

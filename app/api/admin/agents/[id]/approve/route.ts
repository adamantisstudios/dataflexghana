import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { authenticateAdmin } from "@/lib/api-auth"
import { ensureReferralCreditOnAgentApproval } from "@/lib/referral-agent-program"

export const dynamic = "force-dynamic"

const WELCOME_CREDIT_AMOUNT = 5
const WELCOME_CREDIT_DESCRIPTION = "Approval credit for new agent"

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

    let walletTransactionId: string | null = null
    let welcomeBonusSkipped = false

    try {
      const { data: existingBonus, error: existingError } = await db
        .from("wallet_transactions")
        .select("id")
        .eq("agent_id", agentId)
        .eq("transaction_type", "adjustment")
        .eq("amount", WELCOME_CREDIT_AMOUNT)
        .ilike("description", "%approval%")
        .limit(1)
        .maybeSingle()

      if (existingError) {
        throw new Error(`Failed to check existing welcome bonus: ${existingError.message}`)
      }

      if (existingBonus?.id) {
        console.log("[approve] Welcome bonus already credited")
        walletTransactionId = existingBonus.id
        welcomeBonusSkipped = true
      } else {
        const referenceCode = `WELCOME-${agentId.slice(0, 8)}-${Date.now()}`
        const insertRow = {
          agent_id: agentId,
          transaction_type: "adjustment" as const,
          amount: WELCOME_CREDIT_AMOUNT,
          description: WELCOME_CREDIT_DESCRIPTION,
          status: "approved" as const,
          reference_code: referenceCode,
          created_at: new Date().toISOString(),
        }

        console.log("[approve] wallet_transactions direct insert:", insertRow)

        const { data: inserted, error: insertError } = await db
          .from("wallet_transactions")
          .insert(insertRow)
          .select("id")
          .single()

        if (insertError) {
          console.error("[approve] wallet insert failed — exact error:", insertError.message)
          console.error("[approve] wallet insert error details:", insertError)
          throw new Error(insertError.message)
        }

        walletTransactionId = inserted?.id ?? null
        if (!walletTransactionId) {
          throw new Error("Wallet credit insert returned no transaction id")
        }
      }
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
        credit_amount: WELCOME_CREDIT_AMOUNT,
        wallet_transaction_id: walletTransactionId,
        welcome_bonus_skipped: welcomeBonusSkipped,
        had_referral: Boolean(agent.referral_code),
        message: welcomeBonusSkipped
          ? `Agent ${agent.full_name} approved. Welcome bonus was already on file.${
              agent.referral_code ? " Referral reward pending in Invitation Management." : ""
            }`
          : `Agent ${agent.full_name} approved. ₵5 credited to their wallet.${
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

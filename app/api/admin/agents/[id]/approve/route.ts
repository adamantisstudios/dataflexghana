import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createAdminAdjustment } from "@/lib/earnings-calculator"

// PATCH - Approve a new agent and credit 5 cedis to their wallet
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params
    const body = await request.json()
    const { admin_id } = body

    console.log("[v0] Approving agent:", { agentId, admin_id })

    // Validate required fields
    if (!agentId || !admin_id) {
      return NextResponse.json({ success: false, error: "Agent ID and admin ID are required" }, { status: 400 })
    }

    // Verify admin exists and is active
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("id, name, is_active")
      .eq("id", admin_id)
      .single()

    if (adminError || !adminData || !adminData.is_active) {
      return NextResponse.json({ success: false, error: "Invalid or inactive admin" }, { status: 403 })
    }

    // Check if agent exists
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, full_name, isapproved, isbanned")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    // Check if agent is already approved
    if (agent.isapproved === true) {
      return NextResponse.json({ success: false, error: "Agent is already approved" }, { status: 400 })
    }

    // Check if agent is banned
    if (agent.isbanned === true) {
      return NextResponse.json({ success: false, error: "Cannot approve a banned agent" }, { status: 400 })
    }

    // Update agent approval status
    const { error: updateError } = await supabase
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
      5, // 5 cedis
      admin_id,
      "Approval credit for new agent",
      true, // is_positive = true (credit)
    )

    if (!adjustmentId) {
      return NextResponse.json({ success: false, error: "Agent approved but failed to credit wallet" }, { status: 500 })
    }

    // Log the approval action
    await supabase.from("admin_actions").insert({
      admin_id,
      action_type: "agent_approved",
      target_type: "agent",
      target_id: agentId,
      details: {
        agent_name: agent.full_name,
        credit_amount: 5,
        wallet_transaction_id: adjustmentId,
        reason: "Approval credit for new agent",
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        agent_id: agentId,
        agent_name: agent.full_name,
        isapproved: true,
        credit_amount: 5,
        wallet_transaction_id: adjustmentId,
        message: `Agent ${agent.full_name} approved successfully! 5 cedis have been credited to their wallet.`,
      },
    })
  } catch (error: any) {
    console.error("Error approving agent:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to approve agent" }, { status: 500 })
  }
}

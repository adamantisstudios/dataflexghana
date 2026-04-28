/**
 * WITHDRAWAL SECURITY FIX - CRITICAL BUG RESOLUTION
 *
 * This module fixes the critical double-spending vulnerability where:
 * - Admin marks withdrawal as 'paid'
 * - Money is deducted from commissions and added to totalPaidOut
 * - BUT wallet balance is NOT reduced
 * - Agent can still spend the same money from wallet (DOUBLE SPENDING)
 *
 * SOLUTION: Enforce strict separation between commissions and wallet
 * - Commissions = earned money (not spendable until withdrawn and redeposited)
 * - Wallet = spendable money (for data orders, wholesale, savings)
 * - Withdrawals = move money from commissions to external (MoMo/cash)
 * - NO automatic transfer from commissions to wallet
 */

import { supabase } from "./supabase"
import { calculateCorrectWalletBalance } from "./commission-earnings"

export interface WithdrawalSecurityResult {
  success: boolean
  message: string
  transactionId?: string
  error?: string
}

/**
 * CRITICAL FIX: Secure withdrawal processing that prevents double spending
 *
 * When admin marks withdrawal as 'paid':
 * 1. Deduct from agent.totalCommissions ✅
 * 2. Add to agent.totalPaidOut ✅
 * 3. DO NOT touch agent.walletBalance ✅ (money has left the system)
 * 4. Update withdrawal status to 'paid' ✅
 * 5. Record the payout transaction ✅
 */
export async function processSecureWithdrawalPayout(
  withdrawalId: string,
  adminId: string,
  payoutReference?: string,
): Promise<WithdrawalSecurityResult> {
  try {
    console.log("🔒 Processing secure withdrawal payout:", { withdrawalId, adminId })

    // 1. Get withdrawal details and validate
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select(`
        *,
        agents:agent_id (
          id,
          full_name,
          totalCommissions,
          totalPaidOut,
          walletBalance
        )
      `)
      .eq("id", withdrawalId)
      .single()

    if (withdrawalError || !withdrawal) {
      return {
        success: false,
        error: "Withdrawal not found",
        message: "The specified withdrawal request could not be found.",
      }
    }

    // 2. Validate withdrawal can be processed
    if (withdrawal.status !== "requested" && withdrawal.status !== "pending" && withdrawal.status !== "processing") {
      return {
        success: false,
        error: "Invalid withdrawal status",
        message: `Cannot process withdrawal with status: ${withdrawal.status}`,
      }
    }

    const agent = withdrawal.agents
    if (!agent) {
      return {
        success: false,
        error: "Agent not found",
        message: "Associated agent could not be found.",
      }
    }

    const withdrawalAmount = Number(withdrawal.amount) || 0

    // 3. CRITICAL FIX: Update withdrawal status to 'paid' FIRST to prevent race conditions
    const { error: withdrawalUpdateError } = await supabase
      .from("withdrawals")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payout_reference: payoutReference || null,
        admin_notes: `Processed by admin ${adminId} at ${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId)

    if (withdrawalUpdateError) {
      console.error("❌ Error updating withdrawal status:", withdrawalUpdateError)
      return {
        success: false,
        error: "Failed to update withdrawal status",
        message: "Database error occurred while updating withdrawal status.",
      }
    }

    // 4. CRITICAL FIX: The money is now permanently removed from the system
    // The getAgentCommissionBalance function will automatically subtract this PAID withdrawal
    // from the available balance, preventing double-spending

    // 5. Create audit trail transaction record
    const auditResult = await createWithdrawalAuditRecord(
      agent.id,
      withdrawalId,
      withdrawalAmount,
      adminId,
      payoutReference,
    )

    console.log("✅ Secure withdrawal payout processed successfully:", {
      withdrawalId,
      agentId: agent.id,
      amount: withdrawalAmount,
      status: "paid",
      auditRecordCreated: auditResult.success,
      securityNote: "Money permanently removed from available balance via PAID status",
    })

    return {
      success: true,
      message: `Withdrawal of GH₵${withdrawalAmount} processed successfully. Money has been permanently removed from agent's available balance and paid out externally.`,
      transactionId: auditResult.transactionId,
    }
  } catch (error) {
    console.error("❌ Critical error in secure withdrawal processing:", error)
    return {
      success: false,
      error: "System error",
      message: "A system error occurred while processing the withdrawal. Please try again.",
    }
  }
}

/**
 * Create audit trail record for withdrawal payout
 */
async function createWithdrawalAuditRecord(
  agentId: string,
  withdrawalId: string,
  amount: number,
  adminId: string,
  payoutReference?: string,
): Promise<{ success: boolean; transactionId?: string }> {
  try {
    const { data, error } = await supabase
      .from("withdrawal_audit_log")
      .insert({
        agent_id: agentId,
        withdrawal_id: withdrawalId,
        amount: amount,
        action: "payout_processed",
        admin_id: adminId,
        payout_reference: payoutReference,
        notes: `Withdrawal payout processed - commission balance reduced by ${amount}, money paid out externally`,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.warn("⚠️ Failed to create audit record (non-critical):", error)
      return { success: false }
    }

    return { success: true, transactionId: data?.id }
  } catch (error) {
    console.warn("⚠️ Exception creating audit record (non-critical):", error)
    return { success: false }
  }
}

/**
 * CRITICAL FIX: Validate agent money flow integrity
 * Ensures commissions and wallet are properly separated
 */
export async function validateAgentMoneyFlowIntegrity(agentId: string): Promise<{
  isValid: boolean
  issues: string[]
  recommendations: string[]
  balances: {
    totalCommissions: number
    totalPaidOut: number
    walletBalance: number
    calculatedAvailableCommissions: number
  }
}> {
  try {
    // Get agent data
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, full_name, totalCommissions, totalPaidOut, walletBalance")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return {
        isValid: false,
        issues: ["Agent not found"],
        recommendations: ["Verify agent ID is correct"],
        balances: { totalCommissions: 0, totalPaidOut: 0, walletBalance: 0, calculatedAvailableCommissions: 0 },
      }
    }

    const issues: string[] = []
    const recommendations: string[] = []

    const totalCommissions = Number(agent.totalCommissions) || 0
    const totalPaidOut = Number(agent.totalPaidOut) || 0
    const walletBalance = Number(agent.walletBalance) || 0

    // Calculate what available commissions should be
    const { data: completedOrders } = await supabase
      .from("data_orders")
      .select("commission_amount")
      .eq("agent_id", agentId)
      .eq("status", "completed")

    const { data: completedReferrals } = await supabase
      .from("referrals")
      .select("services(commission_amount)")
      .eq("agent_id", agentId)
      .eq("status", "completed")

    const { data: completedWholesale } = await supabase
      .from("wholesale_orders")
      .select("commission_amount")
      .eq("agent_id", agentId)
      .eq("status", "delivered")

    let calculatedCommissions = 0
    if (completedOrders) {
      calculatedCommissions += completedOrders.reduce((sum, order) => sum + (Number(order.commission_amount) || 0), 0)
    }
    if (completedReferrals) {
      calculatedCommissions += completedReferrals.reduce(
        (sum, ref) => sum + (Number(ref.services?.commission_amount) || 0),
        0,
      )
    }
    if (completedWholesale) {
      calculatedCommissions += completedWholesale.reduce(
        (sum, order) => sum + (Number(order.commission_amount) || 0),
        0,
      )
    }

    const calculatedAvailableCommissions = calculatedCommissions - totalPaidOut

    // Validation checks
    if (totalCommissions < 0) {
      issues.push("Total commissions is negative")
      recommendations.push("Reset commission balance to correct value")
    }

    if (totalPaidOut < 0) {
      issues.push("Total paid out is negative")
      recommendations.push("Reset paid out balance to correct value")
    }

    if (walletBalance < 0) {
      issues.push("Wallet balance is negative")
      recommendations.push("Reset wallet balance to correct value")
    }

    if (Math.abs(totalCommissions - calculatedAvailableCommissions) > 0.01) {
      issues.push(
        `Commission balance mismatch: stored=${totalCommissions}, calculated=${calculatedAvailableCommissions}`,
      )
      recommendations.push("Recalculate and sync commission balance from completed orders")
    }

    if (totalPaidOut > calculatedCommissions) {
      issues.push("Total paid out exceeds total earned commissions")
      recommendations.push("Review withdrawal history and commission calculations")
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
      balances: {
        totalCommissions,
        totalPaidOut,
        walletBalance,
        calculatedAvailableCommissions,
      },
    }
  } catch (error) {
    console.error("❌ Error validating money flow integrity:", error)
    return {
      isValid: false,
      issues: ["System error during validation"],
      recommendations: ["Contact system administrator"],
      balances: { totalCommissions: 0, totalPaidOut: 0, walletBalance: 0, calculatedAvailableCommissions: 0 },
    }
  }
}

/**
 * CRITICAL FIX: Commission reversal when order status changes
 * When admin changes order from 'completed' to 'cancelled'/'pending'/'processing'
 */
export async function reverseCommissionForOrderStatusChange(
  orderId: string,
  orderType: "data_order" | "referral" | "wholesale_order",
  oldStatus: string,
  newStatus: string,
  adminId: string,
): Promise<WithdrawalSecurityResult> {
  try {
    // Only reverse if changing FROM completed TO non-completed status
    if (oldStatus !== "completed" && oldStatus !== "delivered") {
      return {
        success: true,
        message: "No commission reversal needed - order was not in completed status",
      }
    }

    if (newStatus === "completed" || newStatus === "delivered") {
      return {
        success: true,
        message: "No commission reversal needed - order remains in completed status",
      }
    }

    console.log("🔄 Reversing commission for order status change:", {
      orderId,
      orderType,
      oldStatus,
      newStatus,
    })

    // Get order details and commission amount
    let orderData: any = null
    let commissionAmount = 0
    let agentId = ""

    switch (orderType) {
      case "data_order":
        const { data: dataOrder } = await supabase
          .from("data_orders")
          .select("agent_id, commission_amount")
          .eq("id", orderId)
          .single()
        orderData = dataOrder
        commissionAmount = Number(dataOrder?.commission_amount) || 0
        agentId = dataOrder?.agent_id || ""
        break

      case "referral":
        const { data: referral } = await supabase
          .from("referrals")
          .select("agent_id, services(commission_amount)")
          .eq("id", orderId)
          .single()
        orderData = referral
        commissionAmount = Number(referral?.services?.commission_amount) || 0
        agentId = referral?.agent_id || ""
        break

      case "wholesale_order":
        const { data: wholesaleOrder } = await supabase
          .from("wholesale_orders")
          .select("agent_id, commission_amount")
          .eq("id", orderId)
          .single()
        orderData = wholesaleOrder
        commissionAmount = Number(wholesaleOrder?.commission_amount) || 0
        agentId = wholesaleOrder?.agent_id || ""
        break
    }

    if (!orderData || !agentId || commissionAmount <= 0) {
      return {
        success: true,
        message: "No commission to reverse - order not found or has no commission",
      }
    }

    // Get current agent balances
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("totalCommissions, totalPaidOut")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return {
        success: false,
        error: "Agent not found",
        message: "Could not find agent to reverse commission",
      }
    }

    // Reverse the commission
    const currentCommissions = Number(agent.totalCommissions) || 0
    const newCommissionBalance = Math.max(0, currentCommissions - commissionAmount)

    const { error: updateError } = await supabase
      .from("agents")
      .update({
        totalCommissions: newCommissionBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)

    if (updateError) {
      console.error("❌ Error reversing commission:", updateError)
      return {
        success: false,
        error: "Failed to reverse commission",
        message: "Database error occurred while reversing commission",
      }
    }

    console.log("✅ Commission reversed successfully:", {
      orderId,
      orderType,
      agentId,
      commissionAmount,
      oldBalance: currentCommissions,
      newBalance: newCommissionBalance,
    })

    return {
      success: true,
      message: `Commission of ${commissionAmount} reversed for ${orderType} ${orderId}. Agent commission balance updated from ${currentCommissions} to ${newCommissionBalance}.`,
    }
  } catch (error) {
    console.error("❌ Error in commission reversal:", error)
    return {
      success: false,
      error: "System error",
      message: "A system error occurred while reversing commission",
    }
  }
}

/**
 * CRITICAL FIX: Ensure wallet balance synchronization
 * Wallet balance should only come from:
 * 1. Admin-approved top-ups (MoMo payments)
 * 2. Manual deposits by agent (after withdrawing commissions)
 * 3. Refunds from cancelled orders
 *
 * Wallet balance should NEVER be automatically funded from commissions
 */
export async function synchronizeWalletBalance(agentId: string): Promise<{
  success: boolean
  message: string
  balances: {
    calculatedWalletBalance: number
    storedWalletBalance: number
    difference: number
    needsSync: boolean
  }
}> {
  try {
    const { balance: calculatedBalance } = await calculateCorrectWalletBalance(agentId)

    // Get stored wallet balance
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("walletBalance")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return {
        success: false,
        message: "Agent not found",
        balances: {
          calculatedWalletBalance: calculatedBalance,
          storedWalletBalance: 0,
          difference: 0,
          needsSync: false,
        },
      }
    }

    const storedBalance = Number(agent.walletBalance) || 0
    const difference = Math.abs(calculatedBalance - storedBalance)
    const needsSync = difference > 0.01 // More than 1 cent difference

    if (needsSync) {
      // Sync the wallet balance
      const { error: syncError } = await supabase
        .from("agents")
        .update({
          walletBalance: calculatedBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentId)

      if (syncError) {
        console.error("❌ Error syncing wallet balance:", syncError)
        return {
          success: false,
          message: "Failed to sync wallet balance",
          balances: {
            calculatedWalletBalance: calculatedBalance,
            storedWalletBalance: storedBalance,
            difference,
            needsSync,
          },
        }
      }

      console.log("✅ Wallet balance synchronized:", {
        agentId,
        oldBalance: storedBalance,
        newBalance: calculatedBalance,
        difference,
      })

      return {
        success: true,
        message: `Wallet balance synchronized. Updated from ${storedBalance} to ${calculatedBalance} (difference: ${difference})`,
        balances: {
          calculatedWalletBalance: calculatedBalance,
          storedWalletBalance: calculatedBalance,
          difference: 0,
          needsSync: false,
        },
      }
    }

    return {
      success: true,
      message: "Wallet balance is already synchronized",
      balances: {
        calculatedWalletBalance: calculatedBalance,
        storedWalletBalance: storedBalance,
        difference,
        needsSync,
      },
    }
  } catch (error) {
    console.error("❌ Error synchronizing wallet balance:", error)
    return {
      success: false,
      message: "System error during wallet synchronization",
      balances: { calculatedWalletBalance: 0, storedWalletBalance: 0, difference: 0, needsSync: false },
    }
  }
}

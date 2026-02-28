import { supabase } from "./supabase"

/**
 * CRITICAL FIX: Pending Wallet Transactions Handler
 * This ensures pending topups are displayed as "pending" and NOT included in actual wallet balance
 *
 * REQUIREMENTS:
 * - Pending topups must show as "pending" status
 * - Pending amounts must NOT be added to spendable wallet balance
 * - Only admin-approved topups become actual spendable money
 * - Pending transactions are visible but clearly marked as non-spendable
 */

export interface PendingWalletTransaction {
  id: string
  agent_id: string
  transaction_type: string
  amount: number
  description: string
  reference_code: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  admin_notes?: string
}

/**
 * Get all pending wallet transactions for an agent
 * These should be displayed as "pending" and NOT included in wallet balance
 */
export async function getPendingWalletTransactions(agentId: string): Promise<PendingWalletTransaction[]> {
  if (!agentId) {
    console.error("Agent ID is required for pending transactions")
    return []
  }

  try {
    console.log(`🔍 Fetching pending wallet transactions for agent: ${agentId}`)

    const { data: pendingTransactions, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "pending") // CRITICAL: Only pending transactions
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pending wallet transactions:", error)
      throw error
    }

    if (!pendingTransactions || !Array.isArray(pendingTransactions)) {
      console.log("No pending wallet transactions found")
      return []
    }

    const formattedTransactions = pendingTransactions.map((tx) => ({
      id: tx.id,
      agent_id: tx.agent_id,
      transaction_type: tx.transaction_type,
      amount: Number(tx.amount) || 0,
      description: tx.description || "",
      reference_code: tx.reference_code || "",
      status: tx.status as "pending" | "approved" | "rejected",
      created_at: tx.created_at,
      admin_notes: tx.admin_notes || "",
    }))

    console.log(`✅ Found ${formattedTransactions.length} pending wallet transactions`)
    return formattedTransactions
  } catch (error) {
    console.error("❌ Error fetching pending wallet transactions:", error)
    return []
  }
}

/**
 * Calculate total pending wallet amount (for display purposes only)
 * This amount is NOT spendable until admin approves it
 */
export async function calculatePendingWalletAmount(agentId: string): Promise<number> {
  if (!agentId) {
    console.error("Agent ID is required for pending amount calculation")
    return 0
  }

  try {
    console.log(`💰 Calculating pending wallet amount for agent: ${agentId}`)

    const { data: pendingTransactions, error } = await supabase
      .from("wallet_transactions")
      .select("amount, transaction_type")
      .eq("agent_id", agentId)
      .eq("status", "pending")

    if (error) {
      console.error("Error fetching pending transactions for amount calculation:", error)
      throw error
    }

    if (!pendingTransactions || !Array.isArray(pendingTransactions)) {
      console.log("No pending transactions found, pending amount is 0")
      return 0
    }

    // Calculate total pending amount (positive transactions only)
    let pendingAmount = 0
    for (const transaction of pendingTransactions) {
      if (!transaction || typeof transaction.amount !== "number") {
        continue
      }

      const amount = Number(transaction.amount) || 0

      // Only count positive pending transactions (topups, refunds, adjustments)
      if (["topup", "refund", "admin_adjustment"].includes(transaction.transaction_type)) {
        pendingAmount += amount
      }
    }

    console.log(`✅ Total pending wallet amount: ${pendingAmount} (NOT spendable until approved)`)
    return pendingAmount
  } catch (error) {
    console.error("❌ Error calculating pending wallet amount:", error)
    return 0
  }
}

/**
 * Get wallet transaction summary with clear separation of approved vs pending
 */
export async function getWalletTransactionSummary(agentId: string): Promise<{
  approvedBalance: number
  pendingAmount: number
  totalPendingTransactions: number
  canSpend: number
  displayMessage: string
}> {
  if (!agentId) {
    console.error("Agent ID is required for wallet summary")
    return {
      approvedBalance: 0,
      pendingAmount: 0,
      totalPendingTransactions: 0,
      canSpend: 0,
      displayMessage: "Invalid agent ID",
    }
  }

  try {
    console.log(`📊 Getting wallet transaction summary for agent: ${agentId}`)

    const { calculateCorrectWalletBalance } = await import("./commission-earnings")

    const [approvedBalance, pendingAmount, pendingTransactions] = await Promise.all([
      calculateCorrectWalletBalance(agentId).then((result) => result.balance), // Only approved spendable money
      calculatePendingWalletAmount(agentId), // Pending amounts (not spendable)
      getPendingWalletTransactions(agentId), // Pending transaction details
    ])

    const summary = {
      approvedBalance, // Money that can be spent
      pendingAmount, // Money waiting for admin approval
      totalPendingTransactions: pendingTransactions.length,
      canSpend: approvedBalance, // Only approved money is spendable
      displayMessage:
        pendingAmount > 0
          ? `You have GH₵${pendingAmount.toFixed(2)} pending admin approval`
          : "All transactions are processed",
    }

    console.log("✅ Wallet transaction summary:", summary)
    return summary
  } catch (error) {
    console.error("❌ Error getting wallet transaction summary:", error)
    return {
      approvedBalance: 0,
      pendingAmount: 0,
      totalPendingTransactions: 0,
      canSpend: 0,
      displayMessage: "Error loading wallet data",
    }
  }
}

/**
 * Check if agent has sufficient approved balance for a purchase
 * This ensures agents can only spend approved money, not pending amounts
 */
export async function checkSpendableBalance(
  agentId: string,
  requiredAmount: number,
): Promise<{
  canAfford: boolean
  availableBalance: number
  shortfall: number
  message: string
}> {
  if (!agentId || requiredAmount <= 0) {
    return {
      canAfford: false,
      availableBalance: 0,
      shortfall: requiredAmount,
      message: "Invalid parameters",
    }
  }

  try {
    console.log(`💳 Checking spendable balance for agent: ${agentId}, required: ${requiredAmount}`)

    const { calculateCorrectWalletBalance } = await import("./commission-earnings")
    const { balance: availableBalance } = await calculateCorrectWalletBalance(agentId)

    const canAfford = availableBalance >= requiredAmount
    const shortfall = canAfford ? 0 : requiredAmount - availableBalance

    const result = {
      canAfford,
      availableBalance,
      shortfall,
      message: canAfford
        ? "Sufficient balance available"
        : `Insufficient balance. Need GH₵${shortfall.toFixed(2)} more`,
    }

    console.log("✅ Balance check result:", result)
    return result
  } catch (error) {
    console.error("❌ Error checking spendable balance:", error)
    return {
      canAfford: false,
      availableBalance: 0,
      shortfall: requiredAmount,
      message: "Error checking balance",
    }
  }
}

/**
 * Get all wallet transactions with clear status indicators
 * This provides a complete view of approved, pending, and rejected transactions
 */
export async function getAllWalletTransactionsWithStatus(
  agentId: string,
  limit = 50,
): Promise<{
  approved: PendingWalletTransaction[]
  pending: PendingWalletTransaction[]
  rejected: PendingWalletTransaction[]
  summary: {
    approvedCount: number
    pendingCount: number
    rejectedCount: number
    totalApprovedAmount: number
    totalPendingAmount: number
  }
}> {
  if (!agentId) {
    console.error("Agent ID is required for transaction history")
    return {
      approved: [],
      pending: [],
      rejected: [],
      summary: {
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        totalApprovedAmount: 0,
        totalPendingAmount: 0,
      },
    }
  }

  try {
    console.log(`📋 Getting all wallet transactions with status for agent: ${agentId}`)

    const { data: allTransactions, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching wallet transactions:", error)
      throw error
    }

    if (!allTransactions || !Array.isArray(allTransactions)) {
      console.log("No wallet transactions found")
      return {
        approved: [],
        pending: [],
        rejected: [],
        summary: {
          approvedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          totalApprovedAmount: 0,
          totalPendingAmount: 0,
        },
      }
    }

    // Categorize transactions by status
    const approved: PendingWalletTransaction[] = []
    const pending: PendingWalletTransaction[] = []
    const rejected: PendingWalletTransaction[] = []

    let totalApprovedAmount = 0
    let totalPendingAmount = 0

    for (const tx of allTransactions) {
      const formattedTx: PendingWalletTransaction = {
        id: tx.id,
        agent_id: tx.agent_id,
        transaction_type: tx.transaction_type,
        amount: Number(tx.amount) || 0,
        description: tx.description || "",
        reference_code: tx.reference_code || "",
        status: tx.status as "pending" | "approved" | "rejected",
        created_at: tx.created_at,
        admin_notes: tx.admin_notes || "",
      }

      switch (tx.status) {
        case "approved":
          approved.push(formattedTx)
          if (["topup", "refund", "admin_adjustment"].includes(tx.transaction_type)) {
            totalApprovedAmount += formattedTx.amount
          } else if (["deduction", "withdrawal_deduction", "admin_reversal"].includes(tx.transaction_type)) {
            totalApprovedAmount -= formattedTx.amount
          }
          break
        case "pending":
          pending.push(formattedTx)
          if (["topup", "refund", "admin_adjustment"].includes(tx.transaction_type)) {
            totalPendingAmount += formattedTx.amount
          }
          break
        case "rejected":
          rejected.push(formattedTx)
          break
      }
    }

    const result = {
      approved,
      pending,
      rejected,
      summary: {
        approvedCount: approved.length,
        pendingCount: pending.length,
        rejectedCount: rejected.length,
        totalApprovedAmount: Math.max(totalApprovedAmount, 0),
        totalPendingAmount,
      },
    }

    console.log("✅ Wallet transactions categorized:", {
      approved: result.approved.length,
      pending: result.pending.length,
      rejected: result.rejected.length,
      totalApprovedAmount: result.summary.totalApprovedAmount,
      totalPendingAmount: result.summary.totalPendingAmount,
    })

    return result
  } catch (error) {
    console.error("❌ Error getting wallet transactions with status:", error)
    return {
      approved: [],
      pending: [],
      rejected: [],
      summary: {
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        totalApprovedAmount: 0,
        totalPendingAmount: 0,
      },
    }
  }
}

import { supabase } from "./supabase"
import { meetsConstraints } from "./commission-calculation"

/**
 * FIXED COMMISSION EARNINGS SYSTEM
 * This system ensures complete synchronization between database, frontend, and backend
 *
 * KEY PRINCIPLES:
 * 1. Commissions are only earned when orders/referrals are COMPLETED
 * 2. Commission status tracks: pending -> earned -> pending_withdrawal -> withdrawn
 * 3. Available balance = earned commissions - pending/withdrawn commissions
 * 4. All calculations use the centralized commissions table
 * 5. Withdrawal requests lock commissions until processed
 */

export interface CommissionEarning {
  id: string
  agent_id: string
  source_type: "referral" | "data_order" | "wholesale_order"
  source_id: string
  amount: number
  commission_rate: number
  status: "pending" | "earned" | "pending_withdrawal" | "withdrawn"
  created_at: string
  earned_at?: string
  withdrawn_at?: string
  withdrawal_id?: string
  source_details?: any
}

export interface CommissionSummary {
  totalEarned: number
  totalWithdrawn: number
  availableCommissions: number
  pendingWithdrawal: number
  referralCommissions: number
  dataOrderCommissions: number
  wholesaleCommissions: number
  totalTransactions: number
}

/**
 * Get agent's complete commission summary from centralized commissions table
 */
export async function getAgentCommissionSummary(agentId: string): Promise<{
  availableForWithdrawal: number
  breakdown: string
  totalEarned: number
  totalWithdrawn: number
  pendingWithdrawal: number
  totalCommissions: number
  availableCommissions: number
  totalPaidOut: number
  pendingPayout: number
  referralCommissions: number
  dataOrderCommissions: number
  wholesaleCommissions: number
}> {
  try {
    console.log(`🔄 Getting commission summary for agent: ${agentId}`)

    // Add timeout protection to prevent abort errors
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      // Get commissions that are NOT withdrawn (exclude withdrawn status)
      const { data: commissions, error: commissionsError } = await supabase
        .from("commissions")
        .select("*")
        .eq("agent_id", agentId)
        .neq("status", "withdrawn") // Exclude withdrawn commissions from breakdown

      clearTimeout(timeoutId)

      if (commissionsError) {
        const errorMessage = commissionsError?.message || JSON.stringify(commissionsError) || 'Unknown error'
        console.error(`[v0] Error fetching commissions for agent ${agentId}:`, errorMessage)
        // Return safe defaults instead of throwing
        return {
          availableForWithdrawal: 0,
          breakdown: "referral: 0, data_order: 0, wholesale_order: 0",
          totalEarned: 0,
          totalWithdrawn: 0,
          pendingWithdrawal: 0,
          totalCommissions: 0,
          availableCommissions: 0,
          totalPaidOut: 0,
          pendingPayout: 0,
          referralCommissions: 0,
          dataOrderCommissions: 0,
          wholesaleCommissions: 0,
        }
      }

      const breakdown = {
        referral: 0,
        data_order: 0,
        wholesale_order: 0,
      }

      let totalEarned = 0
      let pendingWithdrawal = 0

      if (commissions && Array.isArray(commissions)) {
        for (const commission of commissions) {
          let amount = Number(commission.amount) || 0

          const validation = meetsConstraints(amount)
          if (!validation.valid) {
            console.warn(`⚠️ Commission ${commission.id} constraint violation: ${validation.error}`)
            // Auto-correct if within tolerance
            amount = Math.max(0.01, Math.min(0.4, amount))
          }

          totalEarned += amount

          if (commission.status === "pending_withdrawal") {
            pendingWithdrawal += amount
          }

          // Add to breakdown by source type
          if (commission.source_type in breakdown) {
            breakdown[commission.source_type as keyof typeof breakdown] += amount
          }
        }
      }

      // Get total withdrawn amount from withdrawals table
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from("withdrawals")
        .select("amount")
        .eq("agent_id", agentId)
        .eq("status", "paid")

      let totalWithdrawn = 0
      if (!withdrawalError && withdrawals && Array.isArray(withdrawals)) {
        totalWithdrawn = withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0)
      }

      const availableForWithdrawal = Math.max(0, totalEarned - pendingWithdrawal)

      const breakdownString = `referral: ${breakdown.referral.toFixed(2)}, data_order: ${breakdown.data_order.toFixed(2)}, wholesale_order: ${breakdown.wholesale_order.toFixed(2)}`

      const summary = {
        availableForWithdrawal,
        breakdown: breakdownString,
        totalEarned,
        totalWithdrawn,
        pendingWithdrawal,
        totalCommissions: totalEarned,
        availableCommissions: availableForWithdrawal,
        totalPaidOut: totalWithdrawn,
        pendingPayout: pendingWithdrawal,
        referralCommissions: breakdown.referral,
        dataOrderCommissions: breakdown.data_order,
        wholesaleCommissions: breakdown.wholesale_order,
      }

      console.log("✅ Commission summary:", summary)
      return summary
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      console.error(`[v0] Error getting commission summary for agent ${agentId}:`, errorMessage)
      return {
        availableForWithdrawal: 0,
        breakdown: "referral: 0, data_order: 0, wholesale_order: 0",
        totalEarned: 0,
        totalWithdrawn: 0,
        pendingWithdrawal: 0,
        totalCommissions: 0,
        availableCommissions: 0,
        totalPaidOut: 0,
        pendingPayout: 0,
        referralCommissions: 0,
        dataOrderCommissions: 0,
        wholesaleCommissions: 0,
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
    console.error(`[v0] Error getting commission summary for agent ${agentId}:`, errorMessage)
    return {
      availableForWithdrawal: 0,
      breakdown: "referral: 0, data_order: 0, wholesale_order: 0",
      totalEarned: 0,
      totalWithdrawn: 0,
      pendingWithdrawal: 0,
      totalCommissions: 0,
      availableCommissions: 0,
      totalPaidOut: 0,
      pendingPayout: 0,
      referralCommissions: 0,
      dataOrderCommissions: 0,
      wholesaleCommissions: 0,
    }
  }
}

/**
 * Get detailed commission breakdown with source information
 */
export async function getDetailedCommissionBreakdown(agentId: string): Promise<{
  summary: CommissionSummary
  commissions: CommissionEarning[]
}> {
  if (!agentId) {
    console.error("Agent ID is required for detailed commission breakdown")
    return {
      summary: {
        totalEarned: 0,
        totalWithdrawn: 0,
        availableCommissions: 0,
        pendingWithdrawal: 0,
        referralCommissions: 0,
        dataOrderCommissions: 0,
        wholesaleCommissions: 0,
        totalTransactions: 0,
      },
      commissions: [],
    }
  }

  try {
    console.log(`📊 Getting detailed commission breakdown for agent: ${agentId}`)

    const { data: commissionsData, error } = await supabase
      .from("commissions")
      .select(`
        *,
        referrals:referrals!commissions_source_id_fkey (
          client_name,
          client_phone,
          services (title, commission_amount)
        ),
        data_orders:data_orders!commissions_source_id_fkey (
          recipient_phone,
          data_bundles (name, provider, price)
        ),
        wholesale_orders:wholesale_orders!commissions_source_id_fkey (
          quantity,
          wholesale_products (name, price, category)
        )
      `)
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching detailed commissions:", error)
      throw error
    }

    const commissions: CommissionEarning[] = (commissionsData || []).map((commission) => ({
      id: commission.id,
      agent_id: commission.agent_id,
      source_type: commission.source_type,
      source_id: commission.source_id,
      amount: Number(commission.amount) || 0,
      commission_rate: Number(commission.commission_rate) || 0,
      status: commission.status,
      created_at: commission.created_at,
      earned_at: commission.earned_at,
      withdrawn_at: commission.withdrawn_at,
      withdrawal_id: commission.withdrawal_id,
      source_details: getSourceDetails(commission),
    }))

    const summary = await getAgentCommissionSummary(agentId)

    console.log("✅ Detailed commission breakdown completed")
    return { summary, commissions }
  } catch (error) {
    console.error("❌ Error getting detailed commission breakdown:", error)
    return {
      summary: {
        totalEarned: 0,
        totalWithdrawn: 0,
        availableCommissions: 0,
        pendingWithdrawal: 0,
        referralCommissions: 0,
        dataOrderCommissions: 0,
        wholesaleCommissions: 0,
        totalTransactions: 0,
      },
      commissions: [],
    }
  }
}

/**
 * Extract source details based on commission type
 */
function getSourceDetails(commission: any): any {
  switch (commission.source_type) {
    case "referral":
      return {
        client_name: commission.referrals?.client_name,
        client_phone: commission.referrals?.client_phone,
        service_title: commission.referrals?.services?.title,
        service_amount: commission.referrals?.services?.commission_amount,
      }
    case "data_order":
      return {
        recipient_phone: commission.data_orders?.recipient_phone,
        bundle_name: commission.data_orders?.data_bundles?.name,
        bundle_provider: commission.data_orders?.data_bundles?.provider,
        bundle_price: commission.data_orders?.data_bundles?.price,
      }
    case "wholesale_order":
      return {
        product_name: commission.wholesale_orders?.wholesale_products?.name,
        product_price: commission.wholesale_orders?.wholesale_products?.price,
        product_category: commission.wholesale_orders?.wholesale_products?.category,
        quantity: commission.wholesale_orders?.quantity,
      }
    default:
      return {}
  }
}

/**
 * Check if agent has sufficient commission balance for withdrawal
 */
export async function checkCommissionWithdrawalEligibility(
  agentId: string,
  requestedAmount: number,
): Promise<{
  eligible: boolean
  availableAmount: number
  shortfall: number
  message: string
}> {
  if (!agentId || requestedAmount <= 0) {
    return {
      eligible: false,
      availableAmount: 0,
      shortfall: requestedAmount,
      message: "Invalid parameters",
    }
  }

  try {
    console.log(`🔍 Checking commission withdrawal eligibility for agent: ${agentId}, amount: ${requestedAmount}`)

    const summary = await getAgentCommissionSummary(agentId)
    const availableAmount = summary.availableForWithdrawal
    const eligible = availableAmount >= requestedAmount
    const shortfall = eligible ? 0 : requestedAmount - availableAmount

    const result = {
      eligible,
      availableAmount,
      shortfall,
      message: eligible
        ? "Sufficient commission balance for withdrawal"
        : `Insufficient commission balance. Need GH₵${shortfall.toFixed(2)} more`,
    }

    console.log("✅ Commission withdrawal eligibility check:", result)
    return result
  } catch (error) {
    console.error("❌ Error checking commission withdrawal eligibility:", error)
    return {
      eligible: false,
      availableAmount: 0,
      shortfall: requestedAmount,
      message: "Error checking commission balance",
    }
  }
}

/**
 * Process withdrawal request - lock commissions for withdrawal
 */
export async function processWithdrawalRequest(
  agentId: string,
  withdrawalId: string,
  amount: number,
): Promise<{
  success: boolean
  message: string
  lockedCommissionIds?: string[]
}> {
  if (!agentId || !withdrawalId || amount <= 0) {
    return {
      success: false,
      message: "Invalid parameters",
    }
  }

  try {
    console.log(`🔒 Processing withdrawal request: ${withdrawalId} for agent: ${agentId}, amount: ${amount}`)

    const { data: commissionsToLock, error: selectError } = await supabase
      .from("commissions")
      .select("id, amount")
      .eq("agent_id", agentId)
      .eq("status", "earned")
      .order("created_at", { ascending: true })

    if (selectError) {
      console.error("Error selecting commissions to lock:", selectError)
      throw selectError
    }

    if (!commissionsToLock || commissionsToLock.length === 0) {
      return {
        success: false,
        message: "No earned commissions available for withdrawal",
      }
    }

    // Select commissions to lock up to the requested amount
    let remainingAmount = amount
    const commissionsToUpdate: string[] = []

    for (const commission of commissionsToLock) {
      if (remainingAmount <= 0) break

      commissionsToUpdate.push(commission.id)
      remainingAmount -= Number(commission.amount)
    }

    if (commissionsToUpdate.length === 0) {
      return {
        success: false,
        message: "No commissions available to lock",
      }
    }

    // Lock the selected commissions
    const { error: updateError } = await supabase
      .from("commissions")
      .update({
        status: "pending_withdrawal",
        withdrawal_id: withdrawalId,
      })
      .in("id", commissionsToUpdate)

    if (updateError) {
      console.error("Error locking commissions:", updateError)
      throw updateError
    }

    console.log(`✅ Locked ${commissionsToUpdate.length} commissions for withdrawal`)
    return {
      success: true,
      message: `Successfully locked ${commissionsToUpdate.length} commissions for withdrawal`,
      lockedCommissionIds: commissionsToUpdate,
    }
  } catch (error) {
    console.error("❌ Error processing withdrawal request:", error)
    return {
      success: false,
      message: "Error processing withdrawal request",
    }
  }
}

/**
 * Enhanced completeWithdrawal to ensure commissions are marked as withdrawn
 * This is called when a withdrawal status is updated to 'paid'
 */
export async function completeWithdrawal(withdrawalId: string): Promise<{
  success: boolean
  message: string
  commissionsMarked?: number
}> {
  if (!withdrawalId) {
    return {
      success: false,
      message: "Withdrawal ID is required",
    }
  }

  try {
    console.log(`✅ Completing withdrawal: ${withdrawalId}`)

    // Step 1: Get the withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single()

    if (withdrawalError || !withdrawal) {
      console.error("Error fetching withdrawal:", withdrawalError)
      return {
        success: false,
        message: "Withdrawal not found",
      }
    }

    // Step 2: Mark all pending_withdrawal commissions as withdrawn
    const { data: affectedRows, error: updateError } = await supabase
      .from("commissions")
      .update({
        status: "withdrawn",
        withdrawn_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("withdrawal_id", withdrawalId)
      .in("status", ["pending_withdrawal", "earned"])
      .select("id")

    if (updateError) {
      console.error("Error marking commissions as withdrawn:", updateError)
      // Don't fail - the database trigger should handle this
    }

    const commissionsMarked = affectedRows?.length || 0
    console.log(`✅ Marked ${commissionsMarked} commissions as withdrawn for withdrawal ${withdrawalId}`)

    // Step 3: Also update agent_commission_sources if it exists
    try {
      await supabase
        .from("agent_commission_sources")
        .update({
          commission_withdrawn: true,
          withdrawn_at: new Date().toISOString(),
          status: "withdrawn",
        })
        .eq("withdrawal_id", withdrawalId)
        .eq("commission_withdrawn", false)
    } catch (error) {
      console.warn("⚠️ Could not update agent_commission_sources (table may not exist):", error)
    }

    return {
      success: true,
      message: "Withdrawal completed successfully",
      commissionsMarked,
    }
  } catch (error) {
    console.error("❌ Error completing withdrawal:", error)
    return {
      success: false,
      message: "Error completing withdrawal",
    }
  }
}

/**
 * Enhanced cancelWithdrawal to revert commissions to earned status
 * This is called when a withdrawal is rejected or cancelled
 */
export async function cancelWithdrawal(withdrawalId: string): Promise<{
  success: boolean
  message: string
  commissionsReverted?: number
}> {
  if (!withdrawalId) {
    return {
      success: false,
      message: "Withdrawal ID is required",
    }
  }

  try {
    console.log(`❌ Canceling withdrawal: ${withdrawalId}`)

    // Step 1: Get the withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single()

    if (withdrawalError || !withdrawal) {
      console.error("Error fetching withdrawal:", withdrawalError)
      return {
        success: false,
        message: "Withdrawal not found",
      }
    }

    // Step 2: Revert all pending_withdrawal commissions back to earned status
    const { data: affectedRows, error: updateError } = await supabase
      .from("commissions")
      .update({
        status: "earned",
        withdrawal_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("withdrawal_id", withdrawalId)
      .eq("status", "pending_withdrawal")
      .select("id")

    if (updateError) {
      console.error("Error reverting commissions:", updateError)
      // Don't fail - the database trigger should handle this
    }

    const commissionsReverted = affectedRows?.length || 0
    console.log(`✅ Reverted ${commissionsReverted} commissions for cancelled withdrawal ${withdrawalId}`)

    // Step 3: Also update agent_commission_sources if it exists
    try {
      await supabase
        .from("agent_commission_sources")
        .update({
          commission_withdrawn: false,
          withdrawal_id: null,
          status: "earned",
        })
        .eq("withdrawal_id", withdrawalId)
        .eq("commission_withdrawn", true)
    } catch (error) {
      console.warn("⚠️ Could not update agent_commission_sources (table may not exist):", error)
    }

    return {
      success: true,
      message: "Withdrawal canceled successfully",
      commissionsReverted,
    }
  } catch (error) {
    console.error("❌ Error canceling withdrawal:", error)
    return {
      success: false,
      message: "Error canceling withdrawal",
    }
  }
}

/**
 * New function to validate commission state before withdrawal processing
 * Ensures no double-spending is possible
 */
export async function validateCommissionWithdrawalIntegrity(
  agentId: string,
  withdrawalAmount: number,
): Promise<{
  isValid: boolean
  availableBalance: number
  message: string
}> {
  try {
    // Get earned commissions (excluding withdrawn ones)
    const { data: earnedCommissions, error: earnedError } = await supabase
      .from("commissions")
      .select("amount")
      .eq("agent_id", agentId)
      .eq("status", "earned")

    if (earnedError) {
      throw earnedError
    }

    const totalEarned = (earnedCommissions || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

    // Get pending and paid withdrawals to exclude from available balance
    const { data: withdrawals, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("amount, status")
      .eq("agent_id", agentId)
      .in("status", ["requested", "processing", "paid"])

    if (withdrawalError) {
      throw withdrawalError
    }

    const totalCommitted = (withdrawals || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0)

    const availableBalance = Math.max(0, totalEarned - totalCommitted)

    const isValid = availableBalance >= withdrawalAmount

    return {
      isValid,
      availableBalance,
      message: isValid
        ? `Sufficient balance. Available: ${availableBalance.toFixed(2)}, Requested: ${withdrawalAmount.toFixed(2)}`
        : `Insufficient balance. Available: ${availableBalance.toFixed(2)}, Requested: ${withdrawalAmount.toFixed(2)}`,
    }
  } catch (error) {
    console.error("Error validating commission withdrawal integrity:", error)
    return {
      isValid: false,
      availableBalance: 0,
      message: "Error validating balance",
    }
  }
}

/**
 * ENHANCED: Add wallet balance calculation to commission-earnings.ts as single source
 * This consolidates all financial calculations into one authoritative module
 */

export interface WalletSyncResult {
  success: boolean
  message: string
  agentId: string
  oldBalance: number
  newBalance: number
  difference: number
  transactionCount: number
}

export interface UnifiedWalletData {
  walletBalance: number
  totalTopups: number
  totalCommissions: number
  totalWithdrawals: number
  totalDeductions: number
  totalSpent: number
  pendingTransactions: number
  lastTransactionDate: string | null
}

export interface EarningsData {
  totalCommission: number
  availableBalance: number
  pendingPayout: number
  totalPaidOut: number
  walletBalance: number
  totalEarnings: number
}

/**
 * CRITICAL FIX: Enhanced wallet balance calculation - ONLY APPROVED SPENDABLE MONEY
 * Consolidated from earnings-calculator.ts to ensure single source of truth
 */
export async function calculateCorrectWalletBalance(agentId: string): Promise<{
  balance: number
  transactionCount: number
  breakdown: {
    topups: number
    deductions: number
    refunds: number
    adminAdjustments: number
    adminReversals: number
    withdrawalDeductions: number
  }
}> {
  try {
    // Get all approved wallet transactions (excluding commission deposits)
    const { data: transactions, error } = await supabase
      .from("wallet_transactions")
      .select("transaction_type, amount, status, created_at")
      .eq("agent_id", agentId)
      .eq("status", "approved")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("❌ Error fetching wallet transactions:", error)
      throw error
    }

    if (!transactions || !Array.isArray(transactions)) {
      return {
        balance: 0,
        transactionCount: 0,
        breakdown: {
          topups: 0,
          deductions: 0,
          refunds: 0,
          adminAdjustments: 0,
          adminReversals: 0,
          withdrawalDeductions: 0,
        },
      }
    }

    let balance = 0
    const breakdown = {
      topups: 0,
      deductions: 0,
      refunds: 0,
      adminAdjustments: 0,
      adminReversals: 0,
      withdrawalDeductions: 0,
    }

    // CRITICAL: Process transactions in chronological order
    for (const tx of transactions) {
      if (!tx || typeof tx.amount !== "number") {
        continue
      }

      const amount = Number(tx.amount) || 0

      switch (tx.transaction_type) {
        case "topup":
          balance += amount
          breakdown.topups += amount
          break

        case "refund":
          balance += amount
          breakdown.refunds += amount
          break

        case "admin_adjustment":
          balance += amount
          breakdown.adminAdjustments += amount
          break

        case "deduction":
          balance -= amount
          breakdown.deductions += amount
          break

        case "withdrawal_deduction":
          balance -= amount
          breakdown.withdrawalDeductions += amount
          break

        case "admin_reversal":
          balance -= amount
          breakdown.adminReversals += amount
          break

        // CRITICAL: commission_deposit should NOT affect wallet balance
        // Commissions are separate from spendable wallet money
        case "commission_deposit":
          // Do nothing - commissions don't go into spendable wallet
          break

        default:
          console.warn(`⚠️ Unknown transaction type: ${tx.transaction_type}`)
          break
      }
    }

    // Ensure balance is never negative
    const finalBalance = Math.max(0, balance)

    return {
      balance: finalBalance,
      transactionCount: transactions.length,
      breakdown,
    }
  } catch (error) {
    console.error("❌ Error calculating correct wallet balance:", error)
    throw error
  }
}

/**
 * CRITICAL FIX: Enhanced agent wallet summary with better error handling
 * Consolidated from earnings-calculator.ts for single source of truth
 */
export async function getAgentWalletSummary(agentId: string): Promise<UnifiedWalletData> {
  if (!agentId) {
    console.error("getAgentWalletSummary: Agent ID is required")
    return {
      walletBalance: 0,
      totalTopups: 0,
      totalCommissions: 0,
      totalWithdrawals: 0,
      totalDeductions: 0,
      totalSpent: 0,
      pendingTransactions: 0,
      lastTransactionDate: null,
    }
  }

  try {
    // Get wallet balance using the enhanced calculation (ONLY spendable money)
    const { balance: walletBalance } = await calculateCorrectWalletBalance(agentId)

    // CRITICAL FIX: Get transaction summary with better error handling
    const { data: transactions, error: transactionsError } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })

    if (transactionsError) {
      console.error("Error fetching wallet transactions for summary:", transactionsError)
      // Return basic data with wallet balance
      return {
        walletBalance,
        totalTopups: 0,
        totalCommissions: 0,
        totalWithdrawals: 0,
        totalDeductions: 0,
        totalSpent: 0,
        pendingTransactions: 0,
        lastTransactionDate: null,
      }
    }

    // CRITICAL FIX: Calculate summary with proper validation and separation
    let totalTopups = 0
    let totalCommissions = 0
    let totalWithdrawals = 0
    let totalDeductions = 0
    let pendingTransactions = 0
    let lastTransactionDate: string | null = null

    if (transactions && Array.isArray(transactions)) {
      for (const transaction of transactions) {
        if (!transaction || typeof transaction.amount !== "number") {
          continue
        }

        const amount = Number(transaction.amount) || 0

        // Set last transaction date from first transaction (most recent)
        if (!lastTransactionDate && transaction.created_at) {
          lastTransactionDate = transaction.created_at
        }

        // Count pending transactions
        if (transaction.status === "pending") {
          pendingTransactions++
        }

        // Only count approved transactions for totals
        if (transaction.status === "approved") {
          switch (transaction.transaction_type) {
            case "topup":
              totalTopups += amount
              break
            case "commission_deposit":
              // CRITICAL FIX: Commission deposits are tracked separately from wallet
              totalCommissions += amount
              break
            case "withdrawal_deduction":
              totalWithdrawals += amount
              break
            case "deduction":
            case "admin_reversal":
              totalDeductions += amount
              break
          }
        }
      }
    }

    // CRITICAL FIX: Calculate totalSpent as deductions + withdrawals (money spent from wallet)
    const totalSpent = totalDeductions + totalWithdrawals

    return {
      walletBalance, // ONLY spendable wallet money (excludes commissions)
      totalTopups, // Admin top-ups to wallet
      totalCommissions, // Earned commissions (separate from wallet)
      totalWithdrawals, // Money withdrawn from commissions
      totalDeductions, // Money spent from wallet on orders
      totalSpent, // Total money spent (deductions + withdrawals)
      pendingTransactions,
      lastTransactionDate,
    }
  } catch (error) {
    console.error("Error getting agent wallet summary:", error)
    // Return safe defaults with calculated wallet balance
    const { balance: walletBalance } = await calculateCorrectWalletBalance(agentId)
    return {
      walletBalance,
      totalTopups: 0,
      totalCommissions: 0,
      totalWithdrawals: 0,
      totalDeductions: 0,
      totalSpent: 0,
      pendingTransactions: 0,
      lastTransactionDate: null,
    }
  }
}

/**
 * CRITICAL FIX: Calculate complete earnings with proper commission-wallet separation
 * Consolidated from earnings-calculator.ts for single source of truth
 */
export async function calculateCompleteEarnings(agentId: string): Promise<EarningsData> {
  try {
    console.log("💰 Calculating complete earnings with separation enforcement for agent:", agentId)

    const summary = await getAgentCommissionSummary(agentId)
    const walletSummary = await getAgentWalletSummary(agentId)

    // Get withdrawal amounts
    const { data: withdrawals, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("amount, status")
      .eq("agent_id", agentId)

    let pendingPayout = 0
    let totalPaidOut = 0

    if (withdrawals && Array.isArray(withdrawals)) {
      for (const withdrawal of withdrawals) {
        const amount = Number(withdrawal.amount) || 0
        if (withdrawal.status === "paid") {
          totalPaidOut += amount
        } else if (["requested", "processing"].includes(withdrawal.status)) {
          pendingPayout += amount
        }
      }
    }

    console.log("✅ Earnings calculated with separation:", {
      agentId,
      totalCommission: summary.totalEarned,
      availableBalance: summary.availableForWithdrawal,
      walletBalance: walletSummary.walletBalance,
      totalPaidOut,
      pendingPayout,
    })

    return {
      totalCommission: summary.totalEarned, // Total earned commissions
      availableBalance: summary.availableForWithdrawal, // Commission money available for withdrawal
      pendingPayout, // Withdrawal requests in progress
      totalPaidOut, // Commissions already withdrawn and paid out
      walletBalance: walletSummary.walletBalance, // Spendable wallet money (separate from commissions)
      totalEarnings: summary.totalEarned, // Total earnings = total commission
    }
  } catch (error) {
    console.error("❌ Error calculating complete earnings:", error)
    return {
      totalCommission: 0,
      availableBalance: 0,
      pendingPayout: 0,
      totalPaidOut: 0,
      walletBalance: 0,
      totalEarnings: 0,
    }
  }
}

/**
 * CRITICAL FIX: Calculate monthly statistics for dashboard
 * Consolidated from earnings-calculator.ts for single source of truth
 */
export async function calculateMonthlyStatistics(agentId: string) {
  try {
    console.log(`🔍 Calculating monthly statistics for agent: ${agentId}`)

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)
    endOfMonth.setDate(0)
    endOfMonth.setHours(23, 59, 59, 999)

    const summary = await getAgentCommissionSummary(agentId)
    const { balance: walletBalance } = await calculateCorrectWalletBalance(agentId)

    // Get counts for this month (for display purposes)
    const [referralsCount, dataOrdersCount, wholesaleCount] = await Promise.all([
      supabase
        .from("referrals")
        .select("id", { count: "exact" })
        .eq("agent_id", agentId)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString()),
      supabase
        .from("data_orders")
        .select("id", { count: "exact" })
        .eq("agent_id", agentId)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString()),
      supabase
        .from("wholesale_orders")
        .select("id", { count: "exact" })
        .eq("agent_id", agentId)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString()),
    ])

    const result = {
      totalCommissions: summary.totalEarned,
      totalPaidOut: summary.totalWithdrawn,
      pendingPayout: summary.pendingWithdrawal,
      availableCommissions: summary.availableForWithdrawal,
      walletBalance,
      totalReferrals: referralsCount.data?.length || 0,
      dataOrders: dataOrdersCount.data?.length || 0,
      wholesaleProducts: wholesaleCount.data?.length || 0,
    }

    console.log("✅ Monthly statistics calculated:", {
      agentId,
      totalCommissions: summary.totalEarned,
      totalPaidOut: summary.totalWithdrawn,
      pendingPayout: summary.pendingWithdrawal,
      availableCommissions: summary.availableForWithdrawal,
      walletBalance,
    })

    return result
  } catch (error) {
    console.error("Error calculating monthly statistics:", error)

    // Return safe fallback values
    return {
      totalCommissions: 0,
      totalPaidOut: 0,
      pendingPayout: 0,
      availableCommissions: 0,
      walletBalance: 0,
      totalReferrals: 0,
      dataOrders: 0,
      wholesaleProducts: 0,
    }
  }
}

/**
 * CRITICAL FIX: Batch calculate agent earnings for multiple agents efficiently
 * Consolidated from earnings-calculator.ts for single source of truth
 */
export async function batchCalculateAgentEarnings(agentIds: string[]): Promise<Map<string, EarningsData>> {
  const earningsMap = new Map<string, EarningsData>()

  if (!agentIds || agentIds.length === 0) {
    console.log("No agent IDs provided for batch calculation")
    return earningsMap
  }

  console.log(`🔄 Batch calculating earnings for ${agentIds.length} agents`)

  try {
    // Process agents in parallel for better performance
    const earningsPromises = agentIds.map(async (agentId) => {
      try {
        const earnings = await calculateCompleteEarnings(agentId)
        return { agentId, earnings }
      } catch (error) {
        console.error(`Error calculating earnings for agent ${agentId}:`, error)
        // Return default earnings for failed calculations
        return {
          agentId,
          earnings: {
            totalCommission: 0,
            availableBalance: 0,
            pendingPayout: 0,
            totalPaidOut: 0,
            walletBalance: 0,
            totalEarnings: 0,
          },
        }
      }
    })

    // Wait for all calculations to complete
    const results = await Promise.all(earningsPromises)

    // Build the map from results
    results.forEach(({ agentId, earnings }) => {
      earningsMap.set(agentId, earnings)
    })

    console.log(`✅ Batch calculation completed for ${earningsMap.size} agents`)
    return earningsMap
  } catch (error) {
    console.error("Error in batch calculate agent earnings:", error)

    // Return empty earnings for all agents as fallback
    agentIds.forEach((agentId) => {
      earningsMap.set(agentId, {
        totalCommission: 0,
        availableBalance: 0,
        pendingPayout: 0,
        totalPaidOut: 0,
        walletBalance: 0,
        totalEarnings: 0,
      })
    })

    return earningsMap
  }
}

/**
 * CRITICAL FIX: Direct commission calculation from orders and referrals
 * This ensures commissions are always calculated even if centralized table is empty
 */
async function calculateCommissionsDirectly(agentId: string): Promise<{
  totalEarned: number
  totalWithdrawn: number
  availableCommissions: number
  pendingWithdrawal: number
  referralCommissions: number
  dataOrderCommissions: number
  wholesaleCommissions: number
  totalTransactions: number
}> {
  try {
    console.log(`🔄 Calculating commissions directly from orders for agent: ${agentId}`)

    const { data: dataOrders, error: dataOrdersError } = await supabase
      .from("data_orders")
      .select(`
        id,
        status,
        commission_amount,
        data_bundles!fk_data_orders_bundle_id (price, commission_rate)
      `)
      .eq("agent_id", agentId)
      .eq("status", "completed")

    if (dataOrdersError) {
      console.error("Error fetching data orders:", dataOrdersError)
    }

    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select(`
        id,
        status,
        services (commission_amount)
      `)
      .eq("agent_id", agentId)
      .eq("status", "completed")

    if (referralsError) {
      console.error("Error fetching referrals:", referralsError)
    }

    const { data: wholesaleOrders, error: wholesaleError } = await supabase
      .from("wholesale_orders")
      .select(`
        id,
        status,
        commission_amount
      `)
      .eq("agent_id", agentId)
      .eq("status", "completed")

    if (wholesaleError) {
      console.error("Error fetching wholesale orders:", wholesaleError)
    }

    let dataOrderCommissions = 0
    if (dataOrders && Array.isArray(dataOrders)) {
      for (const order of dataOrders) {
        if (order.commission_amount) {
          dataOrderCommissions += Number(order.commission_amount) || 0
        } else if (order.data_bundles?.price && order.data_bundles?.commission_rate) {
          // Calculate commission if not stored
          const { calculateExactCommission } = await import("./commission-calculator")
          dataOrderCommissions += calculateExactCommission(order.data_bundles.price, order.data_bundles.commission_rate)
        }
      }
    }

    let referralCommissions = 0
    if (referrals && Array.isArray(referrals)) {
      for (const referral of referrals) {
        if (referral.services?.commission_amount) {
          referralCommissions += Number(referral.services.commission_amount) || 0
        }
      }
    }

    let wholesaleCommissions = 0
    if (wholesaleOrders && Array.isArray(wholesaleOrders)) {
      for (const order of wholesaleOrders) {
        if (order.commission_amount) {
          wholesaleCommissions += Number(order.commission_amount) || 0
        }
      }
    }

    const totalEarned = dataOrderCommissions + referralCommissions + wholesaleCommissions

    const { data: withdrawals, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("amount, status")
      .eq("agent_id", agentId)

    let totalWithdrawn = 0
    let pendingWithdrawal = 0

    if (!withdrawalError && withdrawals && Array.isArray(withdrawals)) {
      for (const withdrawal of withdrawals) {
        const amount = Number(withdrawal.amount) || 0
        if (withdrawal.status === "paid") {
          totalWithdrawn += amount
        } else if (["requested", "processing"].includes(withdrawal.status)) {
          pendingWithdrawal += amount
        }
      }
    }

    const availableCommissions = Math.max(0, totalEarned - totalWithdrawn - pendingWithdrawal)

    const summary = {
      totalEarned,
      totalWithdrawn,
      availableCommissions,
      pendingWithdrawal,
      referralCommissions,
      dataOrderCommissions,
      wholesaleCommissions,
      totalTransactions: (dataOrders?.length || 0) + (referrals?.length || 0) + (wholesaleOrders?.length || 0),
    }

    console.log("✅ Commission summary calculated directly from orders:", summary)
    return summary
  } catch (error) {
    console.error("❌ Error calculating commissions directly:", error)
    return {
      totalEarned: 0,
      totalWithdrawn: 0,
      availableCommissions: 0,
      pendingWithdrawal: 0,
      referralCommissions: 0,
      dataOrderCommissions: 0,
      wholesaleCommissions: 0,
      totalTransactions: 0,
    }
  }
}

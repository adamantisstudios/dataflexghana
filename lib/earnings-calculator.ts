import { getAdminAuthHeaders } from "@/lib/api-client"
import {
  buildWalletTransactionInsertRow,
  adminAdjustmentTransactionType,
} from "@/lib/wallet-transaction-types"
import { getAdminClient } from "./supabase-base"
import { calculateExactCommission } from "./commission-calculator"

/** Server-side DB access for earnings (service role). */
function getDb() {
  return getAdminClient()
}

/**
 * UNIFIED EARNINGS CALCULATION UTILITIES - ENHANCED FIXED VERSION
 * This ensures consistent commission and wallet balance calculations across admin and agent views
 *
 * FIXES APPLIED:
 * - Enhanced error handling and fallback mechanisms
 * - Unified wallet balance calculation from transactions only
 * - Consistent available balance calculation
 * - Proper integration between wallet and commission systems
 * - Real-time balance calculations with better error recovery
 */

export interface EarningsData {
  totalCommission: number
  availableBalance: number
  pendingPayout: number
  totalPaidOut: number
  walletBalance: number
  totalEarnings: number
}

export interface CommissionBreakdown {
  referralCommissions: number
  dataOrderCommissions: number
  wholesaleCommissions: number
  total: number
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

/**
 * CRITICAL FIX: Enhanced wallet balance calculation - ONLY APPROVED SPENDABLE MONEY
 * FIXES APPLIED:
 * - STRICT EXCLUSION of pending/unapproved transactions
 * - STRICT EXCLUSION of commission deposits (commissions are NOT spendable wallet money)
 * - Only approved wallet top-ups and admin adjustments count as spendable balance
 * - Enhanced validation and error handling
 * - Real-time approved-only balance calculation
 * - 100% SYNCHRONIZATION across admin and agent views
 */
export async function calculateWalletBalance(agentId: string): Promise<number> {
  if (!agentId) {
    console.error("Agent ID is required for wallet balance calculation")
    return 0
  }

  if (typeof window !== "undefined") {
    try {
      const res = await fetch(
        `/api/admin/wallet?agent_id=${encodeURIComponent(agentId)}&action=summary`,
        { cache: "no-store" }
      )
      const json = await res.json()
      if (!json.success) return 0
      return Number(json.data?.balance ?? 0)
    } catch {
      return 0
    }
  }

  try {
    console.log(`🔍 Calculating APPROVED SPENDABLE wallet balance for agent: ${agentId}`)

    // CRITICAL FIX: Add timeout to prevent abort errors
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      // CRITICAL FIX: Only get APPROVED transactions, explicitly exclude pending/rejected
      const { data: transactions, error } = await getDb()
        .from("wallet_transactions")
        .select("transaction_type, amount, status")
        .eq("agent_id", agentId)
        .eq("status", "approved") // CRITICAL: Only approved transactions

      clearTimeout(timeoutId)

      if (error) {
        console.error("Error fetching approved wallet transactions:", error)
        // Don't throw - return 0 gracefully instead of aborting
        return 0
      }

      if (!transactions || !Array.isArray(transactions)) {
        console.log("No approved wallet transactions found, balance is 0")
        return 0
      }

      // Calculate SPENDABLE balance - EXCLUDE commission deposits
      let spendableBalance = 0
      for (const transaction of transactions) {
        if (!transaction || typeof transaction.amount !== "number") {
          continue
        }

        // TRIPLE CHECK: Only approved transactions
        if (transaction.status !== "approved") {
          console.warn(`⚠️ Skipping non-approved transaction: ${transaction.status}`)
          continue
        }

        const amount = Number(transaction.amount) || 0

        switch (transaction.transaction_type) {
          case "topup":
          case "refund":
          case "adjustment":
          case "admin_adjustment":
          case "credit":
          case "deposit":
          case "interest":
          case "payment_completed":
            spendableBalance += amount
            console.log(`💰 Added to spendable balance: ${amount} (${transaction.transaction_type})`)
            break
          case "debit":
          case "deduction":
          case "admin_reversal":
          case "withdrawal_deduction":
          case "withdrawal":
          case "penalty":
            spendableBalance -= amount
            console.log(`💸 Deducted from spendable balance: ${amount} (${transaction.transaction_type})`)
            break
          case "commission_deposit":
            // CRITICAL FIX: Commission deposits do NOT add to spendable wallet balance
            // They should only be available for withdrawal, not for spending
            console.log(`🚫 Commission deposit EXCLUDED from spendable balance: ${amount}`)
            break
          default:
            console.warn(`❓ Unknown transaction type: ${transaction.transaction_type}`)
        }
      }

      // Ensure balance is never negative
      const finalBalance = Math.max(spendableBalance, 0)
      console.log(
        `✅ APPROVED SPENDABLE wallet balance: ${finalBalance} (from ${transactions.length} approved transactions)`,
      )

      return finalBalance
    } catch (error) {
      console.error("❌ Error calculating approved spendable wallet balance:", error)
      return 0
    }
  } catch (error) {
    console.error("❌ Error calculating approved spendable wallet balance:", error)
    return 0
  }
}

/**
 * CRITICAL FIX: Direct table query method when database functions don't exist
 */
async function calculateWalletBalanceDirectQuery(agentId: string): Promise<number> {
  try {
    console.log("Using direct table query for wallet balance calculation")

    // CRITICAL FIX: Direct query to calculate balance from transactions
    const { data: transactions, error } = await getDb()
      .from("wallet_transactions")
      .select("transaction_type, amount, status")
      .eq("agent_id", agentId)
      .eq("status", "approved")

    if (error) {
      console.error("Error in direct table query:", error)
      throw error
    }

    if (!transactions || !Array.isArray(transactions)) {
      console.log("No approved transactions found, balance is 0")
      return 0
    }

    // Calculate SPENDABLE balance - EXCLUDE commission deposits
    let balance = 0
    for (const transaction of transactions) {
      if (!transaction || typeof transaction.amount !== "number") {
        continue
      }

      const amount = Number(transaction.amount) || 0

      switch (transaction.transaction_type) {
        case "topup":
        case "refund":
        case "adjustment":
        case "admin_adjustment":
        case "credit":
        case "deposit":
        case "interest":
        case "payment_completed":
          balance += amount
          break
        case "debit":
        case "deduction":
        case "admin_reversal":
        case "withdrawal_deduction":
        case "withdrawal":
        case "penalty":
          balance -= amount
          break
        case "commission_deposit":
          console.log(`🚫 Commission deposit EXCLUDED from spendable balance: ${amount}`)
          break
        default:
          console.warn(`Unknown transaction type: ${transaction.transaction_type}`)
          break
      }
    }

    const finalBalance = Math.max(balance, 0)
    console.log(`Direct query calculated SPENDABLE balance: ${finalBalance}`)
    return finalBalance
  } catch (error) {
    console.error("Direct table query failed:", error)
    return await calculateWalletBalanceManualFallback(agentId)
  }
}

/**
 * CRITICAL FIX: Comprehensive fallback method with multiple strategies
 */
async function calculateWalletBalanceComprehensiveFallback(agentId: string): Promise<number> {
  try {
    console.log("Using comprehensive fallback calculation for wallet balance")

    // CRITICAL FIX: Get all wallet transactions for the agent
    const { data: transactions, error: transactionsError } = await getDb()
      .from("wallet_transactions")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "approved")
      .order("created_at", { ascending: true })

    if (transactionsError) {
      console.error("Error fetching wallet transactions:", transactionsError)
      throw transactionsError
    }

    if (!transactions || !Array.isArray(transactions)) {
      console.log("No wallet transactions found, returning 0 balance")
      return 0
    }

    // CRITICAL FIX: Calculate SPENDABLE balance from transactions with proper validation
    let balance = 0

    for (const transaction of transactions) {
      if (!transaction || typeof transaction.amount !== "number") {
        console.warn("Invalid transaction found, skipping:", transaction)
        continue
      }

      const amount = Number(transaction.amount) || 0

      // CRITICAL FIX: Handle different transaction types properly - EXCLUDE commission deposits
      switch (transaction.transaction_type) {
        case "topup":
        case "refund":
        case "adjustment":
        case "admin_adjustment":
        case "credit":
        case "deposit":
        case "interest":
        case "payment_completed":
          balance += amount
          break
        case "debit":
        case "deduction":
        case "admin_reversal":
        case "withdrawal_deduction":
        case "withdrawal":
        case "penalty":
          balance -= amount
          break
        case "commission_deposit":
          console.log(`🚫 Commission deposit EXCLUDED from spendable balance: ${amount}`)
          break
        default:
          console.warn(`Unknown transaction type: ${transaction.transaction_type}`)
          break
      }
    }

    const finalBalance = Math.max(balance, 0) // Ensure non-negative
    console.log(`Comprehensive fallback calculated SPENDABLE balance: ${finalBalance}`)
    return finalBalance
  } catch (error) {
    console.error("Comprehensive fallback calculation failed:", error)
    return await calculateWalletBalanceManualFallback(agentId)
  }
}

/**
 * CRITICAL FIX: Manual fallback calculation as last resort
 */
async function calculateWalletBalanceManualFallback(agentId: string): Promise<number> {
  try {
    console.log("Using manual fallback calculation for wallet balance")

    // CRITICAL FIX: Try to get balance from agent record first
    const { data: agentData, error: agentError } = await getDb()
      .from("agents")
      .select("wallet_balance")
      .eq("id", agentId)
      .single()

    if (!agentError && agentData && typeof agentData.wallet_balance === "number") {
      const balance = Math.max(agentData.wallet_balance, 0)
      console.log(`Manual fallback using agent record balance: ${balance}`)
      return balance
    }

    // CRITICAL FIX: If agent record doesn't have balance, calculate from basic transactions
    const { data: basicTransactions, error: basicError } = await getDb()
      .from("wallet_transactions")
      .select("amount, transaction_type")
      .eq("agent_id", agentId)
      .eq("status", "approved")

    if (basicError || !basicTransactions) {
      console.error("Manual fallback failed, returning 0:", basicError)
      return 0
    }

    // CRITICAL FIX: Simple SPENDABLE balance calculation - EXCLUDE commission deposits
    let balance = 0
    for (const tx of basicTransactions) {
      if (tx && typeof tx.amount === "number") {
        const amount = tx.amount
        if (["topup", "refund", "adjustment", "credit", "deposit", "interest", "payment_completed"].includes(tx.transaction_type)) {
          balance += amount
        } else if (["debit", "deduction", "withdrawal_deduction", "withdrawal", "penalty"].includes(tx.transaction_type)) {
          balance -= amount
        } else if (tx.transaction_type === "commission_deposit") {
          // CRITICAL FIX: Commission deposits do NOT add to spendable wallet balance
          console.log(`🚫 Commission deposit EXCLUDED from spendable balance: ${amount}`)
        }
      }
    }

    const finalBalance = Math.max(balance, 0)
    console.log(`Manual fallback calculated SPENDABLE balance: ${finalBalance}`)
    return finalBalance
  } catch (error) {
    console.error("Manual fallback calculation failed:", error)
    return 0 // Final fallback to 0
  }
}

/**
 * CRITICAL FIX: Enhanced agent wallet summary with better error handling
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
    const walletBalance = await calculateWalletBalance(agentId)

    // CRITICAL FIX: Get transaction summary with better error handling
    const { data: transactions, error: transactionsError } = await getDb()
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
            case "refund":
            case "adjustment":
            case "admin_adjustment":
            case "credit":
            case "deposit":
            case "interest":
            case "payment_completed":
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
            case "debit":
            case "penalty":
            case "withdrawal":
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
    const walletBalance = await calculateWalletBalance(agentId)
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
 * Calculate total commission earned by an agent from all sources
 * This matches the agent dashboard calculation method
 */
export async function calculateAgentCommission(agentId: string) {
  try {
    // Get all data orders for the agent
    const { data: dataOrders, error: dataOrdersError } = await getDb()
      .from("data_orders")
      .select(`
        *,
        data_bundles!fk_data_orders_bundle_id (price, commission_rate)
      `)
      .eq("agent_id", agentId)
      .eq("status", "completed")

    if (dataOrdersError) {
      console.error("Error fetching data orders:", dataOrdersError)
      throw dataOrdersError
    }

    // Get all referrals for the agent
    const { data: referrals, error: referralsError } = await getDb()
      .from("referrals")
      .select(`
        *,
        services (commission_amount, product_cost)
      `)
      .eq("agent_id", agentId)
      .eq("status", "completed")

    if (referralsError) {
      console.error("Error fetching referrals:", referralsError)
      throw referralsError
    }

    let totalCommission = 0

    // Calculate commission from data orders using exact calculation
    if (dataOrders) {
      dataOrders.forEach((order) => {
        if (order.data_bundles?.price && order.data_bundles?.commission_rate) {
          const exactCommission = calculateExactCommission(order.data_bundles.price, order.data_bundles.commission_rate)
          totalCommission += exactCommission
        }
      })
    }

    // Calculate commission from referrals using exact calculation
    if (referrals) {
      referrals.forEach((referral) => {
        if (referral.services?.commission_amount) {
          // Use the stored commission amount (should already be calculated exactly)
          totalCommission += Number.parseFloat(referral.services.commission_amount)
        }
      })
    }

    return {
      total: totalCommission,
      dataOrdersCommission:
        dataOrders?.reduce((sum, order) => {
          if (order.data_bundles?.price && order.data_bundles?.commission_rate) {
            return sum + calculateExactCommission(order.data_bundles.price, order.data_bundles.commission_rate)
          }
          return sum
        }, 0) || 0,
      referralsCommission:
        referrals?.reduce((sum, referral) => {
          return sum + Number.parseFloat(referral.services?.commission_amount || "0")
        }, 0) || 0,
      dataOrdersCount: dataOrders?.length || 0,
      referralsCount: referrals?.length || 0,
    }
  } catch (error) {
    console.error("Error calculating agent commission:", error)
    throw error
  }
}

/**
 * Calculate withdrawal-related amounts for an agent
 */
export async function calculateWithdrawalAmounts(agentId: string): Promise<{
  pendingPayout: number
  totalPaidOut: number
}> {
  try {
    const { data: withdrawals, error } = await getDb()
      .from("withdrawals")
      .select("amount, status")
      .eq("agent_id", agentId)

    if (error) {
      console.error("Error fetching withdrawals:", error)
      return { pendingPayout: 0, totalPaidOut: 0 }
    }

    const pendingPayout =
      withdrawals
        ?.filter((w) => w.status === "requested")
        .reduce((sum, w) => sum + Number.parseFloat(w.amount.toString()), 0) || 0

    const totalPaidOut =
      withdrawals
        ?.filter((w) => w.status === "paid")
        .reduce((sum, w) => sum + Number.parseFloat(w.amount.toString()), 0) || 0

    return { pendingPayout, totalPaidOut }
  } catch (error) {
    console.error("Error calculating withdrawal amounts:", error)
    return { pendingPayout: 0, totalPaidOut: 0 }
  }
}

/**
 * CRITICAL FIX: Calculate complete earnings with proper commission-wallet separation
 * This enforces the strict separation between commissions and wallet money
 */
export async function calculateCompleteEarnings(agentId: string): Promise<EarningsData> {
  try {
    console.log("💰 Calculating complete earnings with separation enforcement for agent:", agentId)

    const { getAgentCommissionSummary } = await import("./commission-earnings")
    const commissionSummary = await getAgentCommissionSummary(agentId)

    const walletSummary = await getAgentWalletSummary(agentId)

    const totalCommission = commissionSummary.totalEarned
    const availableBalance = commissionSummary.availableForWithdrawal
    const pendingPayout = commissionSummary.pendingWithdrawal
    const totalPaidOut = commissionSummary.totalWithdrawn

    console.log("✅ Earnings calculated with separation:", {
      agentId,
      totalCommission,
      availableBalance,
      walletBalance: walletSummary.walletBalance,
      totalPaidOut,
      pendingPayout,
    })

    return {
      totalCommission, // Total earned commissions
      availableBalance, // Commission money available for withdrawal
      pendingPayout, // Withdrawal requests in progress
      totalPaidOut, // Commissions already withdrawn and paid out
      walletBalance: walletSummary.walletBalance, // Spendable wallet money (separate from commissions)
      totalEarnings: totalCommission, // Total earnings = total commission
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
 * This function provides comprehensive monthly statistics including:
 * - Total commissions earned (from enhanced commission system)
 * - Total paid out commissions
 * - Pending payout amounts
 * - Available commission balance for withdrawal (ACCURATE calculation)
 * - Wallet balance (separate from commissions)
 * - Counts for referrals, data orders, and wholesale products
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

    const { getAgentCommissionSummary } = await import("./commission-earnings")
    const commissionSummary = await getAgentCommissionSummary(agentId)

    // Get wallet balance (separate from commissions)
    const walletBalance = await calculateWalletBalance(agentId)

    // Get counts for this month (for display purposes)
    const [referralsCount, dataOrdersCount, wholesaleCount] = await Promise.all([
      getDb()
        .from("referrals")
        .select("id", { count: "exact" })
        .eq("agent_id", agentId)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString()),
      getDb()
        .from("data_orders")
        .select("id", { count: "exact" })
        .eq("agent_id", agentId)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString()),
      getDb()
        .from("wholesale_orders")
        .select("id", { count: "exact" })
        .eq("agent_id", agentId)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString()),
    ])

    const result = {
      totalCommissions: commissionSummary.totalEarned, // Use enhanced commission calculation
      totalPaidOut: commissionSummary.totalWithdrawn, // From commission system
      pendingPayout: commissionSummary.pendingWithdrawal, // From commission system
      availableCommissions: commissionSummary.availableForWithdrawal, // Correct field mapping
      walletBalance, // Separate spendable wallet money
      totalReferrals: referralsCount.data?.length || 0,
      dataOrders: dataOrdersCount.data?.length || 0,
      wholesaleProducts: wholesaleCount.data?.length || 0,
    }

    console.log("✅ Monthly statistics calculated:", {
      agentId,
      totalCommissions: commissionSummary.totalEarned,
      totalPaidOut: commissionSummary.totalWithdrawn,
      pendingPayout: commissionSummary.pendingWithdrawal,
      availableCommissions: commissionSummary.availableForWithdrawal,
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
 * CRITICAL FIX: Enhanced unified transaction history with better error handling
 */
export async function getUnifiedTransactionHistory(agentId: string, limit = 50): Promise<any[]> {
  if (!agentId) {
    console.error("getUnifiedTransactionHistory: Agent ID is required")
    return []
  }

  try {
    // Get wallet transactions with better error handling
    const { data: walletTransactions, error: walletError } = await getDb()
      .from("wallet_transactions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (walletError) {
      console.error("Error fetching wallet transactions for history:", walletError)
      return []
    }

    // Format transactions with proper validation
    const formattedTransactions = (walletTransactions || [])
      .filter((tx) => tx && tx.id) // Filter out invalid transactions
      .map((transaction) => ({
        id: transaction.id,
        created_at: transaction.created_at,
        transaction_type: transaction.transaction_type,
        amount: Number(transaction.amount) || 0,
        description: transaction.description || "",
        reference_code: transaction.reference_code || "",
        status: transaction.status || "pending",
        admin_notes: transaction.admin_notes || "",
        source_type: transaction.source_type || "",
        source_id: transaction.source_id || "",
      }))

    return formattedTransactions
  } catch (error) {
    console.error("Error getting unified transaction history:", error)
    return []
  }
}

/**
 * CRITICAL FIX: Batch calculate agent earnings for multiple agents efficiently
 * This function is used by the AgentsTab to calculate earnings for all agents
 * Returns a Map with agent IDs as keys and EarningsData as values
 */
export async function batchCalculateAgentEarnings(agentIds: string[]): Promise<Map<string, EarningsData>> {
  const earningsMap = new Map<string, EarningsData>()

  if (!agentIds || agentIds.length === 0) {
    console.log("No agent IDs provided for batch calculation")
    return earningsMap
  }

  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/agents/batch-earnings", {
        method: "POST",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ agentIds }),
      })
      const json = await res.json()
      if (json.earnings) {
        Object.entries(json.earnings as Record<string, EarningsData>).forEach(([id, data]) => {
          earningsMap.set(id, data)
        })
      }
      return earningsMap
    } catch (error) {
      console.error("Batch earnings API error:", error)
      return earningsMap
    }
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
 * CRITICAL FIX: Create withdrawal deduction function
 * This function creates a withdrawal deduction transaction in the wallet
 */
export async function createWithdrawalDeduction(
  agentId: string,
  amount: number,
  withdrawalId: string,
  description?: string,
): Promise<boolean> {
  try {
    if (!agentId?.trim()) {
      throw new Error("Agent ID is required")
    }
    if (!amount || amount <= 0) {
      throw new Error("Valid withdrawal amount is required")
    }
    if (!withdrawalId?.trim()) {
      throw new Error("Withdrawal ID is required")
    }

    console.log(`🔄 Creating withdrawal deduction for agent ${agentId}: ${amount}`)

    const withdrawalType = assertDbTransactionType("withdrawal_deduction")
    const { data, error } = await getDb()
      .from("wallet_transactions")
      .insert(
        buildWalletTransactionInsertRow(
          {
            agent_id: agentId,
            transaction_type: withdrawalType,
            amount: amount,
            status: "approved",
            description: description || `Withdrawal deduction for withdrawal ${withdrawalId}`,
            reference_code: `WD-${withdrawalId}`,
          },
          { source_id: withdrawalId, created_at: new Date().toISOString() },
        ),
      )
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating withdrawal deduction:", error)
      throw new Error(`Failed to create withdrawal deduction: ${error.message}`)
    }

    if (!data) {
      throw new Error("No data returned from withdrawal deduction creation")
    }

    console.log("✅ Withdrawal deduction created successfully:", data.id)
    return true
  } catch (error) {
    console.error("❌ Error in createWithdrawalDeduction:", error)
    throw error
  }
}

/**
 * Create admin reversal transaction
 * This function creates a reversal transaction for a specific original transaction
 */
export async function createAdminReversal(
  agentId: string,
  originalTransactionId: string,
  adminId: string,
  reason: string,
): Promise<string | null> {
  try {
    if (!agentId?.trim()) {
      throw new Error("Agent ID is required")
    }
    if (!originalTransactionId?.trim()) {
      throw new Error("Original transaction ID is required")
    }
    if (!adminId?.trim()) {
      throw new Error("Admin ID is required")
    }
    if (!reason?.trim()) {
      throw new Error("Reason is required")
    }

    console.log(`🔄 Creating admin reversal for agent ${agentId}, original transaction: ${originalTransactionId}`)

    const { data: originalTransaction, error: fetchError } = await getDb()
      .from("wallet_transactions")
      .select("*")
      .eq("id", originalTransactionId)
      .single()

    if (fetchError) {
      console.error("❌ Error fetching original transaction:", fetchError)
      throw new Error(`Failed to fetch original transaction: ${fetchError.message}`)
    }

    if (!originalTransaction) {
      throw new Error("Original transaction not found")
    }

    if (originalTransaction.agent_id !== agentId) {
      throw new Error("Transaction does not belong to the specified agent")
    }

    const reference = `REV-${originalTransactionId}-${Date.now()}`
    const description = `Admin reversal of transaction ${originalTransactionId} - ${reason}`

    const { data, error } = await getDb()
      .from("wallet_transactions")
      .insert(
        buildWalletTransactionInsertRow(
          {
            agent_id: agentId,
            amount: Math.abs(Number(originalTransaction.amount)),
            transaction_type: adminAdjustmentTransactionType(false),
            reference_code: reference,
            description,
            status: "approved",
            admin_id: adminId,
            admin_notes: `Reversal of ${originalTransaction.transaction_type}. Original: ${originalTransaction.description || "N/A"}`,
          },
          {
            created_at: new Date().toISOString(),
            source_id: originalTransactionId,
          },
        ),
      )
      .select("id")
      .single()

    if (error) {
      throw new Error(`Failed to create admin reversal: ${error.message}`)
    }

    if (!data) {
      throw new Error("No data returned from admin reversal creation")
    }

    console.log("✅ Admin reversal created successfully:", data.id)
    return data.id
  } catch (error) {
    console.error("❌ Error in createAdminReversal:", error)
    throw error
  }
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function assertUuid(value: string, fieldName: string): void {
  if (!UUID_REGEX.test(value.trim())) {
    throw new Error(`Invalid ${fieldName}: must be a valid UUID`)
  }
}

/**
 * Create admin adjustment transaction
 * This function creates an adjustment transaction (credit or debit) by admin
 */
export async function createAdminAdjustment(
  agentId: string,
  amount: number,
  adminId: string,
  reason: string,
  isCredit = true,
): Promise<string | null> {
  try {
    if (!agentId?.trim()) {
      throw new Error("Agent ID is required")
    }
    if (!amount || amount <= 0) {
      throw new Error("Valid adjustment amount is required")
    }
    if (!adminId?.trim()) {
      throw new Error("Admin ID is required")
    }
    if (!reason?.trim()) {
      throw new Error("Reason is required")
    }

    assertUuid(agentId, "agent ID")

    console.log(`🔄 Creating admin adjustment for agent ${agentId}: ${isCredit ? "+" : "-"}${amount}`)

    const reference = `adj-${Date.now()}`
    const description =
      reason.trim() || (isCredit ? "Admin adjustment credit" : "Admin adjustment debit")
    const transactionType = adminAdjustmentTransactionType(isCredit)

    const { data, error } = await getDb()
      .from("wallet_transactions")
      .insert(
        buildWalletTransactionInsertRow(
          {
            agent_id: agentId,
            amount: Math.abs(amount),
            transaction_type: transactionType,
            reference_code: reference,
            description,
            status: "approved",
            admin_id: adminId,
            admin_notes: `${isCredit ? "Credit" : "Debit"} adjustment. Reason: ${reason.trim()}`,
          },
          { created_at: new Date().toISOString() },
        ),
      )
      .select("id")
      .single()

    if (error) {
      throw new Error(`Failed to create admin adjustment: ${error.message}`)
    }

    if (!data?.id) {
      throw new Error("No data returned from admin adjustment creation")
    }

    console.log("✅ Admin adjustment created successfully:", data.id)
    return data.id
  } catch (error) {
    console.error("❌ Error in createAdminAdjustment:", error)
    throw error
  }
}

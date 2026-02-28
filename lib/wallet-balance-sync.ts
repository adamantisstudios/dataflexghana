/**
 * WALLET BALANCE SYNCHRONIZATION SYSTEM
 *
 * Ensures wallet balance is always calculated correctly from wallet_transactions
 * and synchronized with the agents table. This prevents discrepancies and
 * maintains Supabase as the single source of truth.
 */

import { supabase } from "./supabase"
import { calculateCorrectWalletBalance } from "./commission-earnings"

export interface WalletSyncResult {
  success: boolean
  message: string
  agentId: string
  oldBalance: number
  newBalance: number
  difference: number
  transactionCount: number
}

export interface BulkSyncResult {
  totalAgents: number
  successfulSyncs: number
  failedSyncs: number
  totalDifference: number
  results: WalletSyncResult[]
  errors: string[]
}

/**
 * Synchronize wallet balance for a single agent
 */
export async function syncAgentWalletBalance(agentId: string): Promise<WalletSyncResult> {
  try {
    console.log("🔄 Synchronizing wallet balance for agent:", agentId)

    // Get current stored balance
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("walletBalance, full_name")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return {
        success: false,
        message: "Agent not found",
        agentId,
        oldBalance: 0,
        newBalance: 0,
        difference: 0,
        transactionCount: 0,
      }
    }

    const oldBalance = Number(agent.walletBalance) || 0

    const { balance: newBalance, transactionCount, breakdown } = await calculateCorrectWalletBalance(agentId)

    const difference = Math.abs(newBalance - oldBalance)

    // Only update if there's a significant difference (more than 1 cent)
    if (difference > 0.01) {
      const { error: updateError } = await supabase
        .from("agents")
        .update({
          walletBalance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentId)

      if (updateError) {
        console.error("❌ Error updating agent wallet balance:", updateError)
        return {
          success: false,
          message: `Failed to update wallet balance: ${updateError.message}`,
          agentId,
          oldBalance,
          newBalance,
          difference,
          transactionCount,
        }
      }

      console.log("✅ Wallet balance synchronized:", {
        agentId,
        agentName: agent.full_name,
        oldBalance,
        newBalance,
        difference,
        transactionCount,
        breakdown,
      })

      return {
        success: true,
        message: `Wallet balance updated from ${oldBalance} to ${newBalance} (difference: ${difference})`,
        agentId,
        oldBalance,
        newBalance,
        difference,
        transactionCount,
      }
    } else {
      return {
        success: true,
        message: "Wallet balance already synchronized",
        agentId,
        oldBalance,
        newBalance,
        difference,
        transactionCount,
      }
    }
  } catch (error) {
    console.error("❌ Error synchronizing agent wallet balance:", error)
    return {
      success: false,
      message: `System error: ${error instanceof Error ? error.message : "Unknown error"}`,
      agentId,
      oldBalance: 0,
      newBalance: 0,
      difference: 0,
      transactionCount: 0,
    }
  }
}

/**
 * Bulk synchronize wallet balances for all agents
 */
export async function bulkSyncAllWalletBalances(): Promise<BulkSyncResult> {
  try {
    console.log("🔄 Starting bulk wallet balance synchronization...")

    // Get all agents with wallet transactions
    const { data: agentsWithTransactions, error: agentsError } = await supabase
      .from("wallet_transactions")
      .select("agent_id")
      .eq("status", "approved")

    if (agentsError) {
      console.error("❌ Error fetching agents with transactions:", agentsError)
      throw agentsError
    }

    // Get unique agent IDs
    const uniqueAgentIds = [...new Set(agentsWithTransactions?.map((t) => t.agent_id) || [])]

    console.log(`📊 Found ${uniqueAgentIds.length} agents with wallet transactions`)

    const results: WalletSyncResult[] = []
    const errors: string[] = []
    let successfulSyncs = 0
    let failedSyncs = 0
    let totalDifference = 0

    // Process agents in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < uniqueAgentIds.length; i += batchSize) {
      const batch = uniqueAgentIds.slice(i, i + batchSize)

      const batchPromises = batch.map(async (agentId) => {
        try {
          const result = await syncAgentWalletBalance(agentId)
          return result
        } catch (error) {
          const errorMessage = `Agent ${agentId}: ${error instanceof Error ? error.message : "Unknown error"}`
          errors.push(errorMessage)
          return {
            success: false,
            message: errorMessage,
            agentId,
            oldBalance: 0,
            newBalance: 0,
            difference: 0,
            transactionCount: 0,
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Update counters
      for (const result of batchResults) {
        if (result.success) {
          successfulSyncs++
          totalDifference += result.difference
        } else {
          failedSyncs++
        }
      }

      // Small delay between batches to be gentle on the database
      if (i + batchSize < uniqueAgentIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log("✅ Bulk wallet synchronization completed:", {
      totalAgents: uniqueAgentIds.length,
      successfulSyncs,
      failedSyncs,
      totalDifference: totalDifference.toFixed(2),
      errorsCount: errors.length,
    })

    return {
      totalAgents: uniqueAgentIds.length,
      successfulSyncs,
      failedSyncs,
      totalDifference,
      results,
      errors,
    }
  } catch (error) {
    console.error("❌ Error in bulk wallet synchronization:", error)
    return {
      totalAgents: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalDifference: 0,
      results: [],
      errors: [`System error: ${error instanceof Error ? error.message : "Unknown error"}`],
    }
  }
}

/**
 * Validate wallet balance integrity for an agent
 */
export async function validateAgentWalletIntegrity(agentId: string): Promise<{
  isValid: boolean
  issues: string[]
  recommendations: string[]
  balanceInfo: {
    storedBalance: number
    calculatedBalance: number
    difference: number
    transactionCount: number
  }
}> {
  try {
    const issues: string[] = []
    const recommendations: string[] = []

    // Get stored balance
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("walletBalance, full_name")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return {
        isValid: false,
        issues: ["Agent not found"],
        recommendations: ["Verify agent ID is correct"],
        balanceInfo: {
          storedBalance: 0,
          calculatedBalance: 0,
          difference: 0,
          transactionCount: 0,
        },
      }
    }

    const storedBalance = Number(agent.walletBalance) || 0

    const { balance: calculatedBalance, transactionCount, breakdown } = await calculateCorrectWalletBalance(agentId)

    const difference = Math.abs(calculatedBalance - storedBalance)

    // Validation checks
    if (storedBalance < 0) {
      issues.push("Stored wallet balance is negative")
      recommendations.push("Reset wallet balance to correct positive value")
    }

    if (difference > 0.01) {
      issues.push(
        `Balance mismatch: stored=${storedBalance}, calculated=${calculatedBalance}, difference=${difference}`,
      )
      recommendations.push("Synchronize wallet balance from transaction history")
    }

    // Check for suspicious transaction patterns
    if (breakdown.withdrawalDeductions > breakdown.topups + breakdown.refunds + breakdown.adminAdjustments) {
      issues.push("More money withdrawn than deposited (possible double spending)")
      recommendations.push("Review withdrawal history and transaction integrity")
    }

    if (transactionCount === 0 && storedBalance > 0) {
      issues.push("Agent has wallet balance but no wallet transactions")
      recommendations.push("Investigate source of wallet balance or reset to zero")
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
      balanceInfo: {
        storedBalance,
        calculatedBalance,
        difference,
        transactionCount,
      },
    }
  } catch (error) {
    console.error("❌ Error validating wallet integrity:", error)
    return {
      isValid: false,
      issues: ["System error during validation"],
      recommendations: ["Contact system administrator"],
      balanceInfo: {
        storedBalance: 0,
        calculatedBalance: 0,
        difference: 0,
        transactionCount: 0,
      },
    }
  }
}

/**
 * Get wallet synchronization report for admin dashboard
 */
export async function getWalletSyncReport(): Promise<{
  summary: {
    totalAgents: number
    agentsWithDiscrepancies: number
    totalDiscrepancyAmount: number
    lastSyncDate: string | null
  }
  topDiscrepancies: Array<{
    agentId: string
    agentName: string
    storedBalance: number
    calculatedBalance: number
    difference: number
  }>
}> {
  try {
    // Get all agents with wallet balances
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id, full_name, walletBalance")
      .not("walletBalance", "is", null)

    if (agentsError) {
      console.error("❌ Error fetching agents for sync report:", agentsError)
      throw agentsError
    }

    const discrepancies: Array<{
      agentId: string
      agentName: string
      storedBalance: number
      calculatedBalance: number
      difference: number
    }> = []

    let totalDiscrepancyAmount = 0

    // Check each agent for discrepancies
    for (const agent of agents || []) {
      try {
        const { balance: calculatedBalance } = await calculateCorrectWalletBalance(agent.id)
        const storedBalance = Number(agent.walletBalance) || 0
        const difference = Math.abs(calculatedBalance - storedBalance)

        if (difference > 0.01) {
          discrepancies.push({
            agentId: agent.id,
            agentName: agent.full_name || "Unknown",
            storedBalance,
            calculatedBalance,
            difference,
          })
          totalDiscrepancyAmount += difference
        }
      } catch (error) {
        console.warn(`⚠️ Error checking agent ${agent.id}:`, error)
      }
    }

    // Sort by difference (highest first) and take top 10
    const topDiscrepancies = discrepancies.sort((a, b) => b.difference - a.difference).slice(0, 10)

    return {
      summary: {
        totalAgents: agents?.length || 0,
        agentsWithDiscrepancies: discrepancies.length,
        totalDiscrepancyAmount,
        lastSyncDate: new Date().toISOString(),
      },
      topDiscrepancies,
    }
  } catch (error) {
    console.error("❌ Error generating wallet sync report:", error)
    return {
      summary: {
        totalAgents: 0,
        agentsWithDiscrepancies: 0,
        totalDiscrepancyAmount: 0,
        lastSyncDate: null,
      },
      topDiscrepancies: [],
    }
  }
}

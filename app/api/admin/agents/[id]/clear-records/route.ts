import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { id: agentId } = await params
    const body = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    if (!body.confirm || body.confirm !== true) {
      return NextResponse.json({ error: "Confirmation required for this critical operation" }, { status: 400 })
    }

    const db = getAdminClient()

    // Verify agent exists
    const { data: agent, error: agentError } = await db
      .from("agents")
      .select("id, full_name, phone_number, wallet_balance")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    console.log(`🚨 CLEARING ALL TRANSACTIONAL RECORDS: Agent ${agent.full_name}`)

    const clearingCounts = {
      withdrawals: 0,
      wallet_transactions: 0,
      wallet_topups: 0,
      data_orders: 0,
      wholesale_orders: 0,
      commission_deposits: 0,
      commissions: 0,
      referrals: 0,
      project_chats: 0,
      agent_sessions: 0,
      pending_transactions: 0,
    }

    // PERMANENT SOLUTION: Clear records in the correct order to handle foreign keys
    try {
      // STEP 1: Clear withdrawals FIRST (they reference wallet_transactions)
      console.log("Step 1: Clearing withdrawals...")

      // Clear withdrawals that reference this agent's wallet transactions
      const { data: agentWalletTxIds } = await db.from("wallet_transactions").select("id").eq("agent_id", agentId)

      const walletTxIds = agentWalletTxIds?.map((tx) => tx.id) || []

      if (walletTxIds.length > 0) {
        const { data: withdrawalsByWalletTx, error: withdrawalError1 } = await db
          .from("withdrawals")
          .delete()
          .in("wallet_transaction_id", walletTxIds)
          .select("id")

        if (withdrawalError1) {
          console.warn("Error clearing withdrawals by wallet_transaction_id:", withdrawalError1)
        } else {
          clearingCounts.withdrawals += withdrawalsByWalletTx?.length || 0
        }
      }

      // Clear withdrawals directly linked to agent
      const { data: withdrawalsByAgent, error: withdrawalError2 } = await db
        .from("withdrawals")
        .delete()
        .eq("agent_id", agentId)
        .select("id")

      if (withdrawalError2) {
        console.warn("Error clearing withdrawals by agent_id:", withdrawalError2)
      } else {
        clearingCounts.withdrawals += withdrawalsByAgent?.length || 0
      }

      console.log(`✅ Cleared ${clearingCounts.withdrawals} withdrawals`)

      // STEP 2: Clear wallet_transactions AFTER withdrawals
      console.log("Step 2: Clearing wallet transactions...")
      const { data: deletedWalletTx, error: walletError } = await db
        .from("wallet_transactions")
        .delete()
        .eq("agent_id", agentId)
        .select("id")

      if (walletError) {
        console.error("CRITICAL: Failed to clear wallet transactions:", walletError)
        throw new Error(`Failed to clear wallet transactions: ${walletError.message}`)
      }
      clearingCounts.wallet_transactions = deletedWalletTx?.length || 0
      console.log(`✅ Cleared ${clearingCounts.wallet_transactions} wallet transactions`)

      console.log("Step 2.5: Clearing wallet topups...")
      try {
        const { data: deletedTopups, error: topupsError } = await db
          .from("wallet_topups")
          .delete()
          .eq("agent_id", agentId)
          .select("id")

        if (!topupsError) {
          clearingCounts.wallet_topups = deletedTopups?.length || 0
          console.log(`✅ Cleared ${clearingCounts.wallet_topups} wallet topups`)
        }
      } catch (e) {
        console.warn("Wallet topups table may not exist or accessible")
      }

      // STEP 3: Clear other tables (safe to clear in any order)
      console.log("Step 3: Clearing other transactional records...")

      try {
        const { data: deletedCommissions, error: commissionsError } = await db
          .from("commissions")
          .delete()
          .eq("agent_id", agentId)
          .select("id")

        if (!commissionsError) {
          clearingCounts.commissions = deletedCommissions?.length || 0
          console.log(`✅ Cleared ${clearingCounts.commissions} direct commissions`)
        }
      } catch (e) {
        console.warn("Commissions table may not exist or accessible")
      }

      // Commission deposits
      try {
        const { data: deletedCommissionDeposits, error: commissionError } = await db
          .from("commission_deposits")
          .delete()
          .eq("agent_id", agentId)
          .select("id")

        if (!commissionError) {
          clearingCounts.commission_deposits = deletedCommissionDeposits?.length || 0
          console.log(`✅ Cleared ${clearingCounts.commission_deposits} commission deposits`)
        }
      } catch (e) {
        console.warn("Commission deposits table may not exist or accessible")
      }

      // Data orders
      try {
        const { data: deletedDataOrders, error: dataOrdersError } = await db
          .from("data_orders")
          .delete()
          .eq("agent_id", agentId)
          .select("id")

        if (!dataOrdersError) {
          clearingCounts.data_orders = deletedDataOrders?.length || 0
          console.log(`✅ Cleared ${clearingCounts.data_orders} data orders`)
        }
      } catch (e) {
        console.warn("Data orders table may not exist or accessible")
      }

      // Wholesale orders
      try {
        const { data: deletedWholesale, error: wholesaleError } = await db
          .from("wholesale_orders")
          .delete()
          .eq("agent_id", agentId)
          .select("id")

        if (!wholesaleError) {
          clearingCounts.wholesale_orders = deletedWholesale?.length || 0
          console.log(`✅ Cleared ${clearingCounts.wholesale_orders} wholesale orders`)
        }
      } catch (e) {
        console.warn("Wholesale orders table may not exist or accessible")
      }

      // Referrals
      try {
        const { data: deletedReferrals, error: referralsError } = await db
          .from("referrals")
          .delete()
          .or(`agent_id.eq.${agentId},referrer_id.eq.${agentId}`)
          .select("id")

        if (!referralsError) {
          clearingCounts.referrals = deletedReferrals?.length || 0
          console.log(`✅ Cleared ${clearingCounts.referrals} referrals`)
        }
      } catch (e) {
        console.warn("Referrals table may not exist or accessible")
      }

      try {
        const { data: deletedChats, error: chatsError } = await db
          .from("project_chats")
          .delete()
          .eq("agent_id", agentId)
          .select("id")

        if (!chatsError) {
          clearingCounts.project_chats = deletedChats?.length || 0
          console.log(`✅ Cleared ${clearingCounts.project_chats} project chats`)
        }
      } catch (e) {
        console.warn("Project chats table may not exist or accessible")
      }

      // Agent sessions
      try {
        const { data: deletedSessions, error: sessionsError } = await db
          .from("agent_sessions")
          .delete()
          .eq("agent_id", agentId)
          .select("id")

        if (!sessionsError) {
          clearingCounts.agent_sessions = deletedSessions?.length || 0
          console.log(`✅ Cleared ${clearingCounts.agent_sessions} agent sessions`)
        }
      } catch (e) {
        console.warn("Agent sessions table may not exist or accessible")
      }

      try {
        const { data: deletedPending, error: pendingError } = await db
          .from("pending_transactions")
          .delete()
          .eq("agent_id", agentId)
          .select("id")

        if (!pendingError) {
          clearingCounts.pending_transactions = deletedPending?.length || 0
          console.log(`✅ Cleared ${clearingCounts.pending_transactions} pending transactions`)
        }
      } catch (e) {
        console.warn("Pending transactions table may not exist or accessible")
      }

      // STEP 4: Reset agent balances and stats
      console.log("Step 4: Resetting agent balances and stats...")
      const { error: resetError } = await db
        .from("agents")
        .update({
          wallet_balance: 0,
          commission_balance: 0,
          total_commission_earned: 0,
          total_orders: 0,
          total_referrals: 0,
          total_earnings: 0,
          total_withdrawals: 0,
          pending_commission: 0,
          available_commission: 0,
          last_order_at: null,
          last_referral_at: null,
          last_withdrawal_at: null,
          last_commission_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentId)

      if (resetError) {
        console.error("Error resetting agent balances:", resetError)
        // Don't fail the entire operation for this
      } else {
        console.log("✅ Reset agent balances and stats to zero")
      }

      const totalCleared = Object.values(clearingCounts).reduce((sum, count) => sum + count, 0)

      console.log(`🎯 SUCCESS: Cleared ${totalCleared} total records for agent ${agent.full_name}`)

      // Create audit log
      try {
        await db.from("agent_clearing_audit").insert({
          agent_id: agentId,
          agent_name: agent.full_name,
          cleared_by: "admin_system",
          cleared_counts: clearingCounts,
          success: true,
          clearing_method: "comprehensive_solution_v3",
          clearing_timestamp: new Date().toISOString(),
        })
      } catch (auditError) {
        console.warn("Could not create audit log:", auditError)
      }

      return NextResponse.json({
        success: true,
        message: `Successfully cleared all transactional records for agent ${agent.full_name}`,
        results: {
          agent_info: {
            id: agent.id,
            name: agent.full_name,
            phone_number: agent.phone_number,
          },
          cleared_counts: clearingCounts,
          total_records_cleared: totalCleared,
          operation_completed_at: new Date().toISOString(),
          clearing_method: "comprehensive_solution_v3",
          summary: `Cleared ${totalCleared} transactional records while preserving agent account`,
          detailed_summary: {
            financial_records:
              clearingCounts.withdrawals +
              clearingCounts.wallet_transactions +
              clearingCounts.wallet_topups +
              clearingCounts.commission_deposits +
              clearingCounts.commissions,
            order_records: clearingCounts.data_orders + clearingCounts.wholesale_orders,
            referral_records: clearingCounts.referrals + clearingCounts.project_chats,
            system_records: clearingCounts.agent_sessions + clearingCounts.pending_transactions,
            agent_reset: "All balances and counters reset to zero",
          },
        },
      })
    } catch (clearingError) {
      console.error("Error during record clearing:", clearingError)

      return NextResponse.json(
        {
          error: "Failed to clear agent records",
          details: clearingError instanceof Error ? clearingError.message : "Unknown error during clearing",
          suggestion: "This may be due to foreign key constraints. Consider running the database fix script first.",
          partial_results: clearingCounts,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Critical error during agent record clearing:", error)

    return NextResponse.json(
      {
        error: "Failed to clear agent records",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check server logs for detailed error information",
      },
      { status: 500 },
    )
  }
}

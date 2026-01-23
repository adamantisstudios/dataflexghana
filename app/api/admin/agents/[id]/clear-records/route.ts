import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resolvedParams = await params
    const agentId = resolvedParams.id
    const body = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    if (!body.confirm || body.confirm !== true) {
      return NextResponse.json({ error: "Confirmation required for this critical operation" }, { status: 400 })
    }

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
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
      const { data: agentWalletTxIds } = await supabase.from("wallet_transactions").select("id").eq("agent_id", agentId)

      const walletTxIds = agentWalletTxIds?.map((tx) => tx.id) || []

      if (walletTxIds.length > 0) {
        const { count: withdrawalsByWalletTx, error: withdrawalError1 } = await supabase
          .from("withdrawals")
          .delete()
          .in("wallet_transaction_id", walletTxIds)
          .select("*", { count: "exact", head: true })

        if (withdrawalError1) {
          console.warn("Error clearing withdrawals by wallet_transaction_id:", withdrawalError1)
        } else {
          clearingCounts.withdrawals += withdrawalsByWalletTx || 0
        }
      }

      // Clear withdrawals directly linked to agent
      const { count: withdrawalsByAgent, error: withdrawalError2 } = await supabase
        .from("withdrawals")
        .delete()
        .eq("agent_id", agentId)
        .select("*", { count: "exact", head: true })

      if (withdrawalError2) {
        console.warn("Error clearing withdrawals by agent_id:", withdrawalError2)
      } else {
        clearingCounts.withdrawals += withdrawalsByAgent || 0
      }

      console.log(`✅ Cleared ${clearingCounts.withdrawals} withdrawals`)

      // STEP 2: Clear wallet_transactions AFTER withdrawals
      console.log("Step 2: Clearing wallet transactions...")
      const { count: walletCount, error: walletError } = await supabase
        .from("wallet_transactions")
        .delete()
        .eq("agent_id", agentId)
        .select("*", { count: "exact", head: true })

      if (walletError) {
        console.error("CRITICAL: Failed to clear wallet transactions:", walletError)
        throw new Error(`Failed to clear wallet transactions: ${walletError.message}`)
      }
      clearingCounts.wallet_transactions = walletCount || 0
      console.log(`✅ Cleared ${clearingCounts.wallet_transactions} wallet transactions`)

      console.log("Step 2.5: Clearing wallet topups...")
      try {
        const { count: topupsCount, error: topupsError } = await supabase
          .from("wallet_topups")
          .delete()
          .eq("agent_id", agentId)
          .select("*", { count: "exact", head: true })

        if (!topupsError) {
          clearingCounts.wallet_topups = topupsCount || 0
          console.log(`✅ Cleared ${clearingCounts.wallet_topups} wallet topups`)
        }
      } catch (e) {
        console.warn("Wallet topups table may not exist or accessible")
      }

      // STEP 3: Clear other tables (safe to clear in any order)
      console.log("Step 3: Clearing other transactional records...")

      try {
        const { count: commissionsCount, error: commissionsError } = await supabase
          .from("commissions")
          .delete()
          .eq("agent_id", agentId)
          .select("*", { count: "exact", head: true })

        if (!commissionsError) {
          clearingCounts.commissions = commissionsCount || 0
          console.log(`✅ Cleared ${clearingCounts.commissions} direct commissions`)
        }
      } catch (e) {
        console.warn("Commissions table may not exist or accessible")
      }

      // Commission deposits
      try {
        const { count: commissionCount, error: commissionError } = await supabase
          .from("commission_deposits")
          .delete()
          .eq("agent_id", agentId)
          .select("*", { count: "exact", head: true })

        if (!commissionError) {
          clearingCounts.commission_deposits = commissionCount || 0
          console.log(`✅ Cleared ${clearingCounts.commission_deposits} commission deposits`)
        }
      } catch (e) {
        console.warn("Commission deposits table may not exist or accessible")
      }

      // Data orders
      try {
        const { count: dataOrdersCount, error: dataOrdersError } = await supabase
          .from("data_orders")
          .delete()
          .eq("agent_id", agentId)
          .select("*", { count: "exact", head: true })

        if (!dataOrdersError) {
          clearingCounts.data_orders = dataOrdersCount || 0
          console.log(`✅ Cleared ${clearingCounts.data_orders} data orders`)
        }
      } catch (e) {
        console.warn("Data orders table may not exist or accessible")
      }

      // Wholesale orders
      try {
        const { count: wholesaleCount, error: wholesaleError } = await supabase
          .from("wholesale_orders")
          .delete()
          .eq("agent_id", agentId)
          .select("*", { count: "exact", head: true })

        if (!wholesaleError) {
          clearingCounts.wholesale_orders = wholesaleCount || 0
          console.log(`✅ Cleared ${clearingCounts.wholesale_orders} wholesale orders`)
        }
      } catch (e) {
        console.warn("Wholesale orders table may not exist or accessible")
      }

      // Referrals
      try {
        const { count: referralsCount, error: referralsError } = await supabase
          .from("referrals")
          .delete()
          .or(`agent_id.eq.${agentId},referrer_id.eq.${agentId}`)
          .select("*", { count: "exact", head: true })

        if (!referralsError) {
          clearingCounts.referrals = referralsCount || 0
          console.log(`✅ Cleared ${clearingCounts.referrals} referrals`)
        }
      } catch (e) {
        console.warn("Referrals table may not exist or accessible")
      }

      try {
        const { count: chatsCount, error: chatsError } = await supabase
          .from("project_chats")
          .delete()
          .eq("agent_id", agentId)
          .select("*", { count: "exact", head: true })

        if (!chatsError) {
          clearingCounts.project_chats = chatsCount || 0
          console.log(`✅ Cleared ${clearingCounts.project_chats} project chats`)
        }
      } catch (e) {
        console.warn("Project chats table may not exist or accessible")
      }

      // Agent sessions
      try {
        const { count: sessionsCount, error: sessionsError } = await supabase
          .from("agent_sessions")
          .delete()
          .eq("agent_id", agentId)
          .select("*", { count: "exact", head: true })

        if (!sessionsError) {
          clearingCounts.agent_sessions = sessionsCount || 0
          console.log(`✅ Cleared ${clearingCounts.agent_sessions} agent sessions`)
        }
      } catch (e) {
        console.warn("Agent sessions table may not exist or accessible")
      }

      try {
        const { count: pendingCount, error: pendingError } = await supabase
          .from("pending_transactions")
          .delete()
          .eq("agent_id", agentId)
          .select("*", { count: "exact", head: true })

        if (!pendingError) {
          clearingCounts.pending_transactions = pendingCount || 0
          console.log(`✅ Cleared ${clearingCounts.pending_transactions} pending transactions`)
        }
      } catch (e) {
        console.warn("Pending transactions table may not exist or accessible")
      }

      // STEP 4: Reset agent balances and stats
      console.log("Step 4: Resetting agent balances and stats...")
      const { error: resetError } = await supabase
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
        await supabase.from("agent_clearing_audit").insert({
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

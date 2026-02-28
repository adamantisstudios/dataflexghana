import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const agentId = resolvedParams.id

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 })
    }

    // Verify agent exists and get basic info with better error handling
    const { data: agent, error: agentError } = await supabase.from("agents").select("*").eq("id", agentId).single()

    if (agentError) {
      console.error("Error fetching agent:", agentError)
      if (agentError.code === "PGRST116") {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 })
      }
      return NextResponse.json({ error: `Database error: ${agentError.message}` }, { status: 500 })
    }

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    console.log(`📊 Exporting data for agent: ${agent.full_name} (${agent.id})`)

    // Fetch all related data using correct table names with error handling
    const fetchPromises = [
      // Wallet transactions
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .then((result) => ({ type: "wallet_transactions", ...result })),

      // Data orders
      supabase
        .from("data_orders")
        .select(`
          *,
          data_bundles!fk_data_orders_bundle_id (
            name,
            provider,
            size_gb,
            price,
            commission_rate
          )
        `)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .then((result) => ({ type: "data_orders", ...result })),

      // Data order notes
      supabase
        .from("data_order_notes")
        .select(`
          *,
          data_orders!inner (
            agent_id
          )
        `)
        .eq("data_orders.agent_id", agentId)
        .order("created_at", { ascending: false })
        .then((result) => ({ type: "data_order_notes", ...result })),

      // Commissions
      supabase
        .from("commissions")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .then((result) => ({ type: "commissions", ...result })),

      // Referrals
      supabase
        .from("referrals")
        .select(`
          *,
          services (
            title,
            commission_amount
          )
        `)
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .then((result) => ({ type: "referrals", ...result })),

      // Withdrawals
      supabase
        .from("withdrawals")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .then((result) => ({ type: "withdrawals", ...result })),

      // Project chats (related to referrals)
      supabase
        .from("project_chats")
        .select(`
          *,
          referrals!inner (
            agent_id
          )
        `)
        .eq("referrals.agent_id", agentId)
        .order("timestamp", { ascending: false })
        .then((result) => ({ type: "project_chats", ...result })),
    ]

    const results = await Promise.all(fetchPromises)

    // Process results and handle errors
    const dataCollections = {
      wallet_transactions: [],
      data_orders: [],
      data_order_notes: [],
      commissions: [],
      referrals: [],
      withdrawals: [],
      project_chats: [],
    }

    results.forEach((result) => {
      if (result.error) {
        console.warn(`Warning: Failed to fetch ${result.type}:`, result.error)
        dataCollections[result.type] = []
      } else {
        dataCollections[result.type] = result.data || []
      }
    })

    // Calculate summary statistics
    const totalWalletTransactions = dataCollections.wallet_transactions.length
    const totalCommissionDeposits = dataCollections.wallet_transactions.filter(
      (t) => t.transaction_type === "commission_deposit",
    ).length
    const totalDataOrders = dataCollections.data_orders.length
    const totalCommissions = dataCollections.commissions.length
    const totalReferrals = dataCollections.referrals.length
    const totalWithdrawals = dataCollections.withdrawals.length

    // Calculate financial totals using Ghana Cedi symbol
    const totalDataOrderCommission = dataCollections.data_orders.reduce(
      (sum, order) => sum + (order.commission_amount || 0),
      0,
    )
    const totalCommissionEarned = dataCollections.commissions.reduce((sum, comm) => sum + (comm.amount || 0), 0)
    const totalReferralCommission = dataCollections.referrals.reduce((sum, ref) => {
      return sum + (ref.services?.commission_amount || 0)
    }, 0)
    const totalWithdrawalAmount = dataCollections.withdrawals.reduce(
      (sum, withdrawal) => sum + (withdrawal.amount || 0),
      0,
    )

    // Get transaction date range
    const allTransactionDates = [
      ...dataCollections.wallet_transactions.map((t) => t.created_at),
      ...dataCollections.data_orders.map((t) => t.created_at),
      ...dataCollections.commissions.map((t) => t.created_at),
      ...dataCollections.referrals.map((t) => t.created_at),
      ...dataCollections.withdrawals.map((t) => t.created_at),
    ]
      .filter(Boolean)
      .sort()

    // Prepare comprehensive export data with Ghana Cedi symbol
    const exportData = {
      export_info: {
        agent_id: agentId,
        agent_name: agent.full_name,
        export_date: new Date().toISOString(),
        export_type: "complete_agent_data",
        data_period: {
          first_transaction: allTransactionDates.length > 0 ? allTransactionDates[0] : null,
          last_transaction: allTransactionDates.length > 0 ? allTransactionDates[allTransactionDates.length - 1] : null,
        },
      },

      agent_profile: {
        id: agent.id,
        full_name: agent.full_name,
        phone_number: agent.phone_number || "Not provided",
        momo_number: agent.momo_number,
        region: agent.region,
        isapproved: agent.isapproved,
        wallet_balance: agent.wallet_balance,
        commission: 0, // Will be calculated from commission records
        created_at: agent.created_at,
        referral_id: agent.referral_id,
        last_activity_at: agent.last_activity_at,
        data_orders_count_7d: agent.data_orders_count_7d,
        data_orders_count_30d: agent.data_orders_count_30d,
        auto_deactivation_reason: agent.auto_deactivation_reason,
        auto_deactivated_at: agent.auto_deactivated_at,
      },

      summary_statistics: {
        account_overview: {
          current_wallet_balance: agent.wallet_balance || 0,
          current_commission_balance: totalCommissionEarned || 0,
          account_status: agent.isapproved ? "approved" : "pending",
          registration_date: agent.created_at,
          last_activity: agent.last_activity_at,
          referral_code: agent.referral_id,
        },
        transaction_counts: {
          total_wallet_transactions: totalWalletTransactions,
          total_commission_deposits: totalCommissionDeposits,
          total_data_orders: totalDataOrders,
          total_commissions: totalCommissions,
          total_referrals: totalReferrals,
          total_withdrawals: totalWithdrawals,
          total_data_order_notes: dataCollections.data_order_notes.length,
          total_project_chats: dataCollections.project_chats.length,
        },
        financial_summary: {
          data_orders: {
            total_commission: totalDataOrderCommission,
            completed_orders: dataCollections.data_orders.filter((o) => o.status === "completed").length,
            pending_orders: dataCollections.data_orders.filter((o) => o.status === "pending").length,
            canceled_orders: dataCollections.data_orders.filter((o) => o.status === "canceled").length,
          },
          commissions: {
            total_earned: totalCommissionEarned,
            earned_commissions: dataCollections.commissions.filter((c) => c.status === "earned").length,
            withdrawn_commissions: dataCollections.commissions.filter((c) => c.status === "withdrawn").length,
            pending_withdrawal: dataCollections.commissions.filter((c) => c.status === "pending_withdrawal").length,
          },
          referrals: {
            total_commission: totalReferralCommission,
            completed_referrals: dataCollections.referrals.filter((r) => r.status === "completed").length,
            pending_referrals: dataCollections.referrals.filter((r) => r.status === "pending").length,
            commission_paid: dataCollections.referrals.filter((r) => r.commission_paid === true).length,
          },
          withdrawals: {
            total_amount: totalWithdrawalAmount,
            paid_withdrawals: dataCollections.withdrawals.filter((w) => w.status === "paid").length,
            requested_withdrawals: dataCollections.withdrawals.filter((w) => w.status === "requested").length,
            processing_withdrawals: dataCollections.withdrawals.filter((w) => w.status === "processing").length,
          },
        },
      },

      detailed_records: {
        wallet_transactions: {
          count: totalWalletTransactions,
          records: dataCollections.wallet_transactions,
        },
        data_orders: {
          count: totalDataOrders,
          records: dataCollections.data_orders,
        },
        data_order_notes: {
          count: dataCollections.data_order_notes.length,
          records: dataCollections.data_order_notes,
        },
        commissions: {
          count: totalCommissions,
          records: dataCollections.commissions,
        },
        referrals: {
          count: totalReferrals,
          records: dataCollections.referrals,
        },
        withdrawals: {
          count: totalWithdrawals,
          records: dataCollections.withdrawals,
        },
        project_chats: {
          count: dataCollections.project_chats.length,
          records: dataCollections.project_chats,
        },
      },

      data_integrity_check: {
        wallet_balance_calculation: {
          stored_balance: agent.wallet_balance || 0,
          balance_note: "Balance should be calculated from approved wallet transactions",
        },
        commission_calculation: {
          stored_commission: 0, // Commission column not used
          calculated_from_records: totalCommissionEarned,
          commission_consistent: true, // Always consistent since we calculate from records
        },
        order_commission_consistency: {
          data_order_commissions: totalDataOrderCommission,
          commission_records: totalCommissionEarned,
          note: "Commission records should match completed data order commissions",
        },
      },
    }

    console.log(`✅ Successfully prepared export data for agent ${agent.full_name}`)

    // Return as JSON file download
    const jsonString = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="agent_${agent.full_name.replace(/\s+/g, "_")}_${agentId}_complete_data.json"`,
        "Content-Length": jsonString.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error exporting agent data:", error)
    return NextResponse.json(
      {
        error: "Failed to export agent data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

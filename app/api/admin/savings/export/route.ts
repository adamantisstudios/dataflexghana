import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// GET - Export savings data as CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "reports"
    const format = searchParams.get("format") || "csv"

    switch (type) {
      case "plans":
        return await exportSavingsPlans(format)
      case "withdrawals":
        return await exportWithdrawals(format)
      case "reports":
        return await exportSavingsReports(format)
      case "transactions":
        return await exportTransactions(format)
      case "agents":
        return await exportAgentSavings(format)
      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in export endpoint:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

// Export savings plans
async function exportSavingsPlans(format: string) {
  const { data: plans, error } = await supabase
    .from("savings_plans")
    .select(`
      id,
      name,
      description,
      interest_rate,
      minimum_amount,
      maximum_amount,
      duration_months,
      early_withdrawal_penalty,
      is_active,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to fetch savings plans")
  }

  const csvContent = convertToCSV([
    [
      "ID",
      "Name",
      "Description",
      "Interest Rate (%)",
      "Min Amount",
      "Max Amount",
      "Duration (Months)",
      "Early Withdrawal Penalty (%)",
      "Active",
      "Created At",
      "Updated At",
    ],
    ...(plans || []).map((plan) => [
      plan.id,
      plan.name,
      plan.description || "",
      plan.interest_rate,
      plan.minimum_amount,
      plan.maximum_amount || "",
      plan.duration_months,
      plan.early_withdrawal_penalty,
      plan.is_active ? "Yes" : "No",
      new Date(plan.created_at).toLocaleDateString(),
      new Date(plan.updated_at).toLocaleDateString(),
    ]),
  ])

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="savings_plans_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

// Export withdrawal requests
async function exportWithdrawals(format: string) {
  const { data: withdrawals, error } = await supabase
    .from("withdrawal_requests")
    .select(`
      id,
      agent_id,
      requested_amount,
      withdrawal_type,
      mobile_money_number,
      mobile_money_network,
      reason,
      status,
      admin_notes,
      created_at,
      processed_at,
      agents (
        full_name,
        email,
        phone_number
      ),
      agent_savings (
        current_balance,
        savings_plans (
          name
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to fetch withdrawal requests")
  }

  const csvContent = convertToCSV([
    [
      "ID",
      "Agent Name",
      "Agent Email",
      "Agent Phone",
      "Plan Name",
      "Requested Amount",
      "Current Balance",
      "Withdrawal Type",
      "Mobile Money Network",
      "Mobile Money Number",
      "Reason",
      "Status",
      "Admin Notes",
      "Created At",
      "Processed At",
    ],
    ...(withdrawals || []).map((withdrawal) => [
      withdrawal.id,
      withdrawal.agents?.full_name || "",
      withdrawal.agents?.phone_number || "",
      withdrawal.agents?.phone_number || "",
      withdrawal.agent_savings?.savings_plans?.name || "",
      withdrawal.requested_amount,
      withdrawal.agent_savings?.current_balance || "",
      withdrawal.withdrawal_type,
      withdrawal.mobile_money_network || "",
      withdrawal.mobile_money_number || "",
      withdrawal.reason || "",
      withdrawal.status,
      withdrawal.admin_notes || "",
      new Date(withdrawal.created_at).toLocaleDateString(),
      withdrawal.processed_at ? new Date(withdrawal.processed_at).toLocaleDateString() : "",
    ]),
  ])

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="withdrawal_requests_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

// Export comprehensive savings reports
async function exportSavingsReports(format: string) {
  const { data: savings, error } = await supabase
    .from("agent_savings")
    .select(`
      id,
      agent_id,
      principal_amount,
      current_balance,
      interest_earned,
      start_date,
      maturity_date,
      status,
      auto_renewal,
      created_at,
      updated_at,
      agents (
        full_name,
        email,
        phone_number
      ),
      savings_plans (
        name,
        interest_rate,
        duration_months
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to fetch savings data")
  }

  const csvContent = convertToCSV([
    [
      "Savings ID",
      "Agent Name",
      "Agent Email",
      "Agent Phone",
      "Plan Name",
      "Interest Rate (%)",
      "Duration (Months)",
      "Principal Amount",
      "Current Balance",
      "Interest Earned",
      "ROI (%)",
      "Start Date",
      "Maturity Date",
      "Status",
      "Auto Renewal",
      "Created At",
      "Updated At",
    ],
    ...(savings || []).map((saving) => {
      const roi =
        saving.principal_amount > 0 ? ((saving.interest_earned / saving.principal_amount) * 100).toFixed(2) : "0"
      return [
        saving.id,
        saving.agents?.full_name || "",
        saving.agents?.phone_number || "",
        saving.agents?.phone_number || "",
        saving.savings_plans?.name || "",
        saving.savings_plans?.interest_rate || "",
        saving.savings_plans?.duration_months || "",
        saving.principal_amount,
        saving.current_balance,
        saving.interest_earned,
        roi,
        new Date(saving.start_date).toLocaleDateString(),
        new Date(saving.maturity_date).toLocaleDateString(),
        saving.status,
        saving.auto_renewal ? "Yes" : "No",
        new Date(saving.created_at).toLocaleDateString(),
        new Date(saving.updated_at).toLocaleDateString(),
      ]
    }),
  ])

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="savings_report_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

// Export transactions
async function exportTransactions(format: string) {
  const { data: transactions, error } = await supabase
    .from("savings_transactions")
    .select(`
      id,
      transaction_type,
      amount,
      balance_after,
      description,
      reference_number,
      created_at,
      agent_savings (
        agent_id,
        agents (
          full_name,
          email
        ),
        savings_plans (
          name
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10000) // Limit to prevent memory issues

  if (error) {
    throw new Error("Failed to fetch transactions")
  }

  const csvContent = convertToCSV([
    [
      "Transaction ID",
      "Agent Name",
      "Agent Email",
      "Plan Name",
      "Transaction Type",
      "Amount",
      "Balance After",
      "Description",
      "Reference Number",
      "Date",
    ],
    ...(transactions || []).map((transaction) => [
      transaction.id,
      transaction.agent_savings?.agents?.full_name || "",
      transaction.agent_savings?.agents?.phone_number || "",
      transaction.agent_savings?.savings_plans?.name || "",
      transaction.transaction_type,
      transaction.amount,
      transaction.balance_after,
      transaction.description || "",
      transaction.reference_number || "",
      new Date(transaction.created_at).toLocaleDateString(),
    ]),
  ])

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="savings_transactions_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

// Export agent savings summary
async function exportAgentSavings(format: string) {
  const { data: agentSummary, error } = await supabase
    .from("agent_savings_overview")
    .select("*")
    .order("total_balance", { ascending: false })

  if (error) {
    // If view doesn't exist, create summary manually
    const { data: savings, error: savingsError } = await supabase.from("agent_savings").select(`
        agent_id,
        principal_amount,
        current_balance,
        interest_earned,
        status,
        agents (
          full_name,
          email,
          phone_number
        )
      `)

    if (savingsError) {
      throw new Error("Failed to fetch agent savings data")
    }

    // Group by agent
    const agentMap = new Map()
    savings?.forEach((saving) => {
      const agentId = saving.agent_id
      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          agent_id: agentId,
          agent_name: saving.agents?.full_name || "",
          agent_phone: saving.agents?.phone_number || "",
          agent_phone: saving.agents?.phone_number || "",
          total_accounts: 0,
          total_invested: 0,
          total_balance: 0,
          total_interest: 0,
          active_accounts: 0,
        })
      }

      const agent = agentMap.get(agentId)
      agent.total_accounts += 1
      agent.total_invested += Number.parseFloat(saving.principal_amount)
      agent.total_balance += Number.parseFloat(saving.current_balance)
      agent.total_interest += Number.parseFloat(saving.interest_earned)
      if (saving.status === "active") {
        agent.active_accounts += 1
      }
    })

    const agentSummaryData = Array.from(agentMap.values())

    const csvContent = convertToCSV([
      [
        "Agent ID",
        "Agent Name",
        "Agent Email",
        "Agent Phone",
        "Total Accounts",
        "Active Accounts",
        "Total Invested",
        "Total Balance",
        "Total Interest",
        "ROI (%)",
      ],
      ...agentSummaryData.map((agent) => [
        agent.agent_id,
        agent.agent_name,
        agent.agent_email,
        agent.agent_phone,
        agent.total_accounts,
        agent.active_accounts,
        agent.total_invested.toFixed(2),
        agent.total_balance.toFixed(2),
        agent.total_interest.toFixed(2),
        agent.total_invested > 0 ? ((agent.total_interest / agent.total_invested) * 100).toFixed(2) : "0",
      ]),
    ])

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="agent_savings_summary_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  }

  const csvContent = convertToCSV([
    [
      "Agent ID",
      "Total Accounts",
      "Total Invested",
      "Total Balance",
      "Total Interest",
      "Active Accounts",
      "Matured Accounts",
    ],
    ...(agentSummary || []).map((agent) => [
      agent.agent_id,
      agent.total_savings_accounts,
      agent.total_invested,
      agent.total_balance,
      agent.total_interest_earned,
      agent.active_accounts,
      agent.matured_accounts,
    ]),
  ])

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="agent_savings_summary_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

// Helper function to convert data to CSV format
function convertToCSV(data: any[][]): string {
  return data
    .map((row) =>
      row
        .map((field) => {
          // Handle fields that might contain commas or quotes
          if (typeof field === "string" && (field.includes(",") || field.includes('"') || field.includes("\n"))) {
            return `"${field.replace(/"/g, '""')}"`
          }
          return field
        })
        .join(","),
    )
    .join("\n")
}

import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

// GET - Generate comprehensive savings reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || "overview"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const format = searchParams.get("format") || "json"

    let reportData: any = {}

    switch (reportType) {
      case "overview":
        reportData = await generateOverviewReport(startDate, endDate)
        break
      case "plans":
        reportData = await generatePlansReport(startDate, endDate)
        break
      case "agents":
        reportData = await generateAgentsReport(startDate, endDate)
        break
      case "transactions":
        reportData = await generateTransactionsReport(startDate, endDate)
        break
      case "withdrawals":
        reportData = await generateWithdrawalsReport(startDate, endDate)
        break
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    if (format === "csv") {
      const csv = convertToCSV(reportData, reportType)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${reportType}_report_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}

async function generateOverviewReport(startDate?: string | null, endDate?: string | null) {
  // Overall statistics
  const { data: totalSavings } = await supabase
    .from("agent_savings")
    .select("principal_amount, current_balance, interest_earned, status")

  const { data: totalPlans } = await supabase.from("savings_plans").select("id, is_active")

  const { data: pendingWithdrawals } = await supabase
    .from("withdrawal_requests")
    .select("requested_amount")
    .eq("status", "pending")

  const activeSavings = totalSavings?.filter((s) => s.status === "active") || []
  const maturedSavings = totalSavings?.filter((s) => s.status === "matured") || []

  const totalPrincipal = totalSavings?.reduce((sum, s) => sum + Number.parseFloat(s.principal_amount), 0) || 0
  const totalBalance = totalSavings?.reduce((sum, s) => sum + Number.parseFloat(s.current_balance), 0) || 0
  const totalInterest = totalSavings?.reduce((sum, s) => sum + Number.parseFloat(s.interest_earned), 0) || 0
  const pendingAmount = pendingWithdrawals?.reduce((sum, w) => sum + Number.parseFloat(w.requested_amount), 0) || 0

  return {
    summary: {
      totalSavingsAccounts: totalSavings?.length || 0,
      activeSavingsAccounts: activeSavings.length,
      maturedSavingsAccounts: maturedSavings.length,
      totalSavingsPlans: totalPlans?.length || 0,
      activeSavingsPlans: totalPlans?.filter((p) => p.is_active).length || 0,
      totalPrincipalAmount: totalPrincipal,
      totalCurrentBalance: totalBalance,
      totalInterestEarned: totalInterest,
      pendingWithdrawalAmount: pendingAmount,
      averageReturnRate: totalPrincipal > 0 ? (totalInterest / totalPrincipal) * 100 : 0,
    },
    formattedSummary: {
      totalPrincipalAmount: `₵${totalPrincipal.toFixed(2)}`,
      totalCurrentBalance: `₵${totalBalance.toFixed(2)}`,
      totalInterestEarned: `₵${totalInterest.toFixed(2)}`,
      pendingWithdrawalAmount: `₵${pendingAmount.toFixed(2)}`,
      averageReturnRate: `${totalPrincipal > 0 ? ((totalInterest / totalPrincipal) * 100).toFixed(2) : "0.00"}%`,
    },
  }
}

async function generatePlansReport(startDate?: string | null, endDate?: string | null) {
  const { data: plans } = await supabase.from("savings_plans").select(`
      *,
      agent_savings (
        id,
        principal_amount,
        current_balance,
        interest_earned,
        status,
        created_at
      )
    `)

  const plansReport =
    plans?.map((plan) => {
      let savings = plan.agent_savings || []

      // Filter by date range if provided
      if (startDate) {
        savings = savings.filter((s) => new Date(s.created_at) >= new Date(startDate))
      }
      if (endDate) {
        savings = savings.filter((s) => new Date(s.created_at) <= new Date(endDate))
      }

      const totalAccounts = savings.length
      const activeAccounts = savings.filter((s) => s.status === "active").length
      const maturedAccounts = savings.filter((s) => s.status === "matured").length
      const totalPrincipal = savings.reduce((sum, s) => sum + Number.parseFloat(s.principal_amount), 0)
      const totalBalance = savings.reduce((sum, s) => sum + Number.parseFloat(s.current_balance), 0)
      const totalInterest = savings.reduce((sum, s) => sum + Number.parseFloat(s.interest_earned), 0)

      return {
        planId: plan.id,
        planName: plan.name,
        interestRate: plan.interest_rate,
        durationMonths: plan.duration_months,
        minimumAmount: plan.minimum_amount,
        maximumAmount: plan.maximum_amount,
        isActive: plan.is_active,
        totalAccounts,
        activeAccounts,
        maturedAccounts,
        totalPrincipal,
        totalBalance,
        totalInterest,
        averageAccountSize: totalAccounts > 0 ? totalPrincipal / totalAccounts : 0,
        formattedTotalPrincipal: `₵${totalPrincipal.toFixed(2)}`,
        formattedTotalBalance: `₵${totalBalance.toFixed(2)}`,
        formattedTotalInterest: `₵${totalInterest.toFixed(2)}`,
      }
    }) || []

  return { plans: plansReport }
}

async function generateAgentsReport(startDate?: string | null, endDate?: string | null) {
  let query = supabase.from("agent_savings").select(`
      agent_id,
      principal_amount,
      current_balance,
      interest_earned,
      status,
      created_at,
      savings_plans (
        name
      )
    `)

  if (startDate) {
    query = query.gte("created_at", startDate)
  }
  if (endDate) {
    query = query.lte("created_at", endDate)
  }

  const { data: savings } = await query

  // Group by agent
  const agentMap = new Map()

  savings?.forEach((saving) => {
    const agentId = saving.agent_id
    if (!agentMap.has(agentId)) {
      agentMap.set(agentId, {
        agentId,
        totalAccounts: 0,
        activeAccounts: 0,
        maturedAccounts: 0,
        totalPrincipal: 0,
        totalBalance: 0,
        totalInterest: 0,
        plans: new Set(),
      })
    }

    const agent = agentMap.get(agentId)
    agent.totalAccounts++
    if (saving.status === "active") agent.activeAccounts++
    if (saving.status === "matured") agent.maturedAccounts++
    agent.totalPrincipal += Number.parseFloat(saving.principal_amount)
    agent.totalBalance += Number.parseFloat(saving.current_balance)
    agent.totalInterest += Number.parseFloat(saving.interest_earned)
    agent.plans.add(saving.savings_plans?.name)
  })

  const agentsReport = Array.from(agentMap.values()).map((agent) => ({
    ...agent,
    plans: Array.from(agent.plans),
    averageAccountSize: agent.totalAccounts > 0 ? agent.totalPrincipal / agent.totalAccounts : 0,
    returnRate: agent.totalPrincipal > 0 ? (agent.totalInterest / agent.totalPrincipal) * 100 : 0,
    formattedTotalPrincipal: `₵${agent.totalPrincipal.toFixed(2)}`,
    formattedTotalBalance: `₵${agent.totalBalance.toFixed(2)}`,
    formattedTotalInterest: `₵${agent.totalInterest.toFixed(2)}`,
  }))

  return { agents: agentsReport }
}

async function generateTransactionsReport(startDate?: string | null, endDate?: string | null) {
  let query = supabase
    .from("savings_transactions")
    .select(`
      *,
      agent_savings (
        agent_id,
        savings_plans (
          name
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (startDate) {
    query = query.gte("created_at", startDate)
  }
  if (endDate) {
    query = query.lte("created_at", endDate)
  }

  const { data: transactions } = await query

  const transactionsReport =
    transactions?.map((transaction) => ({
      transactionId: transaction.id,
      agentId: transaction.agent_savings?.agent_id,
      planName: transaction.agent_savings?.savings_plans?.name,
      transactionType: transaction.transaction_type,
      amount: transaction.amount,
      balanceAfter: transaction.balance_after,
      description: transaction.description,
      referenceNumber: transaction.reference_number,
      createdAt: transaction.created_at,
      formattedAmount: `₵${Math.abs(transaction.amount).toFixed(2)}`,
      formattedBalance: `₵${transaction.balance_after.toFixed(2)}`,
      formattedDate: new Date(transaction.created_at).toLocaleDateString("en-GB"),
    })) || []

  return { transactions: transactionsReport }
}

async function generateWithdrawalsReport(startDate?: string | null, endDate?: string | null) {
  let query = supabase
    .from("withdrawal_requests")
    .select(`
      *,
      agent_savings (
        agent_id,
        savings_plans (
          name,
          early_withdrawal_penalty
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (startDate) {
    query = query.gte("created_at", startDate)
  }
  if (endDate) {
    query = query.lte("created_at", endDate)
  }

  const { data: withdrawals } = await query

  const withdrawalsReport =
    withdrawals?.map((withdrawal) => {
      let penaltyAmount = 0
      if (withdrawal.withdrawal_type === "early" && withdrawal.agent_savings?.savings_plans?.early_withdrawal_penalty) {
        penaltyAmount =
          (withdrawal.requested_amount * withdrawal.agent_savings.savings_plans.early_withdrawal_penalty) / 100
      }

      return {
        withdrawalId: withdrawal.id,
        agentId: withdrawal.agent_savings?.agent_id,
        planName: withdrawal.agent_savings?.savings_plans?.name,
        requestedAmount: withdrawal.requested_amount,
        withdrawalType: withdrawal.withdrawal_type,
        penaltyAmount,
        netAmount: withdrawal.requested_amount - penaltyAmount,
        mobileMoneyNumber: withdrawal.mobile_money_number,
        mobileMoneyNetwork: withdrawal.mobile_money_network,
        status: withdrawal.status,
        reason: withdrawal.reason,
        adminNotes: withdrawal.admin_notes,
        createdAt: withdrawal.created_at,
        processedAt: withdrawal.processed_at,
        formattedRequestedAmount: `₵${withdrawal.requested_amount.toFixed(2)}`,
        formattedPenaltyAmount: penaltyAmount > 0 ? `₵${penaltyAmount.toFixed(2)}` : "₵0.00",
        formattedNetAmount: `₵${(withdrawal.requested_amount - penaltyAmount).toFixed(2)}`,
        formattedDate: new Date(withdrawal.created_at).toLocaleDateString("en-GB"),
      }
    }) || []

  return { withdrawals: withdrawalsReport }
}

function convertToCSV(data: any, reportType: string): string {
  let rows: string[] = []

  switch (reportType) {
    case "overview":
      rows = [
        "Metric,Value",
        `Total Savings Accounts,${data.summary.totalSavingsAccounts}`,
        `Active Savings Accounts,${data.summary.activeSavingsAccounts}`,
        `Matured Savings Accounts,${data.summary.maturedSavingsAccounts}`,
        `Total Principal Amount,${data.formattedSummary.totalPrincipalAmount}`,
        `Total Current Balance,${data.formattedSummary.totalCurrentBalance}`,
        `Total Interest Earned,${data.formattedSummary.totalInterestEarned}`,
        `Pending Withdrawal Amount,${data.formattedSummary.pendingWithdrawalAmount}`,
        `Average Return Rate,${data.formattedSummary.averageReturnRate}`,
      ]
      break

    case "plans":
      rows = [
        "Plan Name,Interest Rate,Duration (Months),Min Amount,Max Amount,Active,Total Accounts,Active Accounts,Matured Accounts,Total Principal,Total Balance,Total Interest",
      ]
      data.plans.forEach((plan: any) => {
        rows.push(
          `"${plan.planName}",${plan.interestRate},${plan.durationMonths},${plan.minimumAmount},${plan.maximumAmount || "Unlimited"},${plan.isActive ? "Yes" : "No"},${plan.totalAccounts},${plan.activeAccounts},${plan.maturedAccounts},${plan.formattedTotalPrincipal},${plan.formattedTotalBalance},${plan.formattedTotalInterest}`,
        )
      })
      break

    case "agents":
      rows = [
        "Agent ID,Total Accounts,Active Accounts,Matured Accounts,Total Principal,Total Balance,Total Interest,Return Rate,Plans",
      ]
      data.agents.forEach((agent: any) => {
        rows.push(
          `${agent.agentId},${agent.totalAccounts},${agent.activeAccounts},${agent.maturedAccounts},${agent.formattedTotalPrincipal},${agent.formattedTotalBalance},${agent.formattedTotalInterest},${agent.returnRate.toFixed(2)}%,"${agent.plans.join(", ")}"`,
        )
      })
      break

    case "transactions":
      rows = ["Transaction ID,Agent ID,Plan Name,Type,Amount,Balance After,Description,Reference,Date"]
      data.transactions.forEach((transaction: any) => {
        rows.push(
          `${transaction.transactionId},${transaction.agentId},"${transaction.planName}",${transaction.transactionType},${transaction.formattedAmount},${transaction.formattedBalance},"${transaction.description}",${transaction.referenceNumber},${transaction.formattedDate}`,
        )
      })
      break

    case "withdrawals":
      rows = [
        "Withdrawal ID,Agent ID,Plan Name,Requested Amount,Type,Penalty Amount,Net Amount,Mobile Money,Network,Status,Date",
      ]
      data.withdrawals.forEach((withdrawal: any) => {
        rows.push(
          `${withdrawal.withdrawalId},${withdrawal.agentId},"${withdrawal.planName}",${withdrawal.formattedRequestedAmount},${withdrawal.withdrawalType},${withdrawal.formattedPenaltyAmount},${withdrawal.formattedNetAmount},${withdrawal.mobileMoneyNumber},${withdrawal.mobileMoneyNetwork},${withdrawal.status},${withdrawal.formattedDate}`,
        )
      })
      break
  }

  return rows.join("\n")
}

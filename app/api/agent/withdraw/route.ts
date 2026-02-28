import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not set")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export const POST = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json()
    const { agent_id, amount, momo_number } = body

    // Verify agent can only create withdrawals for themselves (unless admin)
    if (user.role === "agent" && agent_id && agent_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Use authenticated user's ID if no agent_id provided, or allow admin to specify
    const targetAgentId = agent_id || user.id

    if (!targetAgentId || !amount || !momo_number) {
      return NextResponse.json(
        {
          error: "All fields are required: amount, momo_number",
        },
        { status: 400 },
      )
    }

    const withdrawalAmount = Number(amount)
    if (withdrawalAmount <= 0) {
      return NextResponse.json({ error: "Withdrawal amount must be positive" }, { status: 400 })
    }

    // Get agent's commission summary to validate available balance
    const commissionSummary = await getAgentCommissionSummary(targetAgentId)

    if (withdrawalAmount > commissionSummary.availableCommissions) {
      return NextResponse.json(
        {
          error: `Insufficient commission balance. Available: GH₵${commissionSummary.availableCommissions.toFixed(2)}, Requested: GH₵${withdrawalAmount.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Check for existing pending withdrawal requests
    const { data: existingRequests, error: requestError } = await supabase
      .from("withdrawals")
      .select("id, status, amount")
      .eq("agent_id", targetAgentId)
      .in("status", ["requested", "processing"])

    if (requestError) {
      console.error("Error checking existing requests:", requestError)
      return NextResponse.json({ error: "Failed to process withdrawal request" }, { status: 500 })
    }

    if (existingRequests && existingRequests.length > 0) {
      return NextResponse.json(
        {
          error: "You already have a pending withdrawal request. Please wait for it to be processed.",
        },
        { status: 400 },
      )
    }

    // Check for duplicate amount requests in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentRequests, error: recentError } = await supabase
      .from("withdrawals")
      .select("id, amount, requested_at")
      .eq("agent_id", targetAgentId)
      .eq("amount", withdrawalAmount)
      .gte("requested_at", twentyFourHoursAgo)

    if (recentError) {
      console.error("Error checking recent requests:", recentError)
      return NextResponse.json({ error: "Failed to validate withdrawal request" }, { status: 500 })
    }

    if (recentRequests && recentRequests.length > 0) {
      return NextResponse.json(
        {
          error: `You recently requested this same amount (GH₵${withdrawalAmount}). Please wait 24 hours or choose a different amount.`,
        },
        { status: 400 },
      )
    }

    // Create withdrawal request
    const { data: withdrawalRequest, error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert({
        agent_id: targetAgentId,
        amount: withdrawalAmount,
        momo_number: momo_number,
        status: "requested",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error("Error creating withdrawal request:", withdrawalError)

      // Handle specific database constraint violations
      if (withdrawalError.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          {
            error: "A withdrawal request is already active. Please wait for it to be processed.",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 })
    }

    // Update commission items to mark them as pending withdrawal
    const { error: commissionUpdateError } = await supabase
      .from("commissions")
      .update({
        status: "pending_withdrawal",
        withdrawal_id: withdrawalRequest.id,
        updated_at: new Date().toISOString(),
      })
      .eq("agent_id", targetAgentId)
      .eq("status", "earned")
      .lte("amount", withdrawalAmount)

    if (commissionUpdateError) {
      console.error("Error updating commission status:", commissionUpdateError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawalRequest: {
        id: withdrawalRequest.id,
        amount: withdrawalAmount,
        status: "requested",
        requested_at: withdrawalRequest.requested_at,
      },
    })
  } catch (error) {
    console.error("Error in POST /api/agent/withdraw:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

function arrayToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) {
    return headers.join(",") + "\n"
  }

  const csvRows = [headers.join(",")]

  data.forEach((row) => {
    const values = headers.map((header) => {
      let value = row[header]
      if (value === null || value === undefined) {
        value = ""
      } else if (typeof value === "object") {
        value = JSON.stringify(value)
      } else {
        value = String(value)
      }
      // Escape quotes and wrap in quotes if contains comma or quote
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        value = '"' + value.replace(/"/g, '""') + '"'
      }
      return value
    })
    csvRows.push(values.join(","))
  })

  return csvRows.join("\n")
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    const [agentsResult, dataOrdersResult, walletTransactionsResult, commissionsResult] = await Promise.all([
      supabase
        .from("agents")
        .select(`
          id,
          full_name,
          email,
          phone_number,
          status,
          available_commission_balance,
          totalEarnings,
          total_commission_earned,
          created_at,
          last_login_at
        `)
        .order("created_at", { ascending: false }),

      supabase
        .from("data_orders")
        .select(`
          id,
          agent_id,
          agents!inner(full_name),
          data_type,
          amount,
          phone_number,
          status,
          created_at,
          completed_at
        `)
        .order("created_at", { ascending: false }),

      supabase
        .from("wallet_transactions")
        .select(`
          id,
          agent_id,
          agents!inner(full_name),
          type,
          amount,
          description,
          status,
          created_at
        `)
        .order("created_at", { ascending: false }),

      supabase
        .from("commissions")
        .select(`
          id,
          agent_id,
          agents!inner(full_name),
          order_id,
          amount,
          rate,
          status,
          created_at,
          paid_at
        `)
        .order("created_at", { ascending: false }),
    ])

    if (agentsResult.error || dataOrdersResult.error || walletTransactionsResult.error || commissionsResult.error) {
      throw new Error("Failed to fetch data from database")
    }

    // Prepare agents data
    const agentsData = (agentsResult.data || []).map((row: any) => ({
      "Agent ID": row.id,
      Name: row.full_name,
      Email: row.email,
      Phone: row.phone_number,
      Status: row.status,
      "Commission Balance": row.available_commission_balance || 0,
      "Total Earnings": row.totalEarnings || 0,
      "Total Commission": row.total_commission_earned || 0,
      "Created At": new Date(row.created_at).toLocaleDateString(),
      "Last Login": row.last_login_at ? new Date(row.last_login_at).toLocaleDateString() : "Never",
    }))

    const agentsCSV = arrayToCSV(agentsData, [
      "Agent ID",
      "Name",
      "Email",
      "Phone",
      "Status",
      "Commission Balance",
      "Total Earnings",
      "Total Commission",
      "Created At",
      "Last Login",
    ])

    // Prepare data orders data
    const dataOrdersData = (dataOrdersResult.data || []).map((row: any) => ({
      "Order ID": row.id,
      "Agent ID": row.agent_id,
      "Agent Name": row.agents?.full_name || "N/A",
      "Data Type": row.data_type,
      Amount: row.amount,
      "Phone Number": row.phone_number,
      Status: row.status,
      "Created At": new Date(row.created_at).toLocaleDateString(),
      "Completed At": row.completed_at ? new Date(row.completed_at).toLocaleDateString() : "Pending",
    }))

    const dataOrdersCSV = arrayToCSV(dataOrdersData, [
      "Order ID",
      "Agent ID",
      "Agent Name",
      "Data Type",
      "Amount",
      "Phone Number",
      "Status",
      "Created At",
      "Completed At",
    ])

    // Prepare wallet transactions data
    const walletTransactionsData = (walletTransactionsResult.data || []).map((row: any) => ({
      "Transaction ID": row.id,
      "Agent ID": row.agent_id,
      "Agent Name": row.agents?.full_name || "N/A",
      Type: row.type,
      Amount: row.amount,
      Description: row.description,
      Status: row.status,
      "Created At": new Date(row.created_at).toLocaleDateString(),
    }))

    const walletTransactionsCSV = arrayToCSV(walletTransactionsData, [
      "Transaction ID",
      "Agent ID",
      "Agent Name",
      "Type",
      "Amount",
      "Description",
      "Status",
      "Created At",
    ])

    // Prepare commissions data
    const commissionsData = (commissionsResult.data || []).map((row: any) => ({
      "Commission ID": row.id,
      "Agent ID": row.agent_id,
      "Agent Name": row.agents?.full_name || "N/A",
      "Order ID": row.order_id,
      Amount: row.amount,
      "Rate (%)": row.rate,
      Status: row.status,
      "Created At": new Date(row.created_at).toLocaleDateString(),
      "Paid At": row.paid_at ? new Date(row.paid_at).toLocaleDateString() : "Unpaid",
    }))

    const commissionsCSV = arrayToCSV(commissionsData, [
      "Commission ID",
      "Agent ID",
      "Agent Name",
      "Order ID",
      "Amount",
      "Rate (%)",
      "Status",
      "Created At",
      "Paid At",
    ])

    // Combine all CSVs into one file with section headers
    const combinedCSV = `AGENTS REPORT
${agentsCSV}

DATA ORDERS REPORT
${dataOrdersCSV}

WALLET TRANSACTIONS REPORT
${walletTransactionsCSV}

COMMISSIONS REPORT
${commissionsCSV}
`

    // Set CSV headers
    const headers = new Headers()
    headers.set("Content-Type", "text/csv;charset=utf-8;")
    headers.set(
      "Content-Disposition",
      `attachment; filename="agents_export_${new Date().toISOString().split("T")[0]}.csv"`,
    )

    return new NextResponse(combinedCSV, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("❌ Export error:", error)

    if (error instanceof Error) {
      if (error.message.includes("Supabase")) {
        return NextResponse.json(
          { error: "Database configuration error. Please check environment variables." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}

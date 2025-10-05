import { type NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import * as XLSX from "xlsx"
import { supabase } from "@/lib/supabase"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
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

export async function GET(request: NextRequest) {
  try {
    const dbPool = getPool()

    // Get agents data
    const agentsQuery = `
      SELECT 
        a.id as agent_id,
        a.full_name as name,
        a.email,
        a.phone_number as phone,
        a.status,
        a.available_commission_balance as commission_rate,
        a.totalEarnings as total_sales,
        a.total_commission_earned as total_commission,
        a.created_at,
        a.last_login_at as last_login
      FROM agents a
      ORDER BY a.created_at DESC
    `

    // Get data orders
    const dataOrdersQuery = `
      SELECT 
        do.id,
        do.agent_id,
        a.full_name as agent_name,
        do.data_type,
        do.amount,
        do.phone_number,
        do.status,
        do.created_at,
        do.completed_at
      FROM data_orders do
      LEFT JOIN agents a ON do.agent_id = a.id
      ORDER BY do.created_at DESC
    `

    // Get wallet transactions
    const walletTransactionsQuery = `
      SELECT 
        wt.id,
        wt.agent_id,
        a.full_name as agent_name,
        wt.type,
        wt.amount,
        wt.description,
        wt.status,
        wt.created_at
      FROM wallet_transactions wt
      LEFT JOIN agents a ON wt.agent_id = a.id
      ORDER BY wt.created_at DESC
    `

    // Get commission data
    const commissionsQuery = `
      SELECT 
        c.id,
        c.agent_id,
        a.full_name as agent_name,
        c.order_id,
        c.amount,
        c.rate,
        c.status,
        c.created_at,
        c.paid_at
      FROM commissions c
      LEFT JOIN agents a ON c.agent_id = a.id
      ORDER BY c.created_at DESC
    `

    const [agentsResult, dataOrdersResult, walletTransactionsResult, commissionsResult] = await Promise.all([
      dbPool.query(agentsQuery),
      dbPool.query(dataOrdersQuery),
      dbPool.query(walletTransactionsQuery),
      dbPool.query(commissionsQuery),
    ])

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new()

    // Agents sheet
    const agentsWorksheet = XLSX.utils.json_to_sheet(
      agentsResult.rows.map((row) => ({
        "Agent ID": row.agent_id,
        Name: row.name,
        Email: row.email,
        Phone: row.phone,
        Status: row.status,
        "Commission Rate (%)": row.commission_rate,
        "Total Sales": row.total_sales || 0,
        "Total Commission": row.total_commission || 0,
        "Created At": new Date(row.created_at).toLocaleDateString(),
        "Last Login": row.last_login ? new Date(row.last_login).toLocaleDateString() : "Never",
      })),
    )
    XLSX.utils.book_append_sheet(workbook, agentsWorksheet, "Agents")

    // Data Orders sheet
    const dataOrdersWorksheet = XLSX.utils.json_to_sheet(
      dataOrdersResult.rows.map((row) => ({
        "Order ID": row.id,
        "Agent ID": row.agent_id,
        "Agent Name": row.agent_name,
        "Data Type": row.data_type,
        Amount: row.amount,
        "Phone Number": row.phone_number,
        Status: row.status,
        "Created At": new Date(row.created_at).toLocaleDateString(),
        "Completed At": row.completed_at ? new Date(row.completed_at).toLocaleDateString() : "Pending",
      })),
    )
    XLSX.utils.book_append_sheet(workbook, dataOrdersWorksheet, "Data Orders")

    // Wallet Transactions sheet
    const walletTransactionsWorksheet = XLSX.utils.json_to_sheet(
      walletTransactionsResult.rows.map((row) => ({
        "Transaction ID": row.id,
        "Agent ID": row.agent_id,
        "Agent Name": row.agent_name,
        Type: row.type,
        Amount: row.amount,
        Description: row.description,
        Status: row.status,
        "Created At": new Date(row.created_at).toLocaleDateString(),
      })),
    )
    XLSX.utils.book_append_sheet(workbook, walletTransactionsWorksheet, "Wallet Transactions")

    // Commissions sheet
    const commissionsWorksheet = XLSX.utils.json_to_sheet(
      commissionsResult.rows.map((row) => ({
        "Commission ID": row.id,
        "Agent ID": row.agent_id,
        "Agent Name": row.agent_name,
        "Order ID": row.order_id,
        Amount: row.amount,
        "Rate (%)": row.rate,
        Status: row.status,
        "Created At": new Date(row.created_at).toLocaleDateString(),
        "Paid At": row.paid_at ? new Date(row.paid_at).toLocaleDateString() : "Unpaid",
      })),
    )
    XLSX.utils.book_append_sheet(workbook, commissionsWorksheet, "Commissions")

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    // Set headers for file download
    const headers = new Headers()
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    headers.set(
      "Content-Disposition",
      `attachment; filename="agents_export_${new Date().toISOString().split("T")[0]}.xlsx"`,
    )

    return new NextResponse(excelBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("❌ Export error:", error)

    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL")) {
        return NextResponse.json(
          { error: "Database configuration error. Please check environment variables." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import * as XLSX from "xlsx"

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

export async function GET(request: NextRequest) {
  try {
    const dbPool = getPool()

    // Get agents data
    const agentsQuery = `
      SELECT 
        a.agent_id,
        a.name,
        a.email,
        a.phone,
        a.status,
        a.commission_rate,
        a.total_sales,
        a.total_commission,
        a.created_at,
        a.last_login,
        u.email as user_email,
        u.phone as user_phone
      FROM agents a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `

    // Get data orders
    const dataOrdersQuery = `
      SELECT 
        do.id,
        do.agent_id,
        a.name as agent_name,
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
        a.name as agent_name,
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
        a.name as agent_name,
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

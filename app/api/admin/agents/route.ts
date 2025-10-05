import { type NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"
import { authenticateAdmin } from "@/lib/api-auth"

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
    // CRITICAL FIX: Add proper admin authentication
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Admin authentication required" },
        { status: 401 },
      )
    }

    const admin = authResult.user
    console.log("✅ Admin authenticated for agents list:", admin.id)

    const dbPool = getPool()
    const query = `
      SELECT
        a.*,
        u.email as user_email,
        u.phone as user_phone,
        u.created_at as user_created_at,
        COUNT(do.id) as total_orders,
        COALESCE(SUM(do.amount), 0) as total_sales_amount,
        COALESCE(SUM(c.amount), 0) as total_commission_earned
      FROM agents a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN data_orders do ON a.id = do.agent_id AND do.status = 'completed'
      LEFT JOIN commissions c ON a.id = c.agent_id AND c.status = 'paid'
      GROUP BY a.id, u.email, u.phone, u.created_at
      ORDER BY a.created_at DESC
    `

    const result = await dbPool.query(query)

    return NextResponse.json({
      success: true,
      agents: result.rows,
      total: result.rows.length,
    })
  } catch (error) {
    console.error("❌ Error fetching agents:", error)

    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL")) {
        return NextResponse.json(
          { success: false, error: "Database configuration error. Please check environment variables." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ success: false, error: "Failed to fetch agents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // CRITICAL FIX: Add proper admin authentication
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Admin authentication required" },
        { status: 401 },
      )
    }

    const admin = authResult.user
    console.log("✅ Admin authenticated for agent creation:", admin.id)

    const body = await request.json()
    // Handle agent creation logic here

    return NextResponse.json({
      success: true,
      message: "Agent creation functionality would be implemented here",
    })
  } catch (error) {
    console.error("❌ Error creating agent:", error)
    return NextResponse.json({ success: false, error: "Failed to create agent" }, { status: 500 })
  }
}
